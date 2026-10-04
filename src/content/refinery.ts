import type { StageId } from "@/game/refinery/levels";
import type { RankId } from "@/game/refinery/scoring";
import type { RecordVerdict } from "@/game/refinery/shift";
import type { DefectType } from "@/game/refinery/types";

/** All user-facing copy for the Refinery ("Pipeline on-call shift"): panels, HUD, verdicts, report, aria. */
export const refineryCopy = {
  start: {
    heading: "Pipeline on-call shift",
    lines: [
      "Fuel-log records ride the conveyor out of Bronze. Promote clean ones to Silver and quarantine broken ones before they reach the end of the belt.",
      "Three levels, each with new rules and a faster belt. Then the pager goes off: three production incidents, pick the right fix.",
      "Every 3 correct calls in a row raise your multiplier, up to ×4. A miss resets it.",
      "SLA budget: if 3 bad records reach Silver (promoted, or slipped past undecided), you get paged at 3am and the shift ends.",
    ],
    keyboard: "Keyboard: P promote, Q quarantine, 1 to 3 pick a fix.",
    button: "Start shift",
    best: "Best",
  },
  relaxed: {
    label: "Relaxed mode",
    on: "On",
    off: "Off",
    hint: "No timers: records wait for your call and incidents have no clock.",
  },
  stages: {
    bronze: { tag: "Level 1", name: "Bronze ingest", body: "Raw fuel logs land from the site systems. Catch the rows that won't even load." },
    silver: { tag: "Level 2", name: "Silver conform", body: "Now conform the data: the shape and the values have to make sense." },
    gold: { tag: "Level 3", name: "Gold dedupe", body: "Last gate before reporting. Keys must be unique and data must arrive on time." },
    incidents: {
      tag: "Incident round",
      name: "You're on call",
      body: "Three alerts are about to fire. Read the log and pick the fix you'd ship at 3am.",
    },
  } satisfies Record<StageId, { tag: string; name: string; body: string }>,
  rules: {
    "null-field": "a null in any column",
    "malformed-number": "numbers that aren't numbers (a quoted \"18O.4\" with a letter O)",
    "schema-drift": "unexpected or missing columns",
    "negative-quantity": "negative fuel_litres",
    "future-date": "logged_at after the run date",
    "duplicate-id": "an order_id already seen this level",
    "late-arriving": "logged_at older than the watermark (late data)",
  } satisfies Record<DefectType, string>,
  briefing: {
    quarantine: "Quarantine",
    isNew: "new",
    speed: (seconds: number) => `Belt: ${seconds}s per record`,
    relaxedSpeed: "Belt: waits for you (relaxed mode)",
    beginLevel: "Start level",
    beginIncidents: "Take the pager",
  },
  hud: {
    score: "Score",
    streak: "Streak",
    sla: "SLA",
    slaAria: (left: number, budget: number) => `SLA budget: ${left} of ${budget} left`,
    record: (n: number, total: number) => `Rec ${n}/${total}`,
    relaxed: "Relaxed",
    multiplierAria: (m: number) => `Multiplier times ${m}`,
  },
  belt: {
    aria: "Conveyor belt",
    gate: "SLA",
  },
  record: {
    aria: (position: number, total: number) => `Record ${position} of ${total}`,
    table: "bronze.fuel_logs",
    runDate: (date: string) => `run ${date}`,
    watermark: (date: string) => `watermark ${date}`,
  },
  ledger: {
    heading: "order_ids seen",
    empty: "none yet",
  },
  keys: { promote: "P", quarantine: "Q" },
  decision: {
    promote: "Promote",
    quarantine: "Quarantine",
  },
  verdict: {
    prompt: "Inspect the record, then make the call.",
    text: (v: RecordVerdict): string => {
      const reason = v.record.defect?.reason ?? "";
      if (v.choice === null) {
        return v.record.isValid
          ? "Slipped past the gate undecided. It was clean, but nobody checked it."
          : `Slipped past the gate: ${reason}. SLA breach.`;
      }
      if (v.record.isValid) {
        return v.choice === "promote" ? "Clean record promoted to Silver." : "False alarm: that record was clean.";
      }
      return v.choice === "quarantine" ? `Quarantined: ${reason}.` : `SLA breach: ${reason} reached Silver.`;
    },
    points: (points: number) => `+${points}`,
    levelClear: (name: string, bonus: number) =>
      bonus > 0 ? `${name} cleared with no misses: +${bonus} bonus.` : `${name} cleared.`,
  },
  incident: {
    alert: "Alert",
    counter: (n: number, total: number) => `Incident ${n} of ${total}`,
    pick: "Pick a fix.",
    pickTimed: (seconds: number) => `Pick a fix: ${seconds} seconds on the clock.`,
    resolved: "Resolved",
    wrong: "Not quite",
    timeout: "Too slow: the alert escalated.",
    rightFix: "Right fix:",
    next: "Next incident",
    finish: "Write the report",
    points: (points: number) => `+${points}`,
  },
  report: {
    heading: "Data quality report",
    complete: "Shift complete",
    paged: "Paged at 3am",
    pagedBody: "Three bad records reached Silver and the on-call phone rang. Every engineer has one of these nights.",
    rows: {
      processed: "Records processed",
      accuracy: "Accuracy",
      bestStreak: "Best streak",
      incidents: "Incidents resolved",
      score: "Score",
      best: "Best",
    },
    rankLabel: "Rank",
    ranks: {
      intern: "Intern",
      junior: "Junior engineer",
      engineer: "Data engineer",
      hero: "On-call hero",
    } satisfies Record<RankId, string>,
    newBest: "New best",
    notReached: "not reached",
    missesHeading: "What got past you",
    missTag: (stage: number, position: number) => `L${stage + 1} #${position}`,
    moreMisses: (n: number) => `and ${n} more`,
    retry: "Retry shift",
    newShift: "New shift",
  },
  tanks: {
    labels: { bronze: "Bronze", silver: "Silver", gold: "Gold", quarantine: "Quarantine" },
    summary: (c: { bronze: number; silver: number; gold: number; quarantine: number; total: number }) =>
      `Bronze ${c.bronze}, Silver ${c.silver}, Gold ${c.gold}, Quarantine ${c.quarantine} of ${c.total} records.`,
  },
} as const;
