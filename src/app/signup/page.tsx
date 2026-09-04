"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/ui/site-footer";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Department } from "@/lib/types";
import { roleHome } from "@/lib/ui";

const OTHER = "__OTHER__";

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentChoice, setDepartmentChoice] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(roleHome(user.role));
    }
  }, [user, loading, router]);

  useEffect(() => {
    apiFetch<Department[]>("/api/departments/public")
      .then(setDepartments)
      .catch(() => setError("Could not load departments"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setDoneMessage("");
    setSubmitting(true);
    try {
      const isOther = departmentChoice === OTHER;
      const message = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        ...(isOther
          ? { otherDepartment: true, otherDepartmentNote: otherNote.trim() }
          : { departmentId: departmentChoice }),
      });
      setDoneMessage(message);
      setName("");
      setEmail("");
      setPassword("");
      setDepartmentChoice("");
      setOtherNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div
        className="auth-split"
        style={{
          minHeight: 0,
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
        }}
      >
      <section
        style={{
          background: "linear-gradient(165deg, #1a472a 0%, #12331e 70%)",
          color: "white",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 600 }}>
            MINISTRY OF NATIONAL FOOD SECURITY & RESEARCH
          </p>
          <h1 style={{ margin: "1rem 0 0.75rem", fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>
            Create your account
          </h1>
          <p style={{ margin: 0, maxWidth: 420, opacity: 0.9, lineHeight: 1.55 }}>
            Choose your department when registering. An administrator must approve
            your account before you can sign in.
          </p>
        </div>
        <div style={{ display: "grid", placeItems: "center", flex: 1, padding: "1.5rem 0" }}>
          <Image
            src="/mnfsr-logo.jpg"
            alt="MNFSR"
            width={300}
            height={300}
            priority
            className="auth-brand-logo"
          />
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>
          © {new Date().getFullYear()} Ministry of National Food Security & Research
        </p>
      </section>

      <section
        style={{
          background: "#e8f5e9",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <form onSubmit={onSubmit} className="card" style={{ width: "100%", maxWidth: 420, padding: "2rem" }}>
          <h2 style={{ margin: 0 }}>Sign up</h2>
          <p className="muted" style={{ margin: "0.4rem 0 1.5rem" }}>
            Public registration creates a User account pending approval.
          </p>

          {doneMessage ? (
            <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
              {doneMessage}{" "}
              <Link href="/login" style={{ fontWeight: 700, color: "inherit" }}>
                Go to sign in
              </Link>
            </div>
          ) : null}

          <div className="field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={departmentChoice}
              onChange={(e) => setDepartmentChoice(e.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
              <option value={OTHER}>Other</option>
            </select>
          </div>
          {departmentChoice === OTHER ? (
            <div className="field" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="otherNote">Specify your department</label>
              <input
                id="otherNote"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder="e.g. Livestock Extension"
                required
                minLength={2}
              />
            </div>
          ) : (
            <div style={{ marginBottom: "1.25rem" }} />
          )}

          {error ? (
            <p style={{ color: "#b91c1c", margin: "0 0 1rem", fontSize: "0.9rem" }}>{error}</p>
          ) : null}

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Submitting..." : "Request access"}
          </button>

          <p style={{ margin: "1.1rem 0 0", textAlign: "center" }}>
            Already registered?{" "}
            <Link href="/login" style={{ color: "var(--mnfsr-green)", fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        </form>
      </section>
      </div>
      <SiteFooter light />
    </div>
  );
}
