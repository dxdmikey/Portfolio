import type { StationGraph } from "@/game/station/power-up";
import { SYNC_FINAL_STAGE_MS, SYNC_STAGE_MS, type SyncStage } from "@/game/station/sync";
import type { Accent } from "@/types/content";
import { projects } from "./projects";

const platform = projects.find((p) => p.id === "self-serve-platform");
if (!platform?.architecture)
  throw new Error("station.ts: self-serve-platform architecture missing");

/** The station's modules are the self-serve platform's architecture nodes. */
export const stationModules = platform.architecture.nodes;

export const stationGraph: StationGraph = {
  modules: stationModules,
  edges: platform.architecture.edges,
};

/** Column headings, left to right (stacked top to bottom on mobile). */
export const stationStages = [
  "Sources",
  "Ingest",
  "Lakehouse & transforms",
  "Reports & AI agent",
] as const;

/** Packet colour per source on live pipes (they mix after Ingest). */
export const stationSourceAccent: Readonly<Record<string, Accent>> = {
  erp: "plasma",
  fuel: "coin",
  fleet: "warp",
};

/** Boot-log line when each module comes online ("<id> › <line>"). */
export const stationBootLines: Readonly<Record<string, string>> = {
  erp: "enterprise ERP linked, schema catalogued ✓",
  fuel: "fuel-management API authenticated ✓",
  fleet: "telematics stream subscribed ✓",
  ingest: "connectors handshake ✓",
  lake: "bronze · silver · gold mounted ✓",
  transform: "governed transforms registered ✓",
  reports: "chart builder online ✓",
  agent: "RAG index warm ✓",
};

export interface StationSyncStage extends SyncStage {
  /** Modules that glow while the batch is in this stage. */
  readonly modules: readonly string[];
  /** Boot-log line when the batch enters the stage. */
  readonly line: string;
}

/** "Run first sync": one demo batch, stage by stage. Bronze, silver and gold all happen in the Lakehouse. */
export const stationSyncStages: readonly StationSyncStage[] = [
  {
    id: "sources",
    ms: SYNC_STAGE_MS,
    modules: ["erp", "fuel", "fleet"],
    line: "extracting a demo batch from 3 sources",
  },
  {
    id: "ingest",
    ms: SYNC_STAGE_MS,
    modules: ["ingest"],
    line: "batch landed through the connectors",
  },
  { id: "bronze", ms: SYNC_STAGE_MS, modules: ["lake"], line: "bronze: raw copy stored" },
  { id: "silver", ms: SYNC_STAGE_MS, modules: ["lake"], line: "silver: cleaned and conformed" },
  { id: "gold", ms: SYNC_STAGE_MS, modules: ["lake"], line: "gold: business-ready tables" },
  { id: "transform", ms: SYNC_STAGE_MS, modules: ["transform"], line: "user transforms applied" },
  { id: "reports", ms: SYNC_STAGE_MS, modules: ["reports"], line: "drawing the report chart" },
  {
    id: "agent",
    ms: SYNC_FINAL_STAGE_MS,
    modules: ["agent"],
    line: "agent answering a sample question",
  },
];

/** The Lakehouse's three layers (each is a sync stage id). */
export const stationLakeLayers = [
  { id: "bronze", short: "B" },
  { id: "silver", short: "S" },
  { id: "gold", short: "G" },
] as const;

/**
 * The finale's demo output. Bar heights are relative (0-1) shapes, not measurements:
 * Navayuga has no public numbers, so nothing here is a real metric.
 */
export const stationDemo = {
  tag: "Demo data",
  chartTitle: "Fuel spend by site",
  bars: [
    { label: "Site A", height: 0.55 },
    { label: "Site B", height: 0.85 },
    { label: "Site C", height: 0.4 },
    { label: "Site D", height: 0.7 },
    { label: "Site E", height: 0.3 },
  ],
  question: "Q: fuel spend by site?",
  answer: "A: here's the chart ▸",
  reportsIdle: "awaiting sync",
  agentIdle: "› awaiting query",
  summary:
    "Demo data only. The Reports module drew a sample bar chart of fuel spend by site, and the AI agent answered the question “fuel spend by site?” with the same chart.",
} as const;

/** Copy for CH4. Honest status: in progress, no metrics. */
export const stationCopy = {
  liveBadge: "Live · In progress",
  briefTitle: "Current mission",
  powerTitle: "Power up the station",
  powerIntro:
    "The station is the self-serve platform we're building. Bring it online the way data flows: sources first, then ingest, the lakehouse, and finally reports and the AI agent.",
  meterLabel: "Station power",
  progress: (online: number, total: number) => `${online}/${total} modules online`,
  onlineBanner: "Station online",
  onlineNote:
    "Data is flowing. In this demo, anyway. The real platform is still under construction.",
  reset: "Reset station",
  booting: "Booting station systems…",
  status: {
    online: "online",
    ready: "ready to power",
    charging: "charging",
    locked: (missing: string) => `locked: power ${missing} first`,
  },
  upstreamHint: (module: string, missing: string) =>
    `Easy, cadet. ${module} needs ${missing} online first. Upstream first, always.`,
  flowCaption: "Data flow",
  log: {
    title: "Boot log",
    label: "Station boot log",
    prompt: "awaiting power. sources first",
    station: "station",
    sync: "sync",
    blocked: (missing: string) => `blocked: ${missing} offline ✗`,
    allOnline: "all systems nominal. ready for first sync",
    reset: "cold reset. all modules offline",
    syncDone: "complete: chart drawn, question answered (demo data) ✓",
  },
  sync: {
    run: "Run first sync",
    rerun: "Run sync again",
    teaser: (left: number) =>
      `Unlocks when every module is online (${left} to go). Then one demo batch runs from the sources to a chart.`,
    stage: (label: string) => `Batch in: ${label}`,
    doneBanner: "Sync complete",
    doneNote:
      "One demo batch went from the sources all the way to a chart. Sample shapes, not real numbers.",
    novaLine: "First sync landed! Sources in, chart out. Demo data, but the pipes are real.",
  },
} as const;
