/**
 * Strips non-digits, removes the '+' from the dial code,
 * removes the leading '0' from the phone (if present), and merges them.
 * * Example 1: phone: "08515822603", dialCode: "+62" -> "628515822603"
 * Example 2: phone: "8515822603",  dialCode: "+62" -> "628515822603"
 */
export const normalizePhoneWithDialCode = (
  phone: string,
  dialCode: string,
): string => {
  // 1. Clean the dial code (removes the '+' and any spaces)
  const cleanDialCode = dialCode.replace(/\D/g, "");

  // 2. Clean the user's phone input (removes dashes, spaces, etc.)
  let cleanPhone = phone.replace(/\D/g, "");

  // 3. Strip the leading '0' from the phone number if they typed it
  if (cleanPhone.startsWith("0")) {
    cleanPhone = cleanPhone.substring(1);
  }

  // 4. Merge them together
  return cleanDialCode + cleanPhone;
};

export const formatPhoneWithDialCode = (
  phone: string,
  dialCode: string,
): string => {
  const numericDialCode = dialCode.replace(/\D/g, "");

  let cleanPhone = phone.replace(/\D/g, "");

  if (numericDialCode.length > 0 && cleanPhone.startsWith(numericDialCode)) {
    cleanPhone = cleanPhone.substring(numericDialCode.length);
  }

  /**
   * Formats phone numbers by groups of 3.
   * If 4 digits remain, it splits them into groups of 2.
   * Example 10 chars: 8886709902 -> "888 670 99 02"
   */
  const formatted = cleanPhone.replace(
    /(\d{3})(?=\d{2,})|(\d{2})(?=\d{2}$)/g,
    "$& ",
  );

  return `${dialCode} ${formatted}`.trim();
};
