import type { FeaturePermissionId } from "./permissions";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  passwordHash: string;
  name: string;
  department: string;
  role: UserRole;
  active: boolean;
  passwordMustChange: boolean;
  permissions: FeaturePermissionId[];
  createdAt: string;
}

export interface UserPublic {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  active: boolean;
  passwordMustChange: boolean;
  permissions: FeaturePermissionId[];
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  permissions: FeaturePermissionId[];
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    department: user.department ?? "",
    role: user.role,
    active: user.active,
    passwordMustChange: user.passwordMustChange,
    permissions: user.permissions ?? [],
    createdAt: user.createdAt,
  };
}

export function toSessionUser(user: {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  permissions?: FeaturePermissionId[];
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    department: user.department ?? "",
    role: user.role,
    permissions: user.permissions ?? [],
  };
}

export interface Department {
  name: string;
  fullName: string;
}

export interface Employee {
  id: string;
  empNo: string;
  name: string;
  englishName: string;
  departmentName: string;
  workDepartmentName: string;
  departmentFullName: string;
  companyCode: string;
  companyName: string;
  position: string;
  jobGrade: string;
  empCategory: string;
  employType: string;
  nationalityType: string;
  employmentStatus: string;
  hireDate: string | null;
  resignDate: string | null;
  email: string;
  cellphone: string;
  phone: string;
  residentId: string;
  gender: string;
  birthDate: string | null;
  calendarType: string;
  payrollGroup: string;
  remarks: string;
  photoUrl: string;
  tenure: string;
  excludeFromHeadcount: boolean;
  age: number | null;
  chineseName: string;
  jobTitle: string;
  jobRank: string;
  jobTypeName: string;
  payStep: string;
  religion: string;
  hobby: string;
  specialty: string;
  nationalityName: string;
  marriageStatus: string;
  disabledLabel: string;
  address: string;
  addressZip: string;
  lastSchoolName: string;
  lastEducationName: string;
  lastMajorName: string;
  lastMajorFieldName: string;
}

export interface EmployeeFilters {
  company: string;
  asOfDate: string;
  empCategory: string;
  employType: string;
  empNo: string;
  empName: string;
  hireDateFrom: string;
  hireDateTo: string;
  resignDateFrom: string;
  resignDateTo: string;
  nationalityType: string;
  employmentStatus: string;
  departmentName: string;
  includeSubDepartments: boolean;
  payrollGroup: string;
  englishName: string;
  remarks: string;
  includeExcluded: boolean;
}

export interface EmployeeFilterOptions {
  companies: string[];
  empCategories: string[];
  employTypes: string[];
  nationalityTypes: string[];
  employmentStatuses: string[];
  payrollGroups: string[];
}

export interface EmployeeAppointment {
  key: string;
  empNo: string;
  empName: string;
  sourceTypeName: string;
  orderName: string;
  orderDate: string | null;
  orderEndDate: string | null;
  departmentName: string;
  orderDepartmentName: string;
  positionName: string;
  jobGradeName: string;
  jobRankName: string;
  jobDutyName: string;
  jobTypeName: string;
  jobName: string;
  payrollGroupName: string;
  workStatusName: string;
  contents: string;
  remark: string;
  isLast: boolean;
  isWorkOrder: boolean;
}

export interface EmployeeFamilyMember {
  key: string;
  empNo: string;
  relationName: string;
  kinshipName: string;
  name: string;
  residentId: string;
  phone: string;
  educationName: string;
  occupation: string;
  birthTypeName: string;
  birthDate: string | null;
  nationalityName: string;
  liveTogether: boolean;
  deceased: boolean;
  deathDate: string | null;
  handicapped: boolean;
  handicapTypeName: string;
  dependTypeName: string;
  payAllow: boolean;
  medical: boolean;
}

export interface EmployeeEducation {
  key: string;
  careerName: string;
  schoolName: string;
  majorName: string;
  majorFieldName: string;
  majorCourseName: string;
  minorName: string;
  dayNightName: string;
  enterYearMonth: string | null;
  graduateYearMonth: string | null;
  degreeName: string;
  location: string;
  isLast: boolean;
  isApplied: boolean;
}

export interface EmployeeCareer {
  key: string;
  companyName: string;
  enterDate: string | null;
  resignDate: string | null;
  departmentName: string;
  positionName: string;
  dutyName: string;
  resignReasonName: string;
  careerTypeName: string;
  remark: string;
}

export interface EmployeeLanguage {
  key: string;
  languageName: string;
  authTypeName: string;
  score: number | null;
  gradeName: string;
  beginDate: string | null;
  endDate: string | null;
  allowPay: boolean;
  remark: string;
}

export interface EmployeeRewardPenalty {
  key: string;
  typeName: string;
  name: string;
  fromDate: string | null;
  toDate: string | null;
  inOutName: string;
  institution: string;
  reason: string;
  cancelledDate: string | null;
}

export interface EmployeeLicense {
  key: string;
  licenseName: string;
  groupName: string;
  issueInstitution: string;
  licenseNo: string;
  acquireDate: string | null;
  validDate: string | null;
  authTypeName: string;
  score: number | null;
  allowPay: boolean;
  statutory: boolean;
  remark: string;
}

export interface EmployeeMilitary {
  key: string;
  serviceName: string;
  kindName: string;
  branchName: string;
  specialtyName: string;
  enrollDate: string | null;
  dischargeDate: string | null;
}

export interface EmployeeHrCard {
  employee: Employee;
  appointments: EmployeeAppointment[];
  family: EmployeeFamilyMember[];
  education: EmployeeEducation[];
  career: EmployeeCareer[];
  licenses: EmployeeLicense[];
  rewards: EmployeeRewardPenalty[];
  military: EmployeeMilitary[];
}
