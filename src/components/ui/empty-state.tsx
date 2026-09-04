export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card empty-state">
      <h3 style={{ margin: 0, fontSize: "0.92rem" }}>{title}</h3>
      {description ? (
        <p className="muted" style={{ margin: "0.3rem auto 0", maxWidth: 400, fontSize: "0.8rem" }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: "0.65rem" }}>{action}</div> : null}
    </div>
  );
}
