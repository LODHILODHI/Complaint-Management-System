"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { ApprovalStatus, AuthUser, Department, Role } from "@/lib/types";
import { formatDate } from "@/lib/ui";

type ParentTab = "users" | "master";
type RoleTab = "ALL" | "PENDING" | Role;
type ManagedUser = AuthUser & { createdAt?: string };

function roleLabel(role: string) {
  if (role === "DEPARTMENT_HEAD") return "HOD";
  return role;
}

function statusBadge(status?: ApprovalStatus) {
  if (status === "PENDING") return "badge-progress";
  if (status === "REJECTED") return "badge-open";
  return "badge-resolved";
}

function profileBadge(u: ManagedUser) {
  if (u.role !== "USER") {
    return { label: "N/A", className: "badge-progress" };
  }
  if (u.profileCompleted) {
    return { label: "Complete", className: "badge-resolved" };
  }
  return { label: "Incomplete", className: "badge-open" };
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserManagementView() {
  const { user: me } = useAuth();
  const searchParams = useSearchParams();
  const prefDeptId = searchParams.get("departmentId") ?? "";
  const startMaster = searchParams.get("section") === "master";
  const startHeads = searchParams.get("tab") === "heads";

  const [parentTab, setParentTab] = useState<ParentTab>(
    startMaster ? "master" : "users",
  );
  const [roleTab, setRoleTab] = useState<RoleTab>(
    startHeads ? "DEPARTMENT_HEAD" : "ALL",
  );

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [homeDepartmentId, setHomeDepartmentId] = useState(prefDeptId);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState("");

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingUser, setApprovingUser] = useState<ManagedUser | null>(null);
  const [approveDeptId, setApproveDeptId] = useState("");

  async function load() {
    const [u, d] = await Promise.all([
      apiFetch<ManagedUser[]>("/api/admin/users"),
      apiFetch<Department[]>("/api/departments"),
    ]);
    setUsers(u);
    setDepartments(d);
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      ALL: users.length,
      PENDING: users.filter((u) => u.approvalStatus === "PENDING").length,
      USER: users.filter((u) => u.role === "USER").length,
      ADMIN: users.filter((u) => u.role === "ADMIN").length,
      DEPARTMENT_HEAD: users.filter((u) => u.role === "DEPARTMENT_HEAD").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    if (roleTab === "ALL") return users;
    if (roleTab === "PENDING") {
      return users.filter((u) => u.approvalStatus === "PENDING");
    }
    return users.filter((u) => u.role === roleTab);
  }, [users, roleTab]);

  function openCreateUser() {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("USER");
    setHomeDepartmentId(prefDeptId);
    setDepartmentIds([]);
    setError("");
    setUserModalOpen(true);
  }

  function openEditUser(user: ManagedUser) {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setRole(user.role);
    setHomeDepartmentId(user.homeDepartmentId ?? user.homeDepartment?.id ?? "");
    setDepartmentIds((user.managedDepartments ?? []).map((d) => d.id));
    setError("");
    setUserModalOpen(true);
  }

  function openCreateDept() {
    setEditingDeptId(null);
    setDeptName("");
    setError("");
    setDeptModalOpen(true);
  }

  function openEditDept(dept: Department) {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setError("");
    setDeptModalOpen(true);
  }

  function toggleDept(id: string) {
    setDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSaveUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (password && password !== confirmPassword) {
        setError("Password and confirm password do not match.");
        setBusy(false);
        return;
      }

      if (editingUserId) {
        await apiFetch(`/api/admin/users/${editingUserId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            role,
            ...(role === "DEPARTMENT_HEAD"
              ? { departmentIds, homeDepartmentId: null }
              : role === "USER"
                ? {
                    departmentIds: [],
                    homeDepartmentId: homeDepartmentId || null,
                  }
                : { departmentIds: [], homeDepartmentId: null }),
          }),
        });

        if (password) {
          await apiFetch(`/api/admin/users/${editingUserId}/password`, {
            method: "PUT",
            body: JSON.stringify({
              newPassword: password,
              confirmPassword,
            }),
          });
        }

        setSuccess(
          password
            ? "User updated and password set (no old password required)."
            : "User updated.",
        );
      } else {
        await apiFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
            ...(role === "DEPARTMENT_HEAD"
              ? { departmentIds }
              : role === "USER"
                ? { homeDepartmentId: homeDepartmentId || null }
                : {}),
          }),
        });
        setSuccess("User created.");
      }
      setUserModalOpen(false);
      await load();
      setRoleTab(role === "DEPARTMENT_HEAD" ? "DEPARTMENT_HEAD" : roleTab);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteUser(id: string) {
    if (me?.id === id) {
      setError("You cannot delete your own account.");
      return;
    }
    if (!confirm("Delete this user permanently?")) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      await load();
      setSuccess("User deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function openApprove(user: ManagedUser) {
    setApprovingUser(user);
    setApproveDeptId(user.homeDepartmentId ?? user.homeDepartment?.id ?? "");
    setError("");
    setApproveModalOpen(true);
  }

  async function onApproveUser(e: FormEvent) {
    e.preventDefault();
    if (!approvingUser) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/users/${approvingUser.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          homeDepartmentId: approveDeptId || null,
        }),
      });
      setApproveModalOpen(false);
      setApprovingUser(null);
      await load();
      setSuccess("User approved. They can sign in now.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRejectUser(id: string) {
    if (!confirm("Reject this registration? They will not be able to sign in.")) {
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/users/${id}/reject`, { method: "POST" });
      await load();
      setSuccess("Registration rejected.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveDepartment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (editingDeptId) {
        await apiFetch(`/api/admin/departments/${editingDeptId}`, {
          method: "PUT",
          body: JSON.stringify({ name: deptName.trim() }),
        });
        setSuccess("Department updated.");
      } else {
        await apiFetch("/api/admin/departments", {
          method: "POST",
          body: JSON.stringify({ name: deptName.trim() }),
        });
        setSuccess("Department created.");
      }
      setDeptModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteDepartment(id: string) {
    if (!confirm("Delete this department?")) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/admin/departments/${id}`, { method: "DELETE" });
      await load();
      setSuccess("Department deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;

  return (
    <>
      <PageHeader
        title="User Management"
        description="Full CRUD for users and master data (departments)."
        actions={
          parentTab === "users" ? (
            <button type="button" className="btn btn-primary" onClick={openCreateUser}>
              + Create user
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openCreateDept}>
              + Add department
            </button>
          )
        }
      />

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.9rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className={`tab-pill${parentTab === "users" ? " active" : ""}`}
          onClick={() => setParentTab("users")}
        >
          Users
        </button>
        <button
          type="button"
          className={`tab-pill${parentTab === "master" ? " active" : ""}`}
          onClick={() => setParentTab("master")}
        >
          Master Data
        </button>
      </div>

      {error && !userModalOpen && !deptModalOpen && !approveModalOpen ? (
        <div className="alert alert-error">{error}</div>
      ) : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      {parentTab === "users" ? (
        <>
          <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
            {(
              [
                ["ALL", "All"],
                ["PENDING", "Pending"],
                ["USER", "Users"],
                ["ADMIN", "Admins"],
                ["DEPARTMENT_HEAD", "HODs"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`tab-pill${roleTab === key ? " active" : ""}`}
                onClick={() => setRoleTab(key)}
              >
                {label}
                <span style={{ opacity: 0.75, marginLeft: 6 }}>{counts[key]}</span>
              </button>
            ))}
          </div>

          <section className="card table-wrap">
            {!filtered.length ? (
              <div style={{ padding: "1.25rem" }}>
                <EmptyState title="No users in this filter" />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Profile</th>
                    <th>Department</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>
                        {u.name}
                        {me?.id === u.id ? (
                          <span className="muted" style={{ marginLeft: 6, fontSize: "0.75rem" }}>
                            (you)
                          </span>
                        ) : null}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === "ADMIN"
                              ? "badge-resolved"
                              : u.role === "DEPARTMENT_HEAD"
                                ? "badge-progress"
                                : "badge-open"
                          }`}
                        >
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(u.approvalStatus)}`}>
                          {u.approvalStatus ?? "APPROVED"}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const p = profileBadge(u);
                          return (
                            <span className={`badge ${p.className}`} title={p.label}>
                              {p.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {u.role === "DEPARTMENT_HEAD" ? (
                          (u.managedDepartments ?? []).length ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                              {(u.managedDepartments ?? []).map((d) => (
                                <span key={d.id} className="badge badge-progress">
                                  {d.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )
                        ) : u.role === "USER" ? (
                          u.homeDepartment ? (
                            <span className="badge badge-open">{u.homeDepartment.name}</span>
                          ) : u.otherDepartmentNote ? (
                            <span className="muted" style={{ fontSize: "0.85rem" }}>
                              Other: {u.otherDepartmentNote}
                            </span>
                          ) : (
                            "—"
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="muted">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          {u.approvalStatus === "PENDING" ? (
                            <div className="row-actions-group">
                              <button
                                type="button"
                                className="btn btn-primary btn-icon"
                                onClick={() => openApprove(u)}
                                title="Approve"
                                aria-label="Approve"
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon"
                                onClick={() => onRejectUser(u.id)}
                                title="Reject"
                                aria-label="Reject"
                              >
                                <IconX />
                              </button>
                            </div>
                          ) : null}

                          {u.approvalStatus === "APPROVED" || !u.approvalStatus ? (
                            <div className="row-actions-group">
                              <button
                                type="button"
                                className="btn btn-icon btn-icon-edit"
                                onClick={() => openEditUser(u)}
                                title="Edit"
                                aria-label="Edit"
                              >
                                <IconPencil />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon"
                                onClick={() => onDeleteUser(u.id)}
                                disabled={me?.id === u.id}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          ) : null}

                          {u.approvalStatus === "REJECTED" ? (
                            <div className="row-actions-group">
                              <button
                                type="button"
                                className="btn btn-danger btn-icon"
                                onClick={() => onDeleteUser(u.id)}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : (
        <section className="card table-wrap">
          {!departments.length ? (
            <div style={{ padding: "1.25rem" }}>
              <EmptyState
                title="No departments yet"
                description="Use + Add department to create master data."
                action={
                  <button type="button" className="btn btn-primary" onClick={openCreateDept}>
                    + Add department
                  </button>
                }
              />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Assigned</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => {
                  const hods = users.filter(
                    (u) =>
                      u.role === "DEPARTMENT_HEAD" &&
                      (u.managedDepartments ?? []).some((md) => md.id === d.id),
                  );
                  const members = users.filter(
                    (u) =>
                      u.role === "USER" &&
                      (u.homeDepartmentId === d.id || u.homeDepartment?.id === d.id),
                  );
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700 }}>{d.name}</td>
                      <td>
                        <div className="assign-drop-row">
                          <details className="assign-dropdown">
                            <summary>
                              <span className="badge badge-resolved">
                                {hods.length} HOD{hods.length === 1 ? "" : "s"}
                              </span>
                            </summary>
                            <div className="assign-dropdown-panel">
                              {!hods.length ? (
                                <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                                  No HOD assigned
                                </p>
                              ) : (
                                <ul>
                                  {hods.map((h) => (
                                    <li key={h.id}>
                                      <strong>{h.name}</strong>
                                      <span className="muted">{h.email}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </details>
                          <details className="assign-dropdown">
                            <summary>
                              <span className="badge badge-open">
                                {members.length} user{members.length === 1 ? "" : "s"}
                              </span>
                            </summary>
                            <div className="assign-dropdown-panel">
                              {!members.length ? (
                                <p className="muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                                  No users in this department
                                </p>
                              ) : (
                                <ul>
                                  {members.map((m) => (
                                    <li key={m.id}>
                                      <strong>{m.name}</strong>
                                      <span className="muted">{m.email}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </details>
                        </div>
                      </td>
                      <td className="muted">{formatDate(d.createdAt)}</td>
                      <td>
                        <div className="row-actions-group">
                          <button
                            type="button"
                            className="btn btn-icon btn-icon-edit"
                            onClick={() => openEditDept(d)}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <IconPencil />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => onDeleteDepartment(d.id)}
                            title="Delete"
                            aria-label="Delete"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {userModalOpen ? (
        <Modal
          title={editingUserId ? "Edit user" : "Create user"}
          description="Users get one home department at a time. HODs can manage multiple."
          onClose={() => setUserModalOpen(false)}
        >
          <form onSubmit={onSaveUser} style={{ display: "grid", gap: "0.75rem" }}>
            <div
              className="form-2col"
              style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}
            >
              <div className="field">
                <label>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>
                  {editingUserId
                    ? "Set new password (admin — no old password)"
                    : "Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={editingUserId ? undefined : 6}
                  required={!editingUserId}
                  placeholder={editingUserId ? "Leave blank to keep current" : undefined}
                />
              </div>
              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={editingUserId ? undefined : 6}
                  required={!editingUserId || Boolean(password)}
                  placeholder={editingUserId ? "Required if setting password" : undefined}
                />
              </div>
              <div className="field">
                <label>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  required
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DEPARTMENT_HEAD">HOD</option>
                </select>
              </div>
            </div>

            {role === "USER" ? (
              <div className="field">
                <label>Home department (one only)</label>
                {!departments.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Add departments in Master Data first.
                  </p>
                ) : (
                  <>
                    <select
                      value={homeDepartmentId}
                      onChange={(e) => setHomeDepartmentId(e.target.value)}
                      required={!editingUserId}
                    >
                      <option value="">
                        {editingUserId ? "— None (unassign) —" : "Select department"}
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
                      Only one department. Choosing another replaces the current assignment.
                    </p>
                  </>
                )}
              </div>
            ) : null}

            {role === "DEPARTMENT_HEAD" ? (
              <div className="field">
                <label>Assign departments</label>
                {!departments.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    Add departments in Master Data first.
                  </p>
                ) : (
                  <div className="dept-picker">
                    <div className="dept-picker-head">
                      <p>Tap to assign. HOD can manage more than one department.</p>
                      <span className="dept-picker-count">
                        {departmentIds.length} selected
                      </span>
                    </div>
                    <div className="dept-check-grid">
                      {departments.map((d) => {
                        const selected = departmentIds.includes(d.id);
                        return (
                          <label
                            key={d.id}
                            className={`dept-check${selected ? " is-selected" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleDept(d.id)}
                            />
                            <span className="dept-check-mark" aria-hidden>
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M5 13l4 4L19 7"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>{d.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {error ? <div className="alert alert-error">{error}</div> : null}

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUserModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : editingUserId ? "Update user" : "Create user"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deptModalOpen ? (
        <Modal
          title={editingDeptId ? "Edit department" : "Add department"}
          description="Master data used for complaints and HOD assignment."
          onClose={() => setDeptModalOpen(false)}
        >
          <form onSubmit={onSaveDepartment} style={{ display: "grid", gap: "0.75rem" }}>
            <div className="field">
              <label>Department name</label>
              <input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Public Works"
                required
              />
            </div>
            {error ? <div className="alert alert-error">{error}</div> : null}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeptModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : editingDeptId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {approveModalOpen && approvingUser ? (
        <Modal
          title="Approve registration"
          description="Confirm department, then allow this user to sign in."
          onClose={() => {
            setApproveModalOpen(false);
            setApprovingUser(null);
          }}
        >
          <form onSubmit={onApproveUser} style={{ display: "grid", gap: "0.75rem" }}>
            <p style={{ margin: 0 }}>
              <strong>{approvingUser.name}</strong> · {approvingUser.email}
            </p>
            {approvingUser.otherDepartmentNote ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                Requested Other: {approvingUser.otherDepartmentNote}
              </p>
            ) : null}
            <div className="field">
              <label>Assign department</label>
              <select
                value={approveDeptId}
                onChange={(e) => setApproveDeptId(e.target.value)}
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {error ? <div className="alert alert-error">{error}</div> : null}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setApproveModalOpen(false);
                  setApprovingUser(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy || !approveDeptId}>
                {busy ? "Approving..." : "Approve & allow login"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <DashboardGate roles={["ADMIN"]} title="User Management">
      <Suspense fallback={<LoadingBlock />}>
        <UserManagementView />
      </Suspense>
    </DashboardGate>
  );
}
