import { getEmployeeCareer } from "@/lib/career-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeCareer,
    "rows",
    "경력 조회 실패",
  );
}
