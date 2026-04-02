import { MS_FILL } from "../utils/iconStyles";

/**
 * Floating action button with optional icon and variant styling.
 * @param {{ icon?: string, variant?: 'danger'|'outline', disabled?: boolean, onClick: Function, children: React.ReactNode }} props
 */
export default function Fab({ icon, variant, disabled, onClick, children }) {
  return (
    <div className="fab-wrap">
      <button
        className={`efab${variant ? ` efab--${variant}` : ""}`}
        disabled={disabled}
        onClick={onClick}
      >
        {icon && <span className="ms" style={MS_FILL}>{icon}</span>}
        {children}
      </button>
    </div>
  );
}
