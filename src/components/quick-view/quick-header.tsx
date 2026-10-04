import Link from "next/link";
import { profile } from "@/content/profile";
import { quickViewCopy } from "@/content/quick-view";
import { cn } from "@/lib/cn";
import { BackButton } from "./back-button";

const linkClass =
  "text-plasma inline-flex min-h-11 items-center underline underline-offset-4 hover:text-coin";

export function QuickHeader() {
  const resume = profile.links.find((l) => l.id === "resume");
  const others = profile.links.filter((l) => l.id !== "resume");
  return (
    <header className="border-grid mb-10 border-b-2 pb-8">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="font-pixel text-px-lg text-coin sm:text-px-xl leading-relaxed">{profile.name}</h1>
      <p className="text-starlight mt-3 text-xl font-semibold">{profile.headline}</p>
      <p className="text-dust mt-2 max-w-[65ch]">{profile.tagline}</p>
      <p className="text-dust mt-2">{profile.region}</p>
      <nav aria-label={quickViewCopy.contactLabel} className="mt-4">
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {others.map((l) => (
            <li key={l.id}>
              <a href={l.href} className={linkClass}>
                {"display" in l ? l.display : l.label}
              </a>
            </li>
          ))}
          {resume ? (
            <li>
              <a href={resume.href} download className={linkClass}>
                {quickViewCopy.resumePdf}
              </a>
            </li>
          ) : null}
          <li>
            <Link href={quickViewCopy.resumePageHref} prefetch={false} className={cn(linkClass)}>
              {quickViewCopy.resumePage}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
