/**
 * Floating action button matching the controller action pattern.
 */
export default function Fab({ variant, disabled, onClick, href, target, rel, children }) {
  const className = `fab${variant ? ` fab--${variant}` : ""}`;

  if (href) {
    return (
      <div className="fab-wrap">
        <a
          className={className}
          href={href}
          target={target}
          rel={rel}
          aria-disabled={disabled}
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();
            }
          }}
        >
          {children}
        </a>
      </div>
    );
  }

  return (
    <div className="fab-wrap">
      <button className={className} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    </div>
  );
}
