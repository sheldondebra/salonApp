export function hasNumericActivity<T extends Record<string, unknown>>(
  rows: T[] | undefined,
  keys: (keyof T)[]
): boolean {
  if (!rows?.length) {
    return false;
  }

  return rows.some((row) => keys.some((key) => Number(row[key] ?? 0) > 0));
}

export function hasRows<T>(rows: T[] | undefined): boolean {
  return (rows?.length ?? 0) > 0;
}
