import { chapters, type ChapterId } from "./story";
import type { NovaScript } from "@/game/nova/script";
import { discoveries } from "./discoveries";

/**
 * NOVA, the AI co-pilot. Friendly, a little witty, always factual.
 * Emojis are allowed here (and only here) — keep them rare.
 */

export const novaCopy = {
  name: "NOVA",
  robotLabel: "NOVA, your co-pilot. Click for a tip or a joke.",
  wakeLabel: "Wake NOVA up",
  hide: "Hide message",
  mute: "Mute NOVA",
  regionLabel: "NOVA co-pilot",
  wakeLine: "Back online. I was only resting my sensors.",
} as const;

/** Short hello, merged in front of the first chapter line NOVA says (so it never blocks it). */
export const novaGreeting = "Hi, I'm NOVA, your co-pilot. Click anything that glows. 👋";

/** 2–3 lines per chapter; NOVA says the next unused one each time you enter. */
export const novaChapterLines: Record<ChapterId, readonly string[]> = {
  launchpad: [
    "Launchpad. Systems nominal, coffee levels acceptable. Scroll down to fly.",
    "That rocket isn't decorative. Go on, click it.",
  ],
  pilot: [
    "Pilot profile. Meet Ravi: Data & AI engineer, captain of this ship.",
    "Flip the ID card. Every pilot has a backstory on the back.",
    "Those stats were earned in production, not in tutorials.",
  ],
  vit: [
    "Planet VIT. The tutorial zone where it all started: B.Tech in Computer Science, AI & ML.",
    "Each crater hides a fact. Poke them.",
  ],
  nebula: [
    "WinWire Nebula. Three years of enterprise data missions. Click a station to read its debrief.",
    "Healthcare migrations, integrations and a commercial platform live out here.",
    "The numbers in this nebula are real. I checked. Twice.",
  ],
  station: [
    "Navayuga Station: the current mission, still under construction. 🚧",
    "Want to help? Power the modules in pipeline order: sources first.",
    "No metrics here yet. The platform is still being built, and we don't make numbers up.",
  ],
  armory: [
    "The Armory. Skills, tools and trophies collected along the way.",
    "Flip the ability cards. The back of each one shows where it was used.",
    "The tech inventory lists every tool in my kit, grouped by what it does. 🧰",
  ],
  "side-quests": [
    "Side quests. Practice builds and a data refinery you can actually play.",
    "Asteroids out here contain practice projects. Crack one open.",
  ],
  transmission: [
    "Transmission bay. Write Ravi a message or pick a channel. He answers every signal. 📡",
    "End of the voyage. Thanks for flying with us!",
  ],
};

/**
 * Said (in rotation) when you fly back into a chapter whose intros are used up.
 * `{chapter}` becomes the chapter's label. Keep them short: they also play on phones.
 */
export const novaRevisitLines: readonly string[] = [
  "Back at {chapter}. Missed something? Look for the glow.",
  "{chapter} again. I kept the lights on for you.",
  "Welcome back to {chapter}. ✨",
  "Returning to {chapter}. Navigation confirms it.",
];

export const novaResultLines = {
  refinery: {
    win: [
      "Shift complete, zero pages. The Gold tables and the stakeholders both thank you. ✨",
      "Incidents closed, data clean. That's on-call hero energy. 🏆",
    ],
    lose: [
      "Paged at 3am? We've all been there. Coffee, then retry. ☕",
      "Rough shift. Good news: no real pipelines were harmed.",
    ],
  },
  station: {
    win: ["Station online! Every module is talking to every other module.", "Pipeline connected end to end. Sources to dashboards, no tickets required."],
    lose: ["The station lost power. Let's try that again."],
  },
} as const satisfies Record<string, Record<"win" | "lose", readonly string[]>>;

export const novaTips = [
  "Psst — that rocket on the launchpad? It really does launch.",
  "Everything glows for a reason. Click things.",
  "There's a hidden constellation on the launchpad.",
  "The star chart in the HUD can warp you to any chapter.",
  "In a hurry? Quick view in the HUD shows everything on one page.",
  "Tap empty space. The stars sing in the soundtrack's key. 🎵",
] as const;

export const novaJokes = [
  "Why did the data engineer break up with the CSV? Too many trust issues with commas.",
  "My favourite exercise? Bronze to Silver to Gold. Medallion cardio.",
  "I'd tell you a joke about NULL, but it has no value.",
  "Spark jobs and I have a lot in common. We both shuffle when nervous.",
  "Schema on read? More like schema on regret.",
  "There are two hard problems in data: naming things, cache invalidation, and off-by-one errors.",
] as const;

/** Tips and jokes interleaved, for when the visitor clicks NOVA. */
export const novaIdleLines: readonly string[] = novaTips.flatMap((tip, i) => {
  const joke = novaJokes[i];
  return joke ? [tip, joke] : [tip];
});

const discoveryLines = new Map<string, string>(discoveries.map((d) => [d.id, d.line]));
const chapterLabels = new Map<string, string>(chapters.map((c) => [c.id, c.label]));

/** Everything above, in the shape NOVA's director consumes. */
export const novaScript: NovaScript = {
  greeting: novaGreeting,
  chapterLines: novaChapterLines,
  revisitLines: novaRevisitLines,
  chapterLabel: (id) => chapterLabels.get(id) ?? id,
  discoveryLine: (id) => discoveryLines.get(id),
  resultLines: novaResultLines,
  idleLines: novaIdleLines,
};
