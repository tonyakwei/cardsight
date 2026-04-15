/**
 * Pick only the allowed keys from a data object.
 * Used by admin services to whitelist update fields.
 */
export function pickAllowedFields(
  data: Record<string, any>,
  allowed: readonly string[],
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) result[key] = data[key];
  }
  return result;
}
