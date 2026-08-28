import { formatAddress } from "@/lib/format";
import type { EmployeeHrCard } from "@/lib/types";

function v(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value);
}

function PhotoBox({ src }: { src: string }) {
  const usable =
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:");
  return (
    <div className="hr-card-photo">
      {usable ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : null}
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i}>&nbsp;</td>
      ))}
    </tr>
  );
}

export function EmployeeHrCardPrint({ cards }: { cards: EmployeeHrCard[] }) {
  if (cards.length === 0) return null;

  return (
    <div className="hr-card-print-root">
      {cards.map((card) => {
        const e = card.employee;
        const address = formatAddress(e.addressZip, e.address);
        return (
          <article key={e.id} className="hr-card-page">
            <h1 className="hr-card-title">인사기록카드</h1>

            <h2 className="hr-card-heading">기본이력</h2>
            <table className="hr-card-table">
              <colgroup>
                <col className="w-label" />
                <col className="w-sub" />
                <col />
                <col className="w-label" />
                <col />
                <col className="w-photo" />
              </colgroup>
              <tbody>
                <tr>
                  <th rowSpan={3}>성명</th>
                  <th>(한글)</th>
                  <td>{e.name}</td>
                  <th>사번</th>
                  <td>{e.empNo}</td>
                  <td rowSpan={6} className="hr-card-photo-cell">
                    <PhotoBox src={e.photoUrl} />
                  </td>
                </tr>
                <tr>
                  <th>(한문)</th>
                  <td>{e.chineseName}</td>
                  <th>입사일</th>
                  <td>{v(e.hireDate)}</td>
                </tr>
                <tr>
                  <th>(영문)</th>
                  <td>{e.englishName}</td>
                  <th>주민번호</th>
                  <td>{e.residentId}</td>
                </tr>
                <tr>
                  <th colSpan={2}>부서</th>
                  <td>{e.departmentName}</td>
                  <th>직위</th>
                  <td>{e.jobTitle}</td>
                </tr>
                <tr>
                  <th colSpan={2}>직책</th>
                  <td>{e.position}</td>
                  <th>직급</th>
                  <td>{e.jobRank}</td>
                </tr>
                <tr>
                  <th colSpan={2}>호봉</th>
                  <td>{e.payStep}</td>
                  <th>직종</th>
                  <td>{e.jobTypeName}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="hr-card-heading">개인사항</h2>
            <table className="hr-card-table">
              <tbody>
                <tr>
                  <th>생년월일</th>
                  <td>{v(e.birthDate)}</td>
                  <th>성별</th>
                  <td>{e.gender}</td>
                  <th>종교</th>
                  <td>{e.religion}</td>
                </tr>
                <tr>
                  <th>국적</th>
                  <td>{e.nationalityName}</td>
                  <th>취미</th>
                  <td>{e.hobby}</td>
                  <th>특기</th>
                  <td>{e.specialty}</td>
                </tr>
                <tr>
                  <th>이메일</th>
                  <td>{e.email}</td>
                  <th>전화번호</th>
                  <td>{e.phone}</td>
                  <th>휴대전화</th>
                  <td>{e.cellphone}</td>
                </tr>
                <tr>
                  <th>결혼여부</th>
                  <td>{e.marriageStatus}</td>
                  <th>외국인여부</th>
                  <td>{e.nationalityType}</td>
                  <th>장애인여부</th>
                  <td>{e.disabledLabel}</td>
                </tr>
                <tr>
                  <th>주민등록상주소</th>
                  <td colSpan={5}>{address}</td>
                </tr>
                <tr>
                  <th>실거주지</th>
                  <td colSpan={5}>{address}</td>
                </tr>
                <tr>
                  <th>비고</th>
                  <td colSpan={5}>{e.remarks}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="hr-card-heading">발령사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>발령일</th>
                  <th>발령명</th>
                  <th>부서</th>
                  <th>직위</th>
                  <th>직책</th>
                  <th>직급</th>
                  <th>발령내역</th>
                </tr>
              </thead>
              <tbody>
                {card.appointments.length === 0 ? (
                  <EmptyRow cols={7} />
                ) : (
                  card.appointments.map((row) => (
                    <tr key={row.key}>
                      <td className="nowrap">{v(row.orderDate)}</td>
                      <td>{row.orderName}</td>
                      <td>{row.orderDepartmentName || row.departmentName}</td>
                      <td>{row.jobGradeName || row.positionName}</td>
                      <td>{row.jobDutyName}</td>
                      <td>{row.jobRankName}</td>
                      <td>{row.contents || row.remark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">학력사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>학력</th>
                  <th>학교</th>
                  <th>전공계열</th>
                  <th>전공학과</th>
                  <th>입학년월</th>
                  <th>졸업년월</th>
                </tr>
              </thead>
              <tbody>
                {card.education.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  card.education.map((row) => (
                    <tr key={row.key}>
                      <td>{row.careerName}</td>
                      <td>{row.schoolName}</td>
                      <td>{row.majorFieldName}</td>
                      <td>{row.majorCourseName}</td>
                      <td className="nowrap">{v(row.enterYearMonth)}</td>
                      <td className="nowrap">{v(row.graduateYearMonth)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">가족사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>관계</th>
                  <th>생년월일</th>
                  <th>학력</th>
                  <th>직업</th>
                </tr>
              </thead>
              <tbody>
                {card.family.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  card.family.map((row) => (
                    <tr key={row.key}>
                      <td>{row.name}</td>
                      <td>{row.relationName}</td>
                      <td className="nowrap">{v(row.birthDate)}</td>
                      <td>{row.educationName}</td>
                      <td>{row.occupation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">병역사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>병역구분</th>
                  <th>군별</th>
                  <th>병과</th>
                  <th>군보직</th>
                  <th>입대일</th>
                  <th>전역일</th>
                </tr>
              </thead>
              <tbody>
                {card.military.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  card.military.map((row) => (
                    <tr key={row.key}>
                      <td>{row.serviceName}</td>
                      <td>{row.kindName}</td>
                      <td>{row.branchName}</td>
                      <td>{row.specialtyName}</td>
                      <td className="nowrap">{v(row.enrollDate)}</td>
                      <td className="nowrap">{v(row.dischargeDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">외부경력사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>근무회사</th>
                  <th>직위</th>
                  <th>담당업무</th>
                  <th>입사일</th>
                  <th>퇴사일</th>
                </tr>
              </thead>
              <tbody>
                {card.career.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  card.career.map((row) => (
                    <tr key={row.key}>
                      <td>{row.companyName}</td>
                      <td>{row.positionName}</td>
                      <td>{row.dutyName}</td>
                      <td className="nowrap">{v(row.enterDate)}</td>
                      <td className="nowrap">{v(row.resignDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">자격사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>자격증</th>
                  <th>발급기관</th>
                  <th>자격번호</th>
                  <th>취득일</th>
                  <th>만료일</th>
                </tr>
              </thead>
              <tbody>
                {card.licenses.length === 0 ? (
                  <EmptyRow cols={5} />
                ) : (
                  card.licenses.map((row) => (
                    <tr key={row.key}>
                      <td>{row.licenseName}</td>
                      <td>{row.issueInstitution}</td>
                      <td>{row.licenseNo}</td>
                      <td className="nowrap">{v(row.acquireDate)}</td>
                      <td className="nowrap">{v(row.validDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <h2 className="hr-card-heading">상벌사항</h2>
            <table className="hr-card-table">
              <thead>
                <tr>
                  <th>상벌구분</th>
                  <th>상벌종류</th>
                  <th>상벌사유</th>
                  <th>상벌기관</th>
                  <th>시작일</th>
                  <th>종료일</th>
                </tr>
              </thead>
              <tbody>
                {card.rewards.length === 0 ? (
                  <EmptyRow cols={6} />
                ) : (
                  card.rewards.map((row) => (
                    <tr key={row.key}>
                      <td>{row.typeName || row.inOutName}</td>
                      <td>{row.name}</td>
                      <td>{row.reason}</td>
                      <td>{row.institution}</td>
                      <td className="nowrap">{v(row.fromDate)}</td>
                      <td className="nowrap">{v(row.toDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        );
      })}
    </div>
  );
}
