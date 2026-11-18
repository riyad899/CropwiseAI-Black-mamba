import { redirect } from "next/navigation";

export default function RelayControlRedirect() {
  redirect("/dashboard/device-status");
}
