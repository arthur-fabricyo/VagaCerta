export function formatPlateInput(value: string): string {
  const plate = value.replace(/[\s-]/g, "").toUpperCase();
  return plate.length > 3 ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate;
}

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const whole = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${whole},${padded.slice(-2)}`;
}

export function currencyInputToCents(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function removeCurrencyDigit(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return formatCurrencyInput(digits.slice(0, -1));
}
