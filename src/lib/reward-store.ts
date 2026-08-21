import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatHrDate } from "./format";
import type { EmployeeRewardPenalty } from "./types";

interface RewardPenaltyRow {
  company_seq: number;
  emp_seq: number;
  prz_pnl_seq: number;
  sm_prz_pnl_type_name: string | null;
  um_prz_pnl_name: string | null;
  prz_pnl_fr_date: string | null;
  prz_pnl_to_date: string | null;
  sm_in_out_type_name: string | null;
  prz_pnl_inst: string | null;
  prz_pnl_reason: string | null;
  cancellation_date: string | null;
}

function mapRewardPenalty(row: RewardPenaltyRow): EmployeeRewardPenalty {
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.prz_pnl_seq}`,
    typeName: firstNonEmpty(row.sm_prz_pnl_type_name),
    name: firstNonEmpty(row.um_prz_pnl_name),
    fromDate: formatHrDate(row.prz_pnl_fr_date),
    toDate: formatHrDate(row.prz_pnl_to_date),
    inOutName: firstNonEmpty(row.sm_in_out_type_name),
    institution: firstNonEmpty(row.prz_pnl_inst),
    reason: firstNonEmpty(row.prz_pnl_reason),
    cancelledDate: formatHrDate(row.cancellation_date),
  };
}

export function getEmployeeRewardPenalty(empNo: string, company?: string) {
  return fetchRelatedRows<RewardPenaltyRow, EmployeeRewardPenalty>({
    table: "employee_reward_penalty",
    columns:
      "company_seq, emp_seq, prz_pnl_seq, sm_prz_pnl_type_name, um_prz_pnl_name, prz_pnl_fr_date, prz_pnl_to_date, sm_in_out_type_name, prz_pnl_inst, prz_pnl_reason, cancellation_date",
    empNo,
    company,
    order: [
      { column: "prz_pnl_fr_date", ascending: false },
      { column: "prz_pnl_seq", ascending: true },
    ],
    map: mapRewardPenalty,
  });
}
