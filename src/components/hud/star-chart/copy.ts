/**
 * UI copy for the star-chart overlay. (Kept beside the feature because `src/content/` is shared;
 * move to `content/` if the copy grows.)
 */
export const starChartCopy = {
  title: "Star chart",
  intro: "Pick a chapter to warp there, or a project moon to read its mission briefing.",
  chaptersGroup: "Chapters of the voyage",
  projectsGroup: "Projects",
  chaptersHeading: "Chapters",
  projectsHeading: "Mission briefings",
  loading: "Plotting course…",
  chapterSr: (number: number, here: boolean, visited: boolean) =>
    `, chapter ${number}${here ? ", you are here" : ""}${visited ? ", visited" : ""}. Warp there.`,
  projectSr: (status: string, period: string, read: boolean) =>
    `, ${status}, ${period}${read ? ", briefing read" : ""}. Open mission briefing.`,
} as const;
