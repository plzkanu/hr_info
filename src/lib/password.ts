/** 관리자가 초기화한 임시 비밀번호: 아이디 + "!!" */
export function initialPassword(userId: string) {
  return `${userId.trim().toLowerCase()}!!`;
}

export const PASSWORD_CHANGE_HINT =
  "8자 이상이며, 초기화 비밀번호(아이디+!!)와 달라야 합니다.";

export function validateNewPassword(
  password: string,
  userId: string,
): string | null {
  if (!password || password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (password === initialPassword(userId)) {
    return "초기화 비밀번호와 다른 비밀번호를 입력해 주세요.";
  }
  return null;
}
