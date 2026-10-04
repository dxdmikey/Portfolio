import { DATE_COLUMN, ID_COLUMN, QUANTITY_COLUMN, SCHEMA } from "./schema";
import type { Defect, FieldValue, RecordField } from "./types";

export interface ValidationContext {
  /** order_ids already seen earlier in the batch. */
  seenIds: ReadonlySet<number>;
  /** ISO date (YYYY-MM-DD) the batch runs on. */
  runDate: string;
  /** ISO date; records logged before it are late-arriving. Omit to skip the check. */
  watermark?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function show(value: FieldValue): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

/**
 * The Silver-layer quality gate. Returns the first rule a record breaks, or null if it's clean.
 * Rules run from structural (schema) to semantic (late data, duplicates), like a real pipeline.
 */
export function findDefect(fields: readonly RecordField[], ctx: ValidationContext): Defect | null {
  const known = new Set<string>(SCHEMA);
  const extra = fields.find((f) => !known.has(f.key));
  if (extra) {
    return { type: "schema-drift", key: extra.key, reason: `unexpected column ${extra.key}` };
  }
  const byKey = new Map(fields.map((f) => [f.key, f.value]));
  const missing = SCHEMA.find((col) => !byKey.has(col));
  if (missing) return { type: "schema-drift", key: missing, reason: `missing column ${missing}` };

  const nullCol = SCHEMA.find((col) => byKey.get(col) === null);
  if (nullCol) return { type: "null-field", key: nullCol, reason: `${nullCol} is null` };

  const id = byKey.get(ID_COLUMN);
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return { type: "malformed-number", key: ID_COLUMN, reason: `${ID_COLUMN} ${show(id ?? null)} is not an integer` };
  }
  const qty = byKey.get(QUANTITY_COLUMN);
  if (typeof qty !== "number" || !Number.isFinite(qty)) {
    return {
      type: "malformed-number",
      key: QUANTITY_COLUMN,
      reason: `${QUANTITY_COLUMN} ${show(qty ?? null)} is not a number`,
    };
  }
  if (qty < 0) {
    return { type: "negative-quantity", key: QUANTITY_COLUMN, reason: `negative ${QUANTITY_COLUMN} (${qty})` };
  }
  const date = byKey.get(DATE_COLUMN);
  if (typeof date !== "string" || !ISO_DATE.test(date)) {
    return { type: "malformed-number", key: DATE_COLUMN, reason: `${DATE_COLUMN} ${show(date ?? null)} is not a date` };
  }
  if (date > ctx.runDate) {
    return { type: "future-date", key: DATE_COLUMN, reason: `${DATE_COLUMN} ${date} is after the run date` };
  }
  if (ctx.watermark !== undefined && date < ctx.watermark) {
    return {
      type: "late-arriving",
      key: DATE_COLUMN,
      reason: `${DATE_COLUMN} ${date} is older than the watermark ${ctx.watermark}`,
    };
  }
  if (ctx.seenIds.has(id)) {
    return { type: "duplicate-id", key: ID_COLUMN, reason: `duplicate ${ID_COLUMN} ${id}` };
  }
  return null;
}
