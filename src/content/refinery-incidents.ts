import type { IncidentSpec } from "@/game/refinery/types";

/**
 * Production incidents for the Refinery's on-call round (AMS-style support work). Each has exactly
 * one right fix; three are picked per shift. Generic on purpose: no client or vendor names.
 * Add an entry to add an incident; nothing else needs to change.
 */
export const refineryIncidents: readonly IncidentSpec[] = [
  {
    id: "renamed-column",
    title: "Nightly EDI load failed",
    log: [
      "02:14 ERROR load_orders: column 'qty' not found in source file",
      "02:14 INFO  source header: order_id, site, quantity, logged_at",
    ],
    options: [
      { label: "Map the renamed column (quantity → qty) and rerun the load", correct: true },
      { label: "Rerun the pipeline as is" },
      { label: "Disable the alert until morning" },
    ],
    explain:
      "The source renamed a column. A blind rerun fails the same way; map it, rerun, and add a schema check so drift is caught at ingest.",
  },
  {
    id: "late-file",
    title: "SFTP drop is 3 hours late",
    log: [
      "05:00 WARN  sensor: waiting for fuel_logs_20260930.csv (3h overdue)",
      "05:00 WARN  downstream refresh at 06:00 will miss its SLA",
    ],
    options: [
      { label: "Tell consumers about the delay, then run an incremental load from the watermark when the file lands", correct: true },
      { label: "Load yesterday's file again so the dashboard isn't empty" },
      { label: "Skip today's load" },
    ],
    explain:
      "Reloading old data makes a stale dashboard look fresh. Be upfront about the delay and catch up incrementally once the file arrives.",
  },
  {
    id: "skewed-join",
    title: "Spark job running 5x slower than usual",
    log: [
      "stage 14: 199/200 tasks done in 2 min; task 200 still running after 40 min",
      "task 200 holds 70% of shuffle rows for one join key",
    ],
    options: [
      { label: "Salt the skewed key (or enable skew-join handling) to spread it across tasks", correct: true },
      { label: "Add more executors and hope" },
      { label: "collect() the table to the driver and join there" },
    ],
    explain:
      "One hot key lands in one task, so more executors sit idle. Salting splits it; collecting to the driver just moves the crash.",
  },
  {
    id: "double-append",
    title: "Revenue doubled overnight on the Gold dashboard",
    log: [
      "01:30 WARN  load_sales attempt 1 timed out after writing rows; retried (append)",
      "07:45 INFO  gold.daily_sales row count is 2x silver for 2026-09-30",
    ],
    options: [
      { label: "Make the load idempotent (MERGE on the key), then rebuild that partition", correct: true },
      { label: "Delete roughly half the rows by hand" },
      { label: "Tell finance it's real growth" },
    ],
    explain:
      "Retry plus append wrote the same rows twice. An upsert on the business key makes retries safe; rebuild the partition to fix today.",
  },
  {
    id: "null-spike",
    title: "Data quality check failed: null spike",
    log: [
      "04:10 WARN  expectation not_null(fuel_litres) failed on today's batch",
      "04:10 INFO  null rate is far above its usual baseline",
    ],
    options: [
      { label: "Quarantine the batch, keep yesterday's Gold, and raise it with the source team", correct: true },
      { label: "Fill the nulls with 0 and publish" },
      { label: "Drop the not-null check" },
    ],
    explain:
      "Zeros would quietly corrupt every total. Hold the bad batch back, keep serving the last good data, and fix it at the source.",
  },
  {
    id: "expired-token",
    title: "API pull failing since 02:00",
    log: [
      "02:00 ERROR fuel-management API returned 401 Unauthorized",
      "02:00 ERROR token expired; 6 scheduled pulls failed since",
    ],
    options: [
      { label: "Rotate the service credential in the secret store, then backfill the missed window", correct: true },
      { label: "Paste a personal token into the job config" },
      { label: "Retry every minute until it works" },
    ],
    explain:
      "Retries can't fix an expired credential, and personal tokens leak and expire too. Rotate the service secret, then backfill the gap.",
  },
];
