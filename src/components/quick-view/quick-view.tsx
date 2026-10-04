import { Certifications, EducationBlock, Skills, Tools } from "./details";
import { ExperienceList } from "./experience-list";
import { ProjectList } from "./project-list";
import { QuickHeader } from "./quick-header";

/**
 * Recruiter-friendly summary: static, no animation, no canvases. Shown only when
 * `<html data-quick>` is set (the page wraps it in `.quick-only`).
 */
export function QuickView() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <QuickHeader />
      <ExperienceList />
      <ProjectList />
      <Skills />
      <Tools />
      <Certifications />
      <EducationBlock />
    </div>
  );
}
