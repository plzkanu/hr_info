import { getEmployeeRewardPenalty } from "@/lib/reward-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeRewardPenalty,
    "rows",
    "상벌 조회 실패",
  );
}
