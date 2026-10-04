/** Shapes for The Refinery mini-game ("Pipeline on-call shift"). Framework-free. */

export type FieldValue = string | number | null;

export interface RecordField {
  key: string;
  value: FieldValue;
}

export type DefectType =
  | "null-field"
  | "duplicate-id"
  | "malformed-number"
  | "future-date"
  | "negative-quantity"
  | "schema-drift"
  /** logged_at is older than the watermark: the partition it belongs to is already closed. */
  | "late-arriving";

export interface Defect {
  type: DefectType;
  /** The column that breaks the rule. */
  key: string;
  /** Human explanation, e.g. "duplicate order_id 1042". */
  reason: string;
}

export interface BatchRecord {
  /** 1-based position in the batch, shown as "record #n". */
  position: number;
  fields: readonly RecordField[];
  isValid: boolean;
  defect: Defect | null;
}

export interface Batch {
  seed: number;
  /** ISO date the batch was run; anything logged after it is "from the future". */
  runDate: string;
  /** ISO date; anything logged before it arrived too late for its partition. */
  watermark: string;
  records: readonly BatchRecord[];
}

export type Choice = "promote" | "quarantine";

/** One fix the on-call engineer can pick for an incident. Exactly one per incident is right. */
export interface IncidentOption {
  label: string;
  correct?: boolean;
}

/** An AMS-style production incident (copy lives in `content/refinery-incidents.ts`). */
export interface IncidentSpec {
  id: string;
  /** Alert banner, e.g. "Nightly load failed". */
  title: string;
  /** A few log lines shown in a terminal block. */
  log: readonly string[];
  options: readonly IncidentOption[];
  /** Why the right fix is right, shown after answering. */
  explain: string;
}
