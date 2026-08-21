import { getEmployeeLicenses } from "@/lib/licenses-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeLicenses,
    "rows",
    "자격증 조회 실패",
  );
}
