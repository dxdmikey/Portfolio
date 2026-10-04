import type { Metadata } from "next";
import Link from "next/link";
import { resume } from "@/content/resume";
import { ExperienceSection } from "./experience-section";
import styles from "./resume.module.css";

export const metadata: Metadata = {
  title: "Resume",
  description: `${resume.name} — ${resume.role}. Resume: experience, education, certifications and skills.`,
  alternates: { canonical: "/resume/" },
};

const PDF_HREF = "/Kadwasra_Ravi_Kumar_Resume.pdf";

function Header() {
  return (
    <header className={styles.head}>
      <h1 className={styles.name}>{resume.name}</h1>
      <p className={styles.role}>{resume.role}</p>
      <p className={styles.contact}>
        <span>
          <b>Email:</b>
          <a href={`mailto:${resume.email}`}>{resume.email}</a>
        </span>
        <span>
          <b>LinkedIn:</b>
          <a href={resume.linkedinHref}>{resume.linkedin}</a>
        </span>
      </p>
      <p className={styles.contact}>
        <span>
          <b>GitHub:</b>
          <a href={resume.githubHref}>{resume.github}</a>
        </span>
        <span>
          <b>Portfolio:</b>
          <a href={resume.portfolioHref}>{resume.portfolio}</a>
        </span>
      </p>
    </header>
  );
}

export default function ResumePage() {
  const { education } = resume;
  return (
    <div className={`${styles.root} resume-root`}>
      <nav className={styles.toolbar} aria-label="Resume actions">
        <Link href="/" className={styles.btn}>
          ← Back to the game
        </Link>
        <a href={PDF_HREF} download className={`${styles.btn} ${styles.btnPrimary}`}>
          Download PDF
        </a>
      </nav>
      <main id="main" className={styles.paper}>
        <Header />

        <h2 className={styles.h2}>Professional Summary</h2>
        <p className={styles.p}>{resume.summary}</p>

        <ExperienceSection companies={resume.experience} />

        <section>
          <h2 className={styles.h2}>Education</h2>
          <p className={styles.company}>
            {education.school}, {education.location}
          </p>
          <p className={styles.p}>
            <span className={styles.italic}>{education.degree}</span> ({education.period})
          </p>
          <p className={styles.p}>{education.grade.replace(/^CGPA/, "Final CGPA:")}</p>
        </section>

        <section>
          <h2 className={styles.h2}>Certifications</h2>
          {resume.certifications.map((c) => (
            <p key={c} className={styles.p}>
              {c}
            </p>
          ))}
        </section>

        <section>
          <h2 className={styles.h2}>Skills</h2>
          <ul className={styles.skills}>
            {resume.skills.map((s) => (
              <li key={s.label}>
                <b>{s.label}:</b> {s.items}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className={styles.h2}>Data Engineering Practice Projects</h2>
          {resume.practiceProjects.map((p, i) => (
            <div key={p.title} className={styles.numbered}>
              <p>
                {i + 1}. {p.title}
              </p>
              <ul className={styles.list}>
                {p.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <p className={styles.p} style={{ marginTop: "8pt" }}>
          <b>Languages</b>: {resume.languages.join(", ")}
        </p>
      </main>
    </div>
  );
}
