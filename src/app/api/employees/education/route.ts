import { getEmployeeEducation } from "@/lib/education-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeEducation,
    "rows",
    "학력 조회 실패",
  );
}
