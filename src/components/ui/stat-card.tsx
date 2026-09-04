export function StatCard({
  label,
  value,
  hint,
  accent = "#0f3d26",
  icon = "total",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: "total" | "open" | "progress" | "resolved";
}) {
  return (
    <div className="stat-card" style={{ ["--stat-accent" as string]: accent }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "0.45rem",
        }}
      >
        <div>
          <div
            className="muted"
            style={{
              fontSize: "0.66rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "1.45rem",
              fontWeight: 700,
              marginTop: "0.15rem",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </div>
          {hint ? (
            <div className="muted" style={{ marginTop: "0.15rem", fontSize: "0.72rem" }}>
              {hint}
            </div>
          ) : null}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: `${accent}16`,
            color: accent,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <StatIcon type={icon} />
        </div>
      </div>
    </div>
  );
}

function StatIcon({ type }: { type: "total" | "open" | "progress" | "resolved" }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "open") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (type === "progress") {
    return (
      <svg {...common}>
        <path d="M4 12a8 8 0 0 1 14.5-4.5" />
        <path d="M20 12a8 8 0 0 1-14.5 4.5" />
        <path d="M16 4h4v4M8 20H4v-4" />
      </svg>
    );
  }
  if (type === "resolved") {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
