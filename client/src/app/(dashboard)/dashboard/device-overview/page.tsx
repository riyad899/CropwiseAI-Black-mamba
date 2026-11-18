import { redirect } from "next/navigation";

export default function DeviceOverviewRedirect() {
  redirect("/dashboard/device-status");
}
