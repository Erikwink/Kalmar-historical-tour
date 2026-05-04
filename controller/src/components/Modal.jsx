/**
 * Base modal with backdrop. Closes on backdrop click.
 * @param {{ onClose: Function, children: React.ReactNode }} props
 */
export default function Modal({ onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
