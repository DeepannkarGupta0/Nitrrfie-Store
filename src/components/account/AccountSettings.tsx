
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useUser } from "@clerk/nextjs";

type Tab = "profile" | "security";
type SecurityOption = "menu" | "password" | "devices";

type DeviceSession = {
  id: string;
  isCurrent: boolean;
  browser: string;
  device: string;
  city: string;
  country: string;
  lastActiveAt: string | null;
  createdAt: string | null;
};

export default function AccountSettings() {
  const { user, isLoaded } = useUser();

  const [tab, setTab] = useState<Tab>("profile");
  const [securityOption, setSecurityOption] =
    useState<SecurityOption>("menu");

  // Profile fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Device fields
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(user.fullName || "");
    setUsername(user.username || "");

    const metadata = user.unsafeMetadata;

    setPhone(
      typeof metadata.contactPhone === "string"
        ? metadata.contactPhone
        : ""
    );

    setYear(
      typeof metadata.academicYear === "string"
        ? metadata.academicYear
        : ""
    );

    setBranch(
      typeof metadata.branch === "string"
        ? metadata.branch
        : ""
    );

    setRollNumber(
      typeof metadata.rollNumber === "string"
        ? metadata.rollNumber
        : ""
    );
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading account...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-600">
        Please sign in to view your account.
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  const label =
    "mb-2 block text-sm font-semibold text-slate-800";

  const button =
    "rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50";

  // Save profile
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const trimmedUsername = username.trim();

      if (trimmedUsername.length < 4) {
        throw new Error("Username must be at least 4 characters.");
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        throw new Error(
          "Username can contain letters, numbers, underscores and hyphens."
        );
      }

      const digits = phone.replace(/\D/g, "");

      if (phone.trim() && (digits.length < 10 || digits.length > 15)) {
        throw new Error("Enter a valid mobile number.");
      }

      const normalizedPhone = phone.trim()
        ? phone.trim().startsWith("+")
          ? `+${digits}`
          : digits.length === 10
            ? `+91${digits}`
            : `+${digits}`
        : "";

      const parts = name.trim().split(/\s+/).filter(Boolean);

      await user.update({
        username: trimmedUsername,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" "),
      });

      await user.updateMetadata({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          contactPhone: normalizedPhone,
          academicYear: year,
          branch: branch.trim(),
          rollNumber: rollNumber.trim(),
        },
      });

      setMessage("Your profile has been updated successfully.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to update your profile."
      );
    } finally {
      setBusy(false);
    }
  }

  // Change password
  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (newPassword.length < 8) {
        throw new Error("Password must contain at least 8 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await user.updatePassword({
        ...(user.passwordEnabled ? { currentPassword } : {}),
        newPassword,
        signOutOfOtherSessions: false,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Your password has been updated successfully.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to update password. Additional verification may be required."
      );
    } finally {
      setBusy(false);
    }
  }

  // Load active devices
  async function loadDevices() {
    setLoadingDevices(true);
    setDeviceError("");

    try {
      const response = await fetch("/api/account/sessions", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not load active devices."
        );
      }

      setDevices(result.sessions || []);
      setDeviceCount(
        result.totalCount ?? result.sessions?.length ?? 0
      );
    } catch (e) {
      setDeviceError(
        e instanceof Error
          ? e.message
          : "Could not load active devices."
      );
    } finally {
      setLoadingDevices(false);
    }
  }

  function openSecurity() {
    setTab("security");
    setSecurityOption("menu");
    setError("");
    setMessage("");
  }

  const initials = (
    user.firstName?.charAt(0) ||
    user.username?.charAt(0) ||
    "U"
  ).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-5">

      {/* Heading */}
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
          NIT Raipur Student Account
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Account Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your personal and academic information and account security.
        </p>
      </div>

      {/* Main account card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setTab("profile");
              setError("");
              setMessage("");
            }}
            className={`border-b-2 px-6 py-4 text-sm font-semibold transition ${
              tab === "profile"
                ? "border-orange-600 bg-white text-orange-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Profile
          </button>

          <button
            type="button"
            onClick={openSecurity}
            className={`border-b-2 px-6 py-4 text-sm font-semibold transition ${
              tab === "security"
                ? "border-orange-600 bg-white text-orange-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Security
          </button>
        </div>

       <div className="px-5 pt-8 pb-10 sm:px-10 sm:pt-9 sm:pb-10">

          {/* Messages */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* PROFILE */}
          {tab === "profile" && (
            <form
              onSubmit={saveProfile}
              className="mx-auto w-full max-w-[650px] space-y-5 pb-3"
            >

              {/* Profile header */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-2">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">
                    {user.fullName || user.username || "Customer"}
                  </h2>

                  <p className="break-all text-sm text-slate-500">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Personal information */}
              <section>
                <h2 className="mb-5 text-base font-bold text-slate-900">
                  Personal Information
                </h2>

                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">

                  <div className="sm:col-span-2">
                    <label htmlFor="full-name" className={label}>
                      Full name
                    </label>

                    <input
                      id="full-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className={field}
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className={label}>
                      Username
                    </label>

                    <input
                      id="username"
                      required
                      minLength={4}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className={field}
                    />
                  </div>

                  <div>
                    <label htmlFor="mobile" className={label}>
                      Mobile number
                    </label>

                    <input
                      id="mobile"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={field}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={label}>
                      Email address
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {user.primaryEmailAddress?.emailAddress || "Not available"}
                    </div>
                  </div>
                </div>
              </section>

              {/* Academic information */}
              <section className="rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                <div className="mb-5">
                  <h2 className="text-base font-bold text-slate-900">
                    Academic Information
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Optional details to personalise your campus-store experience.
                  </p>
                </div>

                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">

                  <div>
                    <label htmlFor="academic-year" className={label}>
                      Current year
                    </label>

                    <select
                      id="academic-year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={field}
                    >
                      <option value="">Select year (optional)</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Alumni">Alumni</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="branch" className={label}>
                      Branch / Department
                    </label>

                    <input
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Information Technology"
                      className={field}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="roll-number" className={label}>
                      Roll number
                    </label>

                    <input
                      id="roll-number"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="Enter your college roll number"
                      className={field}
                    />
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-orange-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <div className="w-full max-w-4xl space-y-5">

              {/* Security menu */}
              {securityOption === "menu" && (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      Security & Access
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Manage your password and see where your account is signed in.
                    </p>
                  </div>

                  {/* Security options */}
                  <div className="w-full space-y-3">

                    {/* Change Password */}
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityOption("password");
                        setError("");
                        setMessage("");
                      }}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900">
                          Change Password
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {user.passwordEnabled
                            ? "Update your existing account password."
                            : "Create a password for your Google account."}
                        </p>
                      </div>

                      <span className="ml-4 text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600">
                        ›
                      </span>
                    </button>

                    {/* Active Devices */}
                    <button
                      type="button"
                      onClick={() => {
                        setSecurityOption("devices");
                        loadDevices();
                      }}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900">
                          Active Devices
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Check devices where your account is currently signed in.
                        </p>
                      </div>

                      <span className="ml-4 text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600">
                        ›
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* CHANGE PASSWORD */}
              {securityOption === "password" && (
                <form
                  onSubmit={savePassword}
                  className="max-w-xl space-y-5"
                >
                  <button
                    type="button"
                    onClick={() => setSecurityOption("menu")}
                    className="text-sm font-semibold text-orange-700 hover:underline"
                  >
                    ← Back to Security
                  </button>

                  <div className="border-b border-slate-100 pb-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      Change Password
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Keep your account secure with a strong password.
                    </p>
                  </div>

                  {user.passwordEnabled && (
                    <div>
                      <label className={label}>
                        Current password
                      </label>

                      <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className={field}
                      />
                    </div>
                  )}

                  <div>
                    <label className={label}>
                      {user.passwordEnabled ? "New password" : "Create password"}
                    </label>

                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className={field}
                    />
                  </div>

                  <div>
                    <label className={label}>
                      Confirm password
                    </label>

                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter password again"
                      className={field}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className={button}
                  >
                    {busy
                      ? "Saving..."
                      : user.passwordEnabled
                        ? "Change password"
                        : "Set password"}
                  </button>

                  <p className="text-xs text-slate-500">
                    Minimum 8 characters. Your other login sessions will remain active.
                  </p>
                </form>
              )}

              {/* ACTIVE DEVICES */}
              {securityOption === "devices" && (
                <div className="space-y-5">

                  <button
                    type="button"
                    onClick={() => setSecurityOption("menu")}
                    className="text-sm font-semibold text-orange-700 hover:underline"
                  >
                    ← Back to Security
                  </button>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Active Devices
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Devices and browsers where your account currently has an active session.
                    </p>
                  </div>

                  {loadingDevices ? (
                    <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                      Loading your active devices...
                    </div>
                  ) : deviceError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {deviceError}

                      <button
                        type="button"
                        onClick={loadDevices}
                        className="ml-2 font-bold underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
                        <p className="text-sm font-medium text-slate-600">
                          Currently active sessions
                        </p>

                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-slate-900">
                            {deviceCount}
                          </span>

                          <span className="text-sm text-slate-500">
                            {deviceCount === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                      </div>

                      {devices.length === 0 ? (
                        <p className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                          No active sessions found.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {devices.map((device) => (
                            <div
                              key={device.id}
                              className="rounded-xl border border-slate-200 p-4 sm:p-5"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-slate-900">
                                    {device.browser} · {device.device}
                                  </h3>

                                  {device.isCurrent && (
                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                      This device
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                  {[device.city, device.country]
                                    .filter(Boolean)
                                    .join(", ") || "Location unavailable"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Last active:{" "}
                                  {device.lastActiveAt
                                    ? new Date(device.lastActiveAt).toLocaleString()
                                    : "Not available"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Signed in:{" "}
                                  {device.createdAt
                                    ? new Date(device.createdAt).toLocaleString()
                                    : "Not available"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={loadDevices}
                        disabled={loadingDevices}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Refresh devices
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
