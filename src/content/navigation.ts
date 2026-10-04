import { chapters, type ChapterId } from "./story";

/**
 * Navigation = the story's chapters. Kept as a thin alias so HUD and
 * visit tracking stay decoupled from the story model's extra fields.
 */
export const sections = chapters;

export type SectionId = ChapterId;
