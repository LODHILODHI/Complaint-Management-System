"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError, apiFetch } from "@/lib/api-client";
import { isCitizenProfileComplete } from "@/lib/profile";
import type { AuthUser } from "@/lib/types";

const PROVINCES = [
  "Islamabad Capital Territory",
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

function ProfileForm() {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(user?.alternatePhone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [cnic, setCnic] = useState(user?.cnic ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [province, setProvince] = useState(user?.province ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [occupation, setOccupation] = useState(user?.occupation ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setAlternatePhone(user?.alternatePhone ?? "");
    setAddress(user?.address ?? "");
    setCnic(user?.cnic ?? "");
    setCity(user?.city ?? "");
    setDistrict(user?.district ?? "");
    setProvince(user?.province ?? "");
    setGender(user?.gender ?? "");
    setDateOfBirth(user?.dateOfBirth ?? "");
    setOccupation(user?.occupation ?? "");
  }, [user]);

  const complete = isCitizenProfileComplete({
    name,
    phone,
    address,
    cnic,
    city,
    district,
    province,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiFetch<AuthUser>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          cnic: cnic.trim(),
          city: city.trim(),
          district: district.trim(),
          province: province.trim(),
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          alternatePhone: alternatePhone.trim() || null,
          occupation: occupation.trim() || null,
        }),
      });
      await refreshMe();
      setMessage(
        isCitizenProfileComplete({
          name,
          phone,
          address,
          cnic,
          city,
          district,
          province,
        })
          ? "Profile completed. You can file complaints now."
          : "Profile saved. Fill all required fields to unlock complaints.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const initial = (user?.name?.trim()?.[0] ?? "U").toUpperCase();

  return (
    <div className="user-shell">
      <PageHeader
        title="My profile"
        description="Keep your details up to date so departments can reach you about complaints."
        actions={
          <Link className="btn btn-secondary" href="/user/complaints">
            Back to complaints
          </Link>
        }
      />

      {!complete ? (
        <div className="alert alert-error" style={{ marginBottom: "0.85rem" }}>
          Required: full name, phone, CNIC, address, city, district, and province.
          Complaints stay locked until these are saved.
        </div>
      ) : (
        <div className="alert alert-success" style={{ marginBottom: "0.85rem" }}>
          Profile complete — you can file complaints.
        </div>
      )}

      <div className="profile-stat-row">
        <div className="profile-info-card">
          <div className="profile-info-label">Role</div>
          <div className="profile-info-value">Citizen / User</div>
        </div>
        <div className="profile-info-card">
          <div className="profile-info-label">Home department</div>
          <div className="profile-info-value">
            {user?.homeDepartment?.name ?? "Not assigned yet"}
          </div>
        </div>
        <div className={`profile-info-card${complete ? " is-ok" : " is-warn"}`}>
          <div className="profile-info-label">Profile status</div>
          <div className="profile-info-value">
            {complete ? "Complete" : "Incomplete"}
          </div>
          <p className="profile-info-hint">
            {complete
              ? "You can file and track complaints."
              : "Fill required fields to unlock filing."}
          </p>
        </div>
        <div className="profile-info-card profile-info-note">
          <div className="profile-info-label">Note</div>
          <p className="profile-info-hint" style={{ marginTop: 0 }}>
            After approval, finish this form so departments can contact you.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="user-form-card profile-form-main">
          <div className="user-profile-head">
            <div className="user-avatar-lg">{initial}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {user?.name ?? "Citizen"}
              </div>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {user?.email}
              </div>
            </div>
          </div>

          <h3 className="profile-section-title">Account</h3>
          <div className="profile-fields">
            <div className="field">
              <label>Email</label>
              <input value={user?.email ?? ""} disabled />
            </div>
            <div className="field">
              <label htmlFor="name">Full name *</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <h3 className="profile-section-title">Identity & contact</h3>
          <div className="profile-fields">
            <div className="field">
              <label htmlFor="cnic">CNIC *</label>
              <input
                id="cnic"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="xxxxx-xxxxxxx-x"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile phone *</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92..."
                required
              />
            </div>
            <div className="field">
              <label htmlFor="altPhone">Alternate phone</label>
              <input
                id="altPhone"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="field">
              <label htmlFor="occupation">Occupation</label>
              <input
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Farmer, Trader"
              />
            </div>
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <h3 className="profile-section-title">Location</h3>
          <div className="profile-fields">
            <div className="field">
              <label htmlFor="province">Province *</label>
              <select
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
              >
                <option value="">Select province…</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="district">District *</label>
              <input
                id="district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="city">City / town *</label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="field profile-field-span">
              <label htmlFor="address">Full address *</label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, mohalla, landmark…"
                required
              />
            </div>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {message ? <div className="alert alert-success">{message}</div> : null}

          <div className="user-form-actions">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : complete ? "Update profile" : "Save & complete profile"}
            </button>
            {complete ? (
              <Link className="btn btn-secondary" href="/user/complaints/new">
                File a complaint
              </Link>
            ) : null}
          </div>
      </form>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <DashboardGate roles={["USER"]} title="My Profile">
      <ProfileForm />
    </DashboardGate>
  );
}
