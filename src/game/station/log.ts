/** The station's boot-log terminal: a short ring buffer of tagged lines. Pure and immutable. */

/** Lines kept (and shown): older ones scroll off the top. */
export const MAX_LOG_LINES = 8;

export type LogTone = "ok" | "error" | "info" | "sync";

export interface LogLine {
  /** Stable, increasing id (React key). */
  readonly id: number;
  /** Who is talking, e.g. "ingest" or "sync". */
  readonly source: string;
  readonly text: string;
  readonly tone: LogTone;
}

export interface BootLog {
  readonly lines: readonly LogLine[];
  /** Next id to hand out. */
  readonly seq: number;
}

export const EMPTY_LOG: BootLog = { lines: [], seq: 0 };

export function appendLog(log: BootLog, line: Omit<LogLine, "id">, max = MAX_LOG_LINES): BootLog {
  const lines = [...log.lines, { ...line, id: log.seq }];
  return { lines: lines.slice(Math.max(0, lines.length - max)), seq: log.seq + 1 };
}

/** Append several lines in order. */
export function appendLogs(
  log: BootLog,
  lines: readonly Omit<LogLine, "id">[],
  max = MAX_LOG_LINES,
): BootLog {
  return lines.reduce((acc, l) => appendLog(acc, l, max), log);
}
