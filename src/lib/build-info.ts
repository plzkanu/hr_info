const BUILD_AT_ISO = process.env.NEXT_PUBLIC_BUILD_AT?.trim() ?? "";

export function deployedAtLabel(): string {
  if (!BUILD_AT_ISO) return "";
  const date = new Date(BUILD_AT_ISO);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
