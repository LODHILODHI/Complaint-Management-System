export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="card" style={{ padding: "1.2rem", textAlign: "center" }}>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        {label}
      </p>
    </div>
  );
}
