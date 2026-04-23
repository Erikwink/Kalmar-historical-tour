/**
 * Section wrapper with title, optional action beside title, and content below.
 * @param {{ title: string, action?: React.ReactNode, children?: React.ReactNode }} props
 */
export default function Section({ title, action, children }) {
  return (
    <div>
      <div className="section-header">
        <span className="section-header__title">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
