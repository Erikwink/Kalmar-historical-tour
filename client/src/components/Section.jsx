/**
 * Section wrapper with title, optional action beside title, and content below.
 */
export default function Section({ title, action, children }) {
  return (
    <section>
      <div className="section-header">
        <span className="section-header__title">{title}</span>
        {action}
      </div>
      {children}
    </section>
  );
}
