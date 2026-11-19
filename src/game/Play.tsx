/* Pixel Town: the portfolio as a little top-down game. This component is
   the game's interface (title screen, HUD, text box, windows, battle
   screen, touch controls); engine.ts runs the game inside it. */
import { useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { PAGES } from "../meta.ts";
import { useStylesheet } from "../lib/useStylesheet.ts";
import playCss from "../styles/play.css?inline";
import { startPixelTown } from "./engine.ts";

export default function Play() {
  useStylesheet(playCss);
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add("play");
    document.title = PAGES["/play"].title;
    return () => html.classList.remove("play");
  }, []);

  useEffect(() => startPixelTown(root.current!, (to) => navigate(to, { viewTransition: true })), [navigate]);

  return (
    <div ref={root}>
      <Link className="skip" to="/cv">
        Skip the game and read the CV
      </Link>

      <canvas
        id="game"
        role="img"
        aria-label="A pixel-art town to walk around. Every building opens a section of the portfolio; the map button lists them all."
      />
      <div className="vignette" aria-hidden="true" />

      {/* Title screen */}
      <section id="title" className="title" aria-labelledby="title-name">
        <div className="title-inner">
          <img id="title-avatar" className="title-avatar px" alt="" width="128" height="128" />
          <p className="title-kicker">A portfolio you can walk around in</p>
          <h1 id="title-name" className="logo">
            <span className="logo-main" />
            <span className="logo-sub" />
          </h1>
          <p className="title-role" />
          <div className="title-menu">
            <button id="start" className="px-btn is-primary is-big" type="button" autoFocus>
              <span className="tri" aria-hidden="true" />
              START
            </button>
            <button id="quick" className="px-btn" type="button">
              QUICK MENU
            </button>
            <Link className="px-btn" to="/cv">
              CV
            </Link>
          </div>
          <p className="title-press" aria-hidden="true">
            PRESS START
          </p>
        </div>
        <p className="title-foot">
          © {new Date().getFullYear()} · Made in Denmark ·{" "}
          <Link to="/" viewTransition>
            Classic site
          </Link>
        </p>
      </section>

      {/* HUD */}
      <header id="hud" className="hud" hidden>
        <button className="chip quest-chip" type="button" data-act="map" aria-label="Quest: meet Benjamin. Open the map.">
          <span className="quest-label">MEET BENJAMIN</span>
          <span id="quest-stars" className="stars" aria-hidden="true" />
          <span id="quest-count" />
        </button>
        <div className="hud-tools">
          <span className="chip bugs" title="Bugs squashed">
            <span className="bug-icon" aria-hidden="true" />
            <span className="visually-hidden">Bugs squashed:</span>
            <span id="bug-count">0</span>
          </span>
          <button className="chip" type="button" data-act="map">
            MAP <kbd>M</kbd>
          </button>
          <button className="chip" type="button" data-act="night">
            NIGHT
          </button>
          <button className="chip" type="button" data-act="sound" aria-pressed="false">
            SOUND OFF
          </button>
          <Link className="chip" to="/" viewTransition>
            CLASSIC SITE
          </Link>
        </div>
      </header>
      <p className="keys" aria-hidden="true">
        <kbd>WASD</kbd>/<kbd>ARROWS</kbd> walk · <kbd>SHIFT</kbd> run · <kbd>SPACE</kbd> talk · <kbd>M</kbd> map · or just click
      </p>

      <button id="prompt" className="prompt" type="button" hidden />
      <p id="hover" className="hover" hidden aria-hidden="true" />

      {/* Dialogue */}
      <div id="talk" className="talk frame" hidden>
        <p id="talk-name" className="talk-name frame" />
        <p id="talk-text" className="talk-text" aria-hidden="true" />
        <p id="talk-sr" className="visually-hidden" aria-live="polite" />
        <span className="talk-more" aria-hidden="true" />
        <div id="talk-choices" className="talk-choices frame" role="listbox" aria-label="Answer" hidden />
      </div>

      {/* Windows */}
      <div id="layer" className="layer" hidden>
        <section className="win frame" role="dialog" aria-modal="true" aria-labelledby="win-title" tabIndex={-1}>
          <header className="win-head">
            <h2 id="win-title" />
            <button className="win-close" type="button" aria-label="Close">
              CLOSE <kbd>ESC</kbd>
            </button>
          </header>
          <div id="win-body" className="win-body" />
        </section>
      </div>

      {/* Wild bug battle */}
      <div id="battle" className="battle" hidden role="dialog" aria-label="A wild bug appeared">
        <div className="b-stage frame">
          <div className="b-field">
            <div className="b-foe">
              <div className="b-card frame">
                <p className="b-name" id="b-foe-name" />
                <p className="b-lv">Lv.99</p>
                <div className="hp">
                  <span>HP</span>
                  <i>
                    <b id="b-foe-hp" />
                  </i>
                </div>
              </div>
              <div className="b-mon">
                <span className="b-plat" />
                <img id="b-foe-img" className="px" alt="" />
              </div>
            </div>
            <div className="b-me">
              <div className="b-mon">
                <span className="b-plat" />
                <img id="b-me-img" className="px" alt="" />
              </div>
              <div className="b-card frame">
                <p className="b-name is-me" />
                <p className="b-lv">INTERN</p>
                <div className="hp">
                  <span>HP</span>
                  <i>
                    <b style={{ width: "100%" }} />
                  </i>
                </div>
              </div>
            </div>
          </div>
          <div className="b-box">
            <p id="b-text" className="b-text" aria-live="polite" />
            <span className="talk-more" aria-hidden="true" />
            <div id="b-menu" className="b-menu frame" hidden>
              <button type="button" aria-selected="true">
                FIGHT
              </button>
              <button type="button" aria-selected="false">
                RUN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Touch controls */}
      <div className="pad" aria-hidden="true">
        <button type="button" data-dir="up" tabIndex={-1} />
        <button type="button" data-dir="left" tabIndex={-1} />
        <button type="button" data-dir="right" tabIndex={-1} />
        <button type="button" data-dir="down" tabIndex={-1} />
      </div>
      <div className="ab" aria-hidden="true">
        <button id="btn-b" type="button" tabIndex={-1}>
          B
        </button>
        <button id="btn-a" type="button" tabIndex={-1}>
          A
        </button>
      </div>

      <div id="toast" className="toast frame" role="status" hidden />
      <div id="fade" className="fade" aria-hidden="true" />
    </div>
  );
}
