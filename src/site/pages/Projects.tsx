import { SITE } from "../../content.ts";
import { pad } from "../../lib/cv.ts";
import { delay, ExtLink, Icon, PageHead } from "../ui.tsx";

export default function Projects() {
  const pg = SITE.pages.projects;
  return (
    <>
      <PageHead title={pg.title || "Selected *work*"} intro={pg.intro} />
      <ol className="index">
        {SITE.projects.map((p, i) => {
          const primary = p.live || p.repo;
          return (
            <li key={p.name} className={`index-row reveal${primary ? " is-link" : ""}`} style={delay(120 + (i % 4) * 70)}>
              <span className="index-no">{pad(i + 1)}</span>
              <div className="index-main">
                <h2 className="index-title">
                  {primary ? (
                    <ExtLink href={primary} className="index-link" cursor={p.live ? "Visit" : "Code"}>
                      {p.name}
                    </ExtLink>
                  ) : (
                    p.name
                  )}
                </h2>
                {p.description && <p className="index-desc">{p.description}</p>}
                {p.live && p.repo && (
                  <ExtLink href={p.repo} className="index-sub" cursor="Code">
                    Source <Icon name="arrow" />
                  </ExtLink>
                )}
              </div>
              <span className="index-stack">{(p.tags || []).join(" · ")}</span>
              <span className="index-year">{p.year || ""}</span>
              <span className="index-arrow" aria-hidden="true">
                {primary && <Icon name="arrow" />}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
