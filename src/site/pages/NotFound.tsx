import { Link } from "react-router";

export default function NotFound() {
  return (
    <>
      <p className="kicker">Error 404 · Signal lost</p>
      <h1 className="contact-title">
        Lost in <em>space</em>.
      </h1>
      <p className="contact-text">This page doesn't exist, or it has drifted out of orbit. Let's get you back to familiar skies.</p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/" data-cursor="Home" viewTransition>
          Back to the front page
        </Link>
        <Link className="btn" to="/cv" data-cursor="Read" viewTransition>
          View CV
        </Link>
      </div>
    </>
  );
}
