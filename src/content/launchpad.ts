/** Copy and data for CH0, the Launchpad (hero). */

export interface ConstellationStar {
  /** Position inside the constellation box, in percent. */
  x: number;
  y: number;
  /** Which lakehouse tier this star stands for, for its accessible name. */
  tier: string;
}

export const launchpad = {
  countdown: ["3", "2", "1", "Liftoff!"],
  skipCountdown: "Skip countdown",
  rocket: {
    launch: "Launch the rocket",
    relaunch: "Relaunch the rocket",
    plateIdle: "Launch",
    plateFlying: "Relaunch",
    status: { launched: "Rocket launched." },
  },
  pokeName: "Poke the name",
  sprite: {
    label: "Say hi to pixel Ravi",
    lines: [
      "Ready when you are, cadet.",
      "Ask me about Delta Lake. Actually, please don't. I'll talk for hours.",
      "Bronze, Silver, Gold. In that order. Always.",
      "I've moved 400+ tables and I'd do it again.",
      "Pro tip: Quick view up in the HUD shows my whole career on one page.",
      "Somewhere, a pipeline just went green. I can feel it.",
      "Coffee level: sufficient for one more migration.",
    ],
  },
  constellation: {
    starLabel: "Mysterious star",
    name: "The Lakehouse",
    caption: "Bronze · Silver · Gold",
    stars: [
      { x: 12, y: 82, tier: "Bronze" },
      { x: 34, y: 58, tier: "Bronze" },
      { x: 58, y: 66, tier: "Silver" },
      { x: 74, y: 34, tier: "Silver" },
      { x: 90, y: 12, tier: "Gold" },
    ],
  },
  ctas: {
    start: "Start the voyage",
    quickView: "Quick view",
  },
} as const;

export type LaunchpadCopy = typeof launchpad;
