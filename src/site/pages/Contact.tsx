import { Link } from "react-router";
import { SITE } from "../../content.ts";
import { prettyUrl, telHref } from "../../lib/cv.ts";
import { CopyButton, delay, Icon, Rich } from "../ui.tsx";

interface Channel {
  label: string;
  value: string;
  href?: string;
  cursor?: string;
  copy?: string;
  external?: boolean;
  internal?: boolean;
}

export default function Contact() {
  const P = SITE.person;
  const pg = SITE.pages.contact;
  const channels = [
    P.email && { label: "Email", value: P.email, href: `mailto:${P.email}`, cursor: "Write", copy: P.email },
    P.phone && { label: "Phone", value: P.phone, href: telHref(P.phone), cursor: "Call", copy: P.phone },
    P.links.github && { label: "GitHub", value: prettyUrl(P.links.github), href: P.links.github, cursor: "Visit", external: true },
    P.links.linkedin && { label: "LinkedIn", value: prettyUrl(P.links.linkedin), href: P.links.linkedin, cursor: "Visit", external: true },
    { label: "CV", value: "Read the full CV", href: "/cv", cursor: "Read", internal: true },
    P.location && { label: "Based in", value: P.location },
  ].filter(Boolean) as Channel[];

  return (
    <div className="contact-layout">
      <div className="contact-intro">
        <h1 className="contact-title reveal">
          <Rich text={pg.title || "Get in touch."} />
        </h1>
        {pg.intro && (
          <p className="contact-text reveal" style={delay(80)}>
            <Rich text={pg.intro} />
          </p>
        )}
        {P.availability && (
          <p className="status reveal" style={delay(120)}>
            <span className="status-dot" aria-hidden="true" />
            {P.availability}
          </p>
        )}
      </div>
      <ul className="channels">
        {channels.map((c, i) => (
          <li key={c.label} className={`channel reveal${c.href ? " is-link" : ""}`} style={delay(100 + i * 60)}>
            <span className="channel-label">{c.label}</span>
            {c.internal ? (
              <Link className="channel-value" to={c.href!} data-cursor={c.cursor} viewTransition>
                {c.value}
              </Link>
            ) : c.href ? (
              <a
                className="channel-value"
                href={c.href}
                data-cursor={c.cursor}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {c.value}
              </a>
            ) : (
              <span className="channel-value">{c.value}</span>
            )}
            {c.copy ? (
              <CopyButton text={c.copy} label={c.label} />
            ) : (
              <span className="channel-arrow" aria-hidden="true">
                {c.href && <Icon name={c.external ? "arrow" : "right"} />}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
