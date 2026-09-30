import { getEmployeeConstructionHistory } from "@/lib/construction-history-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeConstructionHistory,
    "rows",
    "공사경력 조회 실패",
  );
}
