import { parsePhoneNumber } from "libphonenumber-js";

export function toE164(value: string | null | undefined): string {
  if (!value) return "";
  return parsePhoneNumber(value)?.number ?? value;
}

export function formatPhoneForDisplay(
  value: string | null | undefined,
): string {
  if (!value) return "";
  return parsePhoneNumber(value)?.formatInternational() ?? value;
}
