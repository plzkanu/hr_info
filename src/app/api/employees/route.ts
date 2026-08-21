import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { formatResidentId } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import {
  getEmployeeFilterOptions,
  searchEmployees,
} from "@/lib/employees-store";
import { parseCompanyFilter } from "@/lib/companies";
import type { EmployeeFilters } from "@/lib/types";

function parseFilters(url: URL): EmployeeFilters {
  const get = (key: string) => url.searchParams.get(key)?.trim() ?? "";
  return {
    company: parseCompanyFilter(get("company")),
    asOfDate: get("asOfDate"),
    empCategory: get("empCategory"),
    employType: get("employType"),
    empNo: get("empNo"),
    empName: get("empName"),
    hireDateFrom: get("hireDateFrom"),
    hireDateTo: get("hireDateTo"),
    resignDateFrom: get("resignDateFrom"),
    resignDateTo: get("resignDateTo"),
    nationalityType: get("nationalityType"),
    employmentStatus: url.searchParams.has("employmentStatus")
      ? get("employmentStatus")
      : "재직자",
    departmentName: get("departmentName"),
    includeSubDepartments: url.searchParams.get("includeSubDepartments") === "1",
    payrollGroup: get("payrollGroup"),
    englishName: get("englishName"),
    remarks: get("remarks"),
    includeExcluded: url.searchParams.get("includeExcluded") === "1",
  };
}

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const url = new URL(request.url);
    const company = parseCompanyFilter(url.searchParams.get("company"));
    if (url.searchParams.get("meta") === "1") {
      const options = await getEmployeeFilterOptions(company);
      return NextResponse.json({ options });
    }

    const filters = parseFilters(url);
    const { employees, rosterUnavailable } = await searchEmployees(filters);
    const revealFullResidentId = hasPermission(
      sessionOrResponse.permissions,
      "view_full_resident_id",
    );
    return NextResponse.json({
      employees: employees.map((employee) => ({
        ...employee,
        residentId: formatResidentId(employee.residentId, revealFullResidentId),
      })),
      total: employees.length,
      rosterUnavailable,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "사원 조회 실패" },
      { status: 500 },
    );
  }
}
