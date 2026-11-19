import { Fragment, type ReactNode } from "react";
import { SITE } from "../../content.ts";
import { pad, usesOf } from "../../lib/cv.ts";
import { delay, ExtLink, PageHead } from "../ui.tsx";

export default function Toolbox() {
  const pg = SITE.pages.toolbox;
  return (
    <>
      <PageHead title={pg.title || "The *toolbox*"} intro={pg.intro} />
      {SITE.skills
        .filter((g) => g.items.length)
        .map((g) => (
          <section key={g.group} className="tb-group">
            <h2 className="tl-heading reveal">
              {g.group}
              <span className="tb-count">({pad(g.items.length)})</span>
            </h2>
            <ul className="tb-grid">
              {g.items.map((tool, i) => (
                <ToolCard key={tool} tool={tool} i={i} />
              ))}
            </ul>
          </section>
        ))}
    </>
  );
}

function ToolCard({ tool, i }: { tool: string; i: number }) {
  const u = usesOf(tool);
  const rows: [string, ReactNode][] = [];
  if (u.work.length) rows.push(["Work", u.work.join(", ")]);
  if (u.projects.length) {
    rows.push([
      "Projects",
      u.projects.map((p, j) => {
        const href = p.live || p.repo;
        return (
          <Fragment key={p.name}>
            {j > 0 && ", "}
            {href ? (
              <ExtLink href={href} cursor="Visit">
                {p.name}
              </ExtLink>
            ) : (
              p.name
            )}
          </Fragment>
        );
      }),
    ]);
  }
  if (u.study.length) rows.push(["Study", u.study.join(", ")]);

  // The card sits inside the list item so its hover lift doesn't fight the
  // scroll reveal, which also animates transform.
  return (
    <li className="reveal" style={delay((i % 4) * 60)}>
      <div className="tb-card">
        <div className="tb-top">
          <h3 className="tb-name">{tool}</h3>
          {u.now && (
            <span className="tb-now">
              <span className="status-dot" aria-hidden="true" />
              In use now
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <dl className="tb-where">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </li>
  );
}
