// src/lib/constants/info-company.ts
export const PAYERTYPE = [
  { value: "individual", label: "Физическое лицо" },
  { value: "ip", label: "Индивидуальный предприниматель" },
  { value: "company", label: "Компания" },
] as const;

export type Info = (typeof PAYERTYPE)[number];
