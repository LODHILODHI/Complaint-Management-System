"use client";

export function Modal({
  title,
  description,
  onClose,
  children,
  wide,
  headerActions,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  headerActions?: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal-card${wide ? " modal-card-wide" : ""}`}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h3>
            {description ? (
              <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.82rem" }}>
                {description}
              </p>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            {headerActions}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
