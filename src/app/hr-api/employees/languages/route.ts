import { getEmployeeLanguages } from "@/lib/languages-store";
import { relatedEmployeeGet } from "@/lib/related-api";

export function GET(request: Request) {
  return relatedEmployeeGet(
    request,
    getEmployeeLanguages,
    "rows",
    "어학 조회 실패",
  );
}
