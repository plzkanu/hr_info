function predictableInitial(userId: string) {
  return `${userId.trim().toLowerCase()}!!`;
}

export const PASSWORD_CHANGE_HINT = "비밀번호는 8자 이상이어야 합니다.";

export function validateNewPassword(
  password: string,
  userId: string,
): string | null {
  if (!password || password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  const normalizedId = userId.trim().toLowerCase();
  if (password === normalizedId || password === predictableInitial(normalizedId)) {
    return "아이디와 같거나 예측하기 쉬운 비밀번호는 사용할 수 없습니다.";
  }
  return null;
}
