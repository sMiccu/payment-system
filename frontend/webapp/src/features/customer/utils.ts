export const toE164 = (countryCode: string, national: string) => {
  const rawDigits = national.replace(/[^0-9]/g, "");
  const codeDigits = countryCode.replace("+", "");
  const nationalDigits =
    countryCode === "+81" && rawDigits.startsWith("0")
      ? rawDigits.slice(1)
      : rawDigits;
  if (!nationalDigits) return "";
  return `+${codeDigits}${nationalDigits}`;
};


