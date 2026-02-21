import { POST as manualSyncPost } from "@/app/api/fitbit/manual-sync/route";

export async function POST() {
  return manualSyncPost();
}
