"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/ui/site-footer";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon:
    | "complaints"
    | "departments"
    | "heads"
    | "profile"
    | "new"
    | "assigned"
    | "users"
    | "password"
    | "reports";
  section?: string;
};

const navByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin/complaints", label: "Complaints", icon: "complaints" },
    { href: "/admin/reports", label: "Reports", icon: "reports" },
    {
      href: "/admin/users",
      label: "User Management",
      icon: "users",
      section: "ADMINISTRATION",
    },
    {
      href: "/account/change-password",
      label: "Change password",
      icon: "password",
      section: "ACCOUNT",
    },
  ],
  USER: [
    { href: "/user/complaints", label: "My Complaints", icon: "complaints" },
    { href: "/user/complaints/new", label: "File Complaint", icon: "new" },
    { href: "/user/reports", label: "Reports", icon: "reports" },
    {
      href: "/user/profile",
      label: "Profile",
      icon: "profile",
      section: "ACCOUNT",
    },
    {
      href: "/account/change-password",
      label: "Change password",
      icon: "password",
    },
  ],
  DEPARTMENT_HEAD: [
    {
      href: "/depthead/complaints",
      label: "Assigned Complaints",
      icon: "assigned",
    },
    { href: "/depthead/reports", label: "Reports", icon: "reports" },
    {
      href: "/account/change-password",
      label: "Change password",
      icon: "password",
      section: "ACCOUNT",
    },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/user/complaints") {
    return pathname === href || /^\/user\/complaints\/[^/]+$/.test(pathname);
  }
  if (href === "/admin/users") {
    return (
      pathname.startsWith("/admin/users") ||
      pathname.startsWith("/admin/department-heads") ||
      pathname.startsWith("/admin/master-data") ||
      pathname.startsWith("/admin/departments")
    );
  }
  if (href === "/admin/complaints" || href === "/depthead/complaints") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (
    href === "/admin/reports" ||
    href === "/depthead/reports" ||
    href === "/user/reports"
  ) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  if (href === "/account/change-password") {
    return pathname === href;
  }
  return pathname === href;
}

function NavIcon({ type }: { type: NavItem["icon"] }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (type) {
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "departments":
      return (
        <svg {...props}>
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "heads":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "profile":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 12 0v1" />
        </svg>
      );
    case "password":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M8 9h2" />
        </svg>
      );
    case "new":
      return (
        <svg {...props}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "assigned":
      return (
        <svg {...props}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const items = user ? navByRole[user.role] : [];

  return (
    <div className="app-shell">
      <aside>
        <div
          style={{
            display: "flex",
            gap: "0.7rem",
            alignItems: "center",
            padding: "0.4rem 0.5rem 1rem",
          }}
        >
          <Image
            src="/mnfsr-logo.jpg"
            alt="MNFSR"
            width={42}
            height={42}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.72rem",
                letterSpacing: "0.04em",
                opacity: 0.8,
                lineHeight: 1.2,
              }}
            >
              MNFSR
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2 }}>
              Complaints Portal
            </div>
          </div>
        </div>

        <nav className="side-nav">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <div key={item.href}>
                {item.section ? (
                  <div className="side-nav-section">{item.section}</div>
                ) : null}
                <Link
                  href={item.href}
                  className={`side-nav-link${active ? " active" : ""}`}
                >
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="side-nav-spacer" aria-hidden />

        <div
          style={{
            borderTop: "1px solid rgb(255 255 255 / 10%)",
            paddingTop: "0.85rem",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ fontWeight: 700 }}>{user?.name}</div>
          <div style={{ opacity: 0.7, marginBottom: "0.35rem", fontSize: "0.75rem" }}>
            {user?.role.replace(/_/g, " ")}
          </div>
          <div
            style={{
              height: 1,
              background: "rgb(255 255 255 / 12%)",
              margin: "0.55rem 0 0.65rem",
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={logout}
            style={{
              width: "100%",
              background: "transparent",
              color: "white",
              borderColor: "rgb(255 255 255 / 22%)",
              borderRadius: 10,
              padding: "0.55rem 0.85rem",
              fontSize: "0.85rem",
            }}
          >
            Sign out
          </button>
          <p
            style={{
              opacity: 0.5,
              fontSize: "0.65rem",
              margin: "0.75rem 0 0",
              lineHeight: 1.4,
            }}
          >
            © {new Date().getFullYear()} Ministry of National Food Security &
            Research, Government of Pakistan
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <Image
              src="/mnfsr-logo.jpg"
              alt=""
              width={26}
              height={26}
              style={{ borderRadius: "50%" }}
            />
            <div style={{ fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 700 }}>MNFSR COMPLAINTS PORTAL</span>
              <span className="muted"> / {title}</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              border: "1px solid var(--mnfsr-border)",
              borderRadius: 999,
              padding: "0.3rem 0.65rem 0.3rem 0.3rem",
              background: "#f8faf9",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--mnfsr-green)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {(user?.name ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontWeight: 700, fontSize: "0.8rem" }}>{user?.name}</div>
              <div className="muted" style={{ fontSize: "0.7rem" }}>
                {user?.role.replace(/_/g, " ")}
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
