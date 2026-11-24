export function normalizeTrigger(value: string): string {
  return value.trim().replace(/^!/, "").toLowerCase();
}

export function isValidTrigger(value: string): boolean {
  return (
    value.length > 0 &&
    !/\s/.test(value) &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    !value.startsWith("!")
  );
}

export function normalizeValidTrigger(value: string): string | null {
  const normalized = normalizeTrigger(value);
  return isValidTrigger(normalized) ? normalized : null;
}
