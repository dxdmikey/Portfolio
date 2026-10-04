"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { accentText } from "@/components/ui/accent";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import type { Project } from "@/types/content";
import { ArchitectureDiagram } from "./architecture-diagram";
import { STATUS_META } from "./status";
import { useBriefingTracking } from "./use-briefing-log";

function Block({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h4 className="font-pixel text-px-xs text-coin mb-3 uppercase">{title}</h4>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="bg-plasma mt-[0.6em] size-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BriefingBody({ project }: { project: Project }) {
  const meta = STATUS_META[project.status];
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 pr-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("font-pixel text-px-xs uppercase", accentText[project.accent])}>
            {project.codename}
          </span>
          <StatusBadge accent={meta.accent}>{meta.label}</StatusBadge>
          <span className="text-dust text-sm">{project.period}</span>
        </div>
        <h3 className="font-pixel text-px-md text-starlight sm:text-px-lg leading-relaxed">
          {project.name}
        </h3>
      </header>
      <div className="grid max-w-none gap-8 md:grid-cols-2">
        <Block title="The problem">
          <p className="max-w-[65ch]">{project.problem}</p>
        </Block>
        <Block title="What I did">
          <Bullets items={project.approach} />
        </Block>
        <Block title="Outcome">
          <Bullets items={project.outcome} />
        </Block>
        <Block title="Tech stack">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s}>
                <Tag>{s}</Tag>
              </li>
            ))}
          </ul>
        </Block>
      </div>
      {project.architecture ? (
        <Block title="Architecture">
          <ArchitectureDiagram architecture={project.architecture} accent={project.accent} />
        </Block>
      ) : null}
    </article>
  );
}

/**
 * The mission briefing dialog, shared by the star chart and the side-quests chapter.
 * Opening one is tracked here (briefings read, Pilot / Cartographer), so every caller counts.
 */
export function MissionBriefing({
  project,
  onClose,
}: {
  project: Project | undefined;
  onClose: () => void;
}) {
  useBriefingTracking(project?.id);
  return (
    <Modal
      open={project !== undefined}
      onClose={onClose}
      title={project ? `Mission briefing: ${project.name}` : "Mission briefing"}
    >
      {project ? <BriefingBody project={project} /> : null}
    </Modal>
  );
}
