"use client";

import { useState } from "react";
import Link from "next/link";
import { profile } from "@/content/profile";
import { transmission } from "@/content/transmission";
import { buttonClasses } from "@/components/ui/pixel-button";
import { useGame } from "@/providers/game-provider";
import type { SocialLink } from "@/types/content";
import { LinkCardBody, linkCardClasses } from "./link-card";

const COPIED_RESET_MS = 2000;
const RESUME_PAGE = "/resume/";
const MAILTO = `mailto:${profile.email}?subject=${encodeURIComponent(transmission.mail.subject)}&body=${encodeURIComponent(transmission.mail.body)}`;

const hrefFor = (link: SocialLink): string => (link.id === "email" ? MAILTO : link.href);
const isExternal = (link: SocialLink) => link.id === "linkedin" || link.id === "github";

/**
 * The contact links: big, glowing and always usable (never gated behind the dish). Sending a
 * signal only replays a small ping on them.
 */
export function Frequencies({ pinged }: { pinged: boolean }) {
  const [copied, setCopied] = useState(false);
  const { sfx } = useGame();
  const copy = transmission.frequencies;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      sfx.play("promote");
      window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      /* clipboard unavailable: the mailto link still works */
    }
  };

  return (
    <section aria-labelledby="frequencies-title">
      <h3 id="frequencies-title" className="font-pixel text-px-md text-plasma uppercase">
        {copy.title}
      </h3>
      <p className="text-dust mt-3 mb-5 max-w-[52ch]">{copy.intro}</p>
      <ul className="flex flex-col gap-5">
        {profile.links.map((link) => {
          const card = transmission.cards[link.id];
          return (
            <li key={link.id} data-fx-accent={card.accent}>
              <a
                href={hrefFor(link)}
                aria-label={link.label}
                {...(link.id === "resume" ? { download: true } : {})}
                {...(isExternal(link) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={linkCardClasses(card.accent, pinged)}
              >
                <LinkCardBody
                  accent={card.accent}
                  glyph={card.glyph}
                  title={link.label}
                  blurb={card.blurb}
                  detail={"display" in link ? link.display : undefined}
                />
              </a>
            </li>
          );
        })}
        <li data-fx-accent={transmission.copyCard.accent}>
          <button
            type="button"
            onClick={copyEmail}
            className={linkCardClasses(transmission.copyCard.accent, pinged)}
          >
            <LinkCardBody
              accent={transmission.copyCard.accent}
              glyph={transmission.copyCard.glyph}
              title={copy.copy}
              blurb={transmission.copyCard.blurb}
            />
          </button>
        </li>
      </ul>
      <p className="mt-4 flex flex-wrap items-center gap-x-4">
        <Link href={RESUME_PAGE} prefetch={false} className={buttonClasses("ghost")}>
          {copy.resumePage}
        </Link>
        <span role="status" aria-live="polite" className="font-pixel text-px-xs text-xp">
          {copied ? copy.copied : ""}
        </span>
      </p>
    </section>
  );
}
