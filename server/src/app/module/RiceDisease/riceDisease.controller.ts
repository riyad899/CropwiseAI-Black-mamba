/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { RiceDiseaseService } from "./riceDisease.service.js";

const getHealth = catchAsync(async (req: Request, res: Response) => {
  const result = await RiceDiseaseService.getHealth();
  sendResponse(res, {
    httpStatus: result.status === "ready" ? status.OK : status.SERVICE_UNAVAILABLE,
    success: result.status === "ready",
    message: result.status === "ready" ? "Rice Disease model is loaded and ready" : "Model is initializing or unavailable",
    data: result,
  });
});

const getModelInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await RiceDiseaseService.getModelInfo();
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Rice disease classification model metadata retrieved successfully",
    data: result,
  });
});

const predict = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      httpStatus: status.BAD_REQUEST,
      success: false,
      message: "Please upload a rice leaf image using the 'image' field",
      data: null,
    });
  }

  const userId = req.user?.userId || (req.body?.userId as string | undefined);
  const result = await RiceDiseaseService.analyzeLeaf(
    req.file.buffer,
    req.file.originalname,
    userId
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Rice leaf analysis completed successfully",
    data: result,
  });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendResponse(res, {
      httpStatus: status.UNAUTHORIZED,
      success: false,
      message: "Authentication required to view disease prediction history",
      data: null,
    });
  }

  const result = await RiceDiseaseService.getHistory(userId, req.query as any);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Rice disease diagnosis history retrieved successfully",
    data: result,
  });
});

const getHistoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const result = await RiceDiseaseService.getHistoryById(id as string, userId);
  if (!result) {
    return sendResponse(res, {
      httpStatus: status.NOT_FOUND,
      success: false,
      message: "Rice disease diagnosis record not found",
      data: null,
    });
  }

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Rice disease diagnosis record retrieved successfully",
    data: result,
  });
});

const deleteHistory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return sendResponse(res, {
      httpStatus: status.UNAUTHORIZED,
      success: false,
      message: "Authentication required to delete records",
      data: null,
    });
  }

  await RiceDiseaseService.deleteHistory(id as string, userId);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Rice disease diagnosis record deleted successfully",
    data: null,
  });
});

export const RiceDiseaseController = {
  getHealth,
  getModelInfo,
  predict,
  getHistory,
  getHistoryById,
  deleteHistory,
};
