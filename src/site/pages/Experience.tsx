import { Link } from "react-router";
import { SITE } from "../../content.ts";
import { dateRange, entryGroups, pad } from "../../lib/cv.ts";
import { delay, Icon, PageHead, Rich, useView, ViewSwitch } from "../ui.tsx";

export default function Experience() {
  const [all, setAll] = useView();
  const groups = entryGroups("Work");
  const entries = groups.flatMap((g) => g.items);
  const shown = (relevant: boolean) => all || relevant;
  const toolCount = SITE.skills.reduce((n, g) => n + g.items.length, 0);
  const langs = SITE.cv.languages;

  return (
    <>
      <PageHead title={SITE.pages.experience.title || "The journey *so far*"} />
      <div className="exp-layout">
        <aside className="exp-intro reveal" style={delay(80)}>
          {SITE.about.map((p, i) => (
            <p key={i} className={i === 0 ? "about-lead" : ""}>
              <Rich text={p} />
            </p>
          ))}
          <div className="view-filter">
            <ViewSwitch all={all} setAll={setAll} shown={entries.filter((e) => shown(e.entry.relevant)).length} total={entries.length} />
          </div>
        </aside>
        <div className="exp-timeline">
          {groups.map((g, gi) => (
            <section key={g.id} className="tl-group reveal" style={delay(120 + gi * 80)} hidden={!g.items.some((e) => shown(e.entry.relevant))}>
              <h2 className="tl-heading">{g.title}</h2>
              <ol className="tl">
                {g.items.map(({ entry, heading, org, bullets }, i) => (
                  <li key={i} className="tl-item" hidden={!shown(entry.relevant)}>
                    <p className="tl-date">{dateRange(entry)}</p>
                    <h3 className="tl-title">{heading}</h3>
                    {(org || entry.location) && <p className="tl-org">{[org, entry.location].filter(Boolean).join(" · ")}</p>}
                    {bullets.length > 0 && (
                      <ul className="tl-bullets">
                        {bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      {/* The tools themselves are listed on the Toolbox page, so this
          section points there and keeps the spoken languages. */}
      {(toolCount > 0 || langs.length > 0) && (
        <section className="exp-skills">
          <div className="section-label reveal">
            <span>Skills</span>
            <span>Tools &amp; languages</span>
          </div>
          <h2 className="section-title reveal">
            Tools of the <em>trade</em>
          </h2>
          <div className="skill-groups">
            {toolCount > 0 && (
              <div className="skill-group exp-toolbox reveal">
                <h3>
                  <span>Toolbox</span>
                  <span>({pad(toolCount)})</span>
                </h3>
                <p>The {toolCount} languages, frameworks and tools I work with have a page of their own, showing where I've used each one.</p>
                <Link className="btn btn-primary" to="/toolbox" data-cursor="Open" viewTransition>
                  Open the toolbox <Icon name="right" />
                </Link>
              </div>
            )}
            {langs.length > 0 && (
              <div className="skill-group reveal">
                <h3>
                  <span>Spoken</span>
                  <span>({pad(langs.length)})</span>
                </h3>
                <ul>
                  {langs.map((l) => (
                    <li key={l.name}>
                      {l.name} <span className="skill-level">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
