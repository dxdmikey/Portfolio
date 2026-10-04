import type { ResumeCompany } from "@/content/resume";
import styles from "./resume.module.css";

export function ExperienceSection({ companies }: { companies: readonly ResumeCompany[] }) {
  return (
    <section>
      <h2 className={styles.h2}>Experience</h2>
      {companies.map((co) => (
        <div key={co.name} style={{ marginBottom: "4pt" }}>
          <p className={styles.company}>
            {co.name}, {co.location}
          </p>
          {co.roles.map((role) => (
            <div key={role.title + role.period} className={styles.roleBlock}>
              <p className={styles.roleLine}>
                {role.title} | {role.period}
              </p>
              <ul className={styles.list}>
                {role.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {role.projects.map((pr) => (
                <div key={pr.title} className={styles.project}>
                  <p className={styles.projectTitle}>Project– {pr.title}</p>
                  <ul className={styles.nested}>
                    {pr.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
