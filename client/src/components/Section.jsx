/**
 * Section wrapper with title, optional badge, and content below.
 */
export default function Section({ title, badge, children }) {
  return (
    <section>
      <div className="section-header">
        <span className="section-header__title">{title}</span>
        {badge ? <span className="section-header__badge">{badge}</span> : null}
      </div>
      {children}
    </section>
  );
}
