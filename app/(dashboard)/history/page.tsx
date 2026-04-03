import { getRealActivity } from "@/lib/actions/history";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const initialLogs = await getRealActivity();

  return <HistoryClient initialLogs={initialLogs} />;
}
