export const APP_NAME = "우리의 기록";
export const APP_SHORT = "우리";

/** 아이디 로그인용: Supabase는 이메일이 필요해서 아이디 뒤에 이 도메인을 붙인다. */
export const LOGIN_DOMAIN = "twoh.example.com";
export const idToEmail = (id: string) => {
  const v = id.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${LOGIN_DOMAIN}`;
};
