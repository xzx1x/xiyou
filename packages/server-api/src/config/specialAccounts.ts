import type { UserRole } from "../repositories/userRepository";

export const SPECIAL_TEST_PASSWORD = "a88888888";

type SpecialTestAccount = {
  email: string;
  identityCode: string;
  role: UserRole;
};

const SPECIAL_TEST_ACCOUNTS: SpecialTestAccount[] = [
  { email: "3460511045@qq.com", identityCode: "202202105", role: "USER" },
  { email: "3460511046@qq.com", identityCode: "202202106", role: "USER" },
  { email: "3460511047@qq.com", identityCode: "202202107", role: "USER" },
  { email: "3460511048@qq.com", identityCode: "202202108", role: "USER" },
  { email: "3460511049@qq.com", identityCode: "12345678", role: "ADMIN" },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getSpecialTestAccountByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return SPECIAL_TEST_ACCOUNTS.find((item) => item.email === normalized) ?? null;
}

export function isSpecialTestAccountEmail(email: string) {
  return Boolean(getSpecialTestAccountByEmail(email));
}
