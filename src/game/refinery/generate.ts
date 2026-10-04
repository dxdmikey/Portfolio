import { createRng, type Rng } from "./prng";
import { DATE_COLUMN, ID_COLUMN, QUANTITY_COLUMN, type Column } from "./schema";
import type { Batch, BatchRecord, DefectType, FieldValue, RecordField } from "./types";
import { findDefect } from "./validate";

export const BATCH_SIZE = 10;
/** Share of records that carry a defect (rounded). */
export const BAD_RATIO = 0.4;
/** Fixed so a seed always produces the same batch, whatever day it is played. */
export const RUN_DATE = "2026-09-30";
/** Partitions older than this many days before the run are closed: rows for them arrive "late". */
export const WATERMARK_DAYS = 7;

const SITES = ["HYD-07", "VJA-02", "BLR-11", "CHN-04", "PUN-09", "NGP-03"] as const;
const FIRST_ID = { min: 1000, max: 1900 } as const;
const ID_STEP = { min: 1, max: 7 } as const;
/** Litres in tenths so values keep one decimal. */
const LITRES_TENTHS = { min: 400, max: 4000 } as const;
const TENTHS = 10;
/** Clean rows stay inside the watermark window. */
const PAST_DAYS = { min: 0, max: WATERMARK_DAYS - 1 } as const;
const FUTURE_DAYS = { min: 2, max: 45 } as const;
const LATE_DAYS = { min: WATERMARK_DAYS + 2, max: 40 } as const;
const MS_PER_DAY = 86_400_000;
const NULLABLE: readonly Column[] = ["site", QUANTITY_COLUMN, DATE_COLUMN];
const DRIFT_COLUMNS: readonly RecordField[] = [
  { key: "odometer_km", value: 18422 },
  { key: "fuel_gal", value: 48.2 },
  { key: "driver_note", value: "refill" },
];
export const DEFECT_TYPES: readonly DefectType[] = [
  "null-field",
  "duplicate-id",
  "malformed-number",
  "future-date",
  "negative-quantity",
  "schema-drift",
  "late-arriving",
];

export const WATERMARK = addDays(RUN_DATE, -WATERMARK_DAYS);

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function setField(fields: readonly RecordField[], key: string, value: FieldValue): RecordField[] {
  return fields.map((f) => (f.key === key ? { key, value } : f));
}

function valueOf(fields: readonly RecordField[], key: string): FieldValue {
  return fields.find((f) => f.key === key)?.value ?? null;
}

/** "182.4" → "18O.4": swap one digit (a zero when there is one) for a look-alike letter. */
function corruptNumber(value: number, rng: Rng): string {
  const text = value.toFixed(1);
  const digits = [...text].flatMap((ch, i) => (/\d/.test(ch) ? [i] : []));
  const zeros = digits.filter((i) => text[i] === "0");
  const at = rng.pick(zeros.length > 0 ? zeros : digits);
  return `${text.slice(0, at)}O${text.slice(at + 1)}`;
}

function addDriftColumn(fields: readonly RecordField[], rng: Rng): RecordField[] {
  return [...fields, rng.pick(DRIFT_COLUMNS)];
}

type Injector =(fields: readonly RecordField[], rng: Rng, earlierIds: readonly number[]) => RecordField[];

/** Registry: one way to break a record per defect type. */
const INJECTORS: Record<DefectType, Injector> = {
  "null-field": (fields, rng) => setField(fields, rng.pick(NULLABLE), null),
  "duplicate-id": (fields, rng, earlierIds) =>
    earlierIds.length > 0 ? setField(fields, ID_COLUMN, rng.pick(earlierIds)) : addDriftColumn(fields, rng),
  "malformed-number": (fields, rng) =>
    setField(fields, QUANTITY_COLUMN, corruptNumber(Number(valueOf(fields, QUANTITY_COLUMN)), rng)),
  "future-date": (fields, rng) =>
    setField(fields, DATE_COLUMN, addDays(RUN_DATE, rng.int(FUTURE_DAYS.min, FUTURE_DAYS.max))),
  "negative-quantity": (fields) => setField(fields, QUANTITY_COLUMN, -Number(valueOf(fields, QUANTITY_COLUMN))),
  "schema-drift": (fields, rng) => addDriftColumn(fields, rng),
  "late-arriving": (fields, rng) =>
    setField(fields, DATE_COLUMN, addDays(RUN_DATE, -rng.int(LATE_DAYS.min, LATE_DAYS.max))),
};

function cleanRow(id: number, rng: Rng): RecordField[] {
  return [
    { key: ID_COLUMN, value: id },
    { key: "site", value: rng.pick(SITES) },
    { key: QUANTITY_COLUMN, value: rng.int(LITRES_TENTHS.min, LITRES_TENTHS.max) / TENTHS },
    { key: DATE_COLUMN, value: addDays(RUN_DATE, -rng.int(PAST_DAYS.min, PAST_DAYS.max)) },
  ];
}

/** Labels every record by running the same quality gate the player is emulating. */
function label(rows: readonly RecordField[][]): BatchRecord[] {
  const seen = new Set<number>();
  return rows.map((fields, i) => {
    const defect = findDefect(fields, { seenIds: seen, runDate: RUN_DATE, watermark: WATERMARK });
    const id = valueOf(fields, ID_COLUMN);
    if (typeof id === "number") seen.add(id);
    return { position: i + 1, fields, isValid: defect === null, defect };
  });
}

export interface BatchOptions {
  /** Number of records (default BATCH_SIZE). */
  size?: number;
  /** Share of defective records, rounded (default BAD_RATIO). Always leaves at least one clean record. */
  badRatio?: number;
  /** Defect types to inject (default: all). Types repeat when there are more bad records than types. */
  defects?: readonly DefectType[];
}

/** Which defect each bad record gets: a shuffled cycle of the allowed types, duplicates last. */
function defectPlan(rng: Rng, allowed: readonly DefectType[], badCount: number): DefectType[] {
  const wantsDuplicate = allowed.includes("duplicate-id");
  const pool = rng.shuffle(allowed.filter((d) => d !== "duplicate-id"));
  if (pool.length === 0) return Array.from({ length: badCount }, () => "duplicate-id");
  const fill = wantsDuplicate ? badCount - 1 : badCount;
  const plan = Array.from({ length: Math.max(fill, 0) }, (_, i) => pool[i % pool.length] as DefectType);
  // Duplicates go last so there is always an earlier id to copy.
  if (wantsDuplicate && badCount > 0) plan.push("duplicate-id");
  return plan;
}

/** Deterministic batch: same seed + options → same records, defects and order. */
export function generateBatch(seed: number, options: BatchOptions = {}): Batch {
  const { size = BATCH_SIZE, badRatio = BAD_RATIO, defects: allowed = DEFECT_TYPES } = options;
  const rng = createRng(seed);
  const ids: number[] = [];
  let id = rng.int(FIRST_ID.min, FIRST_ID.max);
  const rows = Array.from({ length: size }, () => {
    ids.push(id);
    const row = cleanRow(id, rng);
    id += rng.int(ID_STEP.min, ID_STEP.max);
    return row;
  });

  const badCount = allowed.length === 0 ? 0 : Math.min(Math.round(size * badRatio), size - 1);
  const badPositions = rng.shuffle(rows.map((_, i) => i)).slice(0, badCount).sort((a, b) => a - b);
  const plan = defectPlan(rng, allowed, badCount);

  badPositions.forEach((pos, i) => {
    const type = plan[i];
    const row = rows[pos];
    if (!type || !row) return;
    rows[pos] = INJECTORS[type](row, rng, ids.slice(0, pos));
  });

  return { seed, runDate: RUN_DATE, watermark: WATERMARK, records: label(rows) };
}
