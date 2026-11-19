import { Fragment } from "react";
import { SITE } from "../../content.ts";
import { entryGroups, fmtDate, prettyUrl, telHref } from "../../lib/cv.ts";
import { ExtLink, Icon, useView, ViewSwitch } from "../ui.tsx";

export default function Cv() {
  const P = SITE.person;
  const cv = SITE.cv;
  const [all, setAll] = useView();
  const groups = entryGroups("Experience");
  const entries = groups.flatMap((g) => g.items);
  const shown = (relevant: boolean) => all || relevant;

  // The CV keeps a document width (wrapped in .cv-wrap) so its lines stay readable.
  return (
    <div className="cv-wrap">
      <div className="cv-toolbar">
        <ViewSwitch all={all} setAll={setAll} shown={entries.filter((e) => shown(e.entry.relevant)).length} total={entries.length} />
        <button id="print-cv" className="btn btn-primary" type="button" data-cursor="Print" onClick={() => window.print()}>
          <Icon name="download" />
          Save as PDF
        </button>
      </div>
      <article className="cv" aria-label="Curriculum vitae">
        <header className="cv-head">
          <div className="cv-id">
            {P.photo ? (
              <img className="cv-avatar" src={P.photo} alt={`Portrait of ${P.name}`} />
            ) : (
              <div className="cv-avatar cv-monogram" aria-hidden="true">
                {P.initials}
              </div>
            )}
            <div>
              <p className="cv-kicker">Curriculum vitae</p>
              <h1 className="cv-name">{P.name}</h1>
              <p className="cv-role">{P.role}</p>
            </div>
          </div>
          <ul className="cv-contact">
            {P.email && (
              <li>
                <Icon name="mail" />
                <a href={`mailto:${P.email}`} data-cursor="Write">
                  {P.email}
                </a>
              </li>
            )}
            {P.phone && (
              <li>
                <Icon name="phone" />
                <a href={telHref(P.phone)} data-cursor="Call">
                  {P.phone}
                </a>
              </li>
            )}
            {P.location && (
              <li>
                <Icon name="pin" />
                {P.location}
              </li>
            )}
            {(["github", "linkedin", "website"] as const).map((k) => {
              const href = P.links[k];
              return (
                href && (
                  <li key={k}>
                    <Icon name={k === "website" ? "link" : k} />
                    <ExtLink href={href} cursor="Visit">
                      {prettyUrl(href)}
                    </ExtLink>
                  </li>
                )
              );
            })}
          </ul>
        </header>
        <div className="cv-body">
          <div className="cv-main">
            {cv.summary && (
              <section className="cv-section">
                <h3 className="cv-heading">Profile</h3>
                <p className="cv-summary">{cv.summary}</p>
              </section>
            )}
            {groups.map((g) => (
              <section key={g.id} className="cv-section" hidden={!g.items.some((e) => shown(e.entry.relevant))}>
                <h3 className="cv-heading">{g.title}</h3>
                <ol className="cv-list">
                  {g.items.map(({ entry, heading, org, bullets }, i) => (
                    <li key={i} className="cv-entry" hidden={!shown(entry.relevant)}>
                      <p className="cv-date">
                        {entry.start ? (
                          <>
                            <span>{fmtDate(entry.start)}</span>
                            <span>– {fmtDate(entry.end)}</span>
                          </>
                        ) : (
                          <span>{fmtDate(entry.end)}</span>
                        )}
                      </p>
                      <div>
                        <h4>{heading}</h4>
                        <p className="cv-org">{[org, entry.location].filter(Boolean).join(" · ")}</p>
                        {bullets.length > 0 && (
                          <ul className="cv-bullets">
                            {bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
          <aside className="cv-side">
            {SITE.skills.length > 0 && (
              <section className="cv-section">
                <h3 className="cv-heading">Skills</h3>
                {SITE.skills.map((g) => (
                  <div key={g.group} className="cv-skill">
                    <h4>{g.group}</h4>
                    <p>{g.items.join(", ")}</p>
                  </div>
                ))}
              </section>
            )}
            {cv.languages.length > 0 && (
              <section className="cv-section">
                <h3 className="cv-heading">Languages</h3>
                <dl className="cv-langs">
                  {cv.languages.map((l) => (
                    <Fragment key={l.name}>
                      <dt>{l.name}</dt>
                      <dd>{l.level}</dd>
                    </Fragment>
                  ))}
                </dl>
              </section>
            )}
            {cv.certifications.length > 0 && (
              <section className="cv-section">
                <h3 className="cv-heading">Certifications</h3>
                <ul className="cv-certs">
                  {cv.certifications.map((c) => (
                    <li key={c.name}>
                      {c.url ? <ExtLink href={c.url}>{c.name}</ExtLink> : c.name}
                      <span className="muted">{[c.issuer, c.year].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}
