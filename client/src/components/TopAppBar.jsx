/**
 * Lightweight top app bar for the headset client.
 */
export default function TopAppBar({ title, subtitle }) {
  return (
    <header className="top-app-bar top-app-bar--medium">
      <span className="top-app-bar__sub">Headset Client</span>
      <h1 className="top-app-bar__title">{title}</h1>
      {subtitle ? <p className="top-app-bar__caption">{subtitle}</p> : null}
    </header>
  );
}
