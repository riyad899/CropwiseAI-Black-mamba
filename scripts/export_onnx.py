#!/usr/bin/env python3
"""
One-time conversion script: PyTorch checkpoint (best_model.pth) -> ONNX (rice_leaf_efficientnet_b0.onnx)
Validated against model_info.pkl metadata.
"""
import os
import sys
import pickle
import torch
import torchvision.models as models

def export_onnx():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", "models"))
    pth_path = os.path.join(base_dir, "best_model.pth")
    info_path = os.path.join(base_dir, "model_info.pkl")
    onnx_path = os.path.join(base_dir, "rice_leaf_efficientnet_b0.onnx")

    print(f"Loading metadata from: {info_path}")
    with open(info_path, "rb") as f:
        info = pickle.load(f)

    print("Model Info loaded:")
    print(f"  Architecture: {info.get('architecture')}")
    print(f"  Classes ({len(info.get('classes', []))}): {info.get('classes')}")
    print(f"  Image size: {info.get('image_size')}")
    print(f"  Mean: {info.get('mean')}")
    print(f"  Std: {info.get('std')}")
    print(f"  Accuracy: {info.get('accuracy'):.4f}")
    print(f"  F1-Score: {info.get('f1_score'):.4f}")

    num_classes = len(info["classes"])
    assert num_classes == 10, f"Expected 10 classes, got {num_classes}"

    print(f"\nBuilding EfficientNet-B0 model with {num_classes} outputs...")
    model = models.efficientnet_b0(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)

    print(f"Loading state_dict from: {pth_path}")
    checkpoint = torch.load(pth_path, map_location="cpu")
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
        print(f"Loaded model_state_dict from checkpoint! Epoch: {checkpoint.get('epoch')}, Best Macro F1: {checkpoint.get('best_macro_f1')}")
    elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    elif isinstance(checkpoint, dict):
        state_dict = checkpoint
    else:
        state_dict = checkpoint.state_dict()

    model.load_state_dict(state_dict)
    model.eval()
    print("State dict loaded successfully!")

    # Verify forward pass with dummy input
    dummy_input = torch.randn(1, 3, info.get("image_size", 224), info.get("image_size", 224), dtype=torch.float32)
    with torch.no_grad():
        output = model(dummy_input)
        print(f"PyTorch dummy forward pass output shape: {output.shape}")
        assert output.shape == (1, 10), f"Expected shape (1, 10), got {output.shape}"

    print(f"\nExporting model to ONNX: {onnx_path}")
    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"}
        }
    )

    print(f"ONNX export successful! File size: {os.path.getsize(onnx_path)} bytes")

    # Validate ONNX model with onnx if available
    try:
        import onnx
        onnx_model = onnx.load(onnx_path)
        onnx.checker.check_model(onnx_model)
        print("ONNX model verification passed!")
    except ImportError:
        print("onnx package not installed, skipping onnx.checker validation.")

    # Save a clean JSON version of model_info for safe reading by Node.js
    import json
    json_info_path = os.path.join(base_dir, "model_info.json")
    with open(json_info_path, "w") as f:
        json.dump({
            "model_name": "EfficientNet-B0 Rice Leaf Disease Classifier",
            "architecture": info.get("architecture", "efficientnet_b0"),
            "num_classes": num_classes,
            "classes": info.get("classes"),
            "class_to_idx": info.get("class_to_idx"),
            "idx_to_class": {str(k): v for k, v in info.get("idx_to_class", {}).items()},
            "image_size": info.get("image_size", 224),
            "mean": info.get("mean", [0.485, 0.456, 0.406]),
            "std": info.get("std", [0.229, 0.224, 0.225]),
            "metrics": {
                "accuracy": info.get("accuracy", 0.9505),
                "precision": info.get("precision", 0.9378),
                "recall": info.get("recall", 0.9550),
                "f1_score": info.get("f1_score", 0.9456),
                "best_validation_macro_f1": info.get("best_validation_macro_f1", 0.9456)
            },
            "onnx_model_file": "rice_leaf_efficientnet_b0.onnx"
        }, f, indent=2)
    print(f"Safe metadata JSON exported to: {json_info_path}")

if __name__ == "__main__":
    export_onnx()
