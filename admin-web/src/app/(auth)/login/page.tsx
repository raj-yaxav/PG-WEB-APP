"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login, saveAuthData } from "@/services/authService";

type UserRole = "owner" | "manager" | "tenant";

interface AuthResponse {
  data: {
    data: {
      token: string;
      user: Record<string, unknown>;
    };
  };
}

export default function LoginPage() {
  const router = useRouter();
  const dragRef = useRef({ active: false, startX: 0, startY: 0, x: 0, y: 0 });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });

  const isOwner = role === "owner";
  const identifierLabel = isOwner ? "Owner email" : role === "manager" ? "Manager ID" : "Tenant ID";
  const identifierPlaceholder = isOwner ? "owner@example.com" : role === "manager" ? "MGR-1001" : "TEN-1001";

  const clearError = () => setError("");

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPointer({ x, y });
  };

  const handleLogoPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      x: logoOffset.x,
      y: logoOffset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLogoPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;
    const nextX = Math.max(-52, Math.min(52, dragRef.current.x + event.clientX - dragRef.current.startX));
    const nextY = Math.max(-38, Math.min(38, dragRef.current.y + event.clientY - dragRef.current.startY));
    setLogoOffset({ x: nextX, y: nextY });
  };

  const releaseLogo = () => {
    dragRef.current.active = false;
    setLogoOffset({ x: 0, y: 0 });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your login details");
      return;
    }

    setLoading(true);
    clearError();

    try {
      const response = (await login({
        role,
        identifier: identifier.trim(),
        password,
      })) as AuthResponse;

      const { token, user } = response.data.data;
      saveAuthData(token, user);

      if (!rememberMe) {
        sessionStorage.setItem("pg_session_only", "true");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      className="relative min-h-screen overflow-hidden bg-[#DDEEFF] px-4 py-8 text-slate-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.88),transparent_27%),radial-gradient(circle_at_78%_28%,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#EAF6FF_0%,#D9ECFF_48%,#BBD8FA_100%)]" />
      <div
        className="pointer-events-none absolute left-[8%] top-[12%] h-48 w-48 rounded-[34%] border border-white/80 bg-white/28 shadow-[18px_22px_55px_rgba(30,64,175,0.13)] backdrop-blur-sm transition-transform duration-300"
        style={{ transform: `translate3d(${pointer.x * 26}px, ${pointer.y * 18}px, 0) rotate(${pointer.x * 8}deg)` }}
      />
      <div
        className="pointer-events-none absolute bottom-[9%] right-[7%] h-64 w-64 rounded-[38%] border border-white/70 bg-blue-300/18 shadow-[18px_22px_65px_rgba(30,64,175,0.16)] backdrop-blur-sm transition-transform duration-300"
        style={{ transform: `translate3d(${pointer.x * -34}px, ${pointer.y * -24}px, 0) rotate(${pointer.y * -9}deg)` }}
      />
      <div className="pointer-events-none absolute left-1/2 top-8 h-28 w-[44rem] -translate-x-1/2 rounded-full bg-white/30 blur-3xl" />

      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div
          className="hidden lg:block transition-transform duration-300"
          style={{ transform: `translate3d(${pointer.x * 18}px, ${pointer.y * 12}px, 0)` }}
        >
          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/55 px-4 py-2 shadow-[8px_10px_24px_rgba(30,64,175,0.10)] backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shadow-[0_0_0_6px_rgba(37,99,235,0.12)]" />
              <span className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">Roomzy workspace</span>
            </div>
            <h1 className="text-6xl font-black leading-[0.96] tracking-tight text-slate-950">
              Control your PG from one calm dashboard.
            </h1>
            <p className="mt-6 max-w-lg text-base font-semibold leading-8 text-slate-600">
              Owners review reports, managers update rooms and queries, tenants track their stay. Same system, role-specific access.
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              <MiniMetric label="Roles" value="3" />
              <MiniMetric label="Live API" value="On" />
              <MiniMetric label="Access" value="Secure" />
            </div>
          </div>
        </div>

        <div
          className="w-full rounded-[2rem] border border-white/90 bg-white/78 p-5 shadow-[18px_24px_70px_rgba(30,64,175,0.18),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition-transform duration-300 sm:p-7"
          style={{ transform: `perspective(1200px) rotateY(${pointer.x * -5}deg) rotateX(${pointer.y * 4}deg)` }}
        >
          <div className="relative mb-8 pt-10 text-center">
            <button
              type="button"
              onPointerDown={handleLogoPointerDown}
              onPointerMove={handleLogoPointerMove}
              onPointerUp={releaseLogo}
              onPointerCancel={releaseLogo}
              className="absolute left-1/2 top-0 flex h-24 w-24 -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-[2rem] bg-blue-600 text-white shadow-[0_18px_38px_rgba(37,99,235,0.32),inset_0_1px_0_rgba(255,255,255,0.35)] transition-[box-shadow,filter,transform] duration-300 active:cursor-grabbing active:shadow-[0_12px_28px_rgba(37,99,235,0.26)]"
              style={{ transform: `translate(calc(-50% + ${logoOffset.x}px), ${logoOffset.y}px)` }}
              aria-label="Drag Roomzy logo"
            >
              <span className="absolute inset-[-8px] rounded-[2.25rem] border border-blue-200/80" />
              <svg width="42" height="46" viewBox="0 0 40 48" fill="none" aria-hidden="true">
                <path d="M20 0L40 10V22C40 35.5 28 44 20 48C12 44 0 35.5 0 22V10L20 0Z" fill="white" />
                <path d="M12 24L18 30L28 18" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="pt-16">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Roomzy</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Welcome Back</h2>
              <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">
                Sign in with your role to open the right workspace.
              </p>
            </div>
          </div>

          <RoleSelector
            value={role}
            onChange={(nextRole) => {
              setRole(nextRole);
              setIdentifier("");
              clearError();
            }}
          />

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">{identifierLabel}</span>
              <input
                type={isOwner ? "email" : "text"}
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  clearError();
                }}
                placeholder={identifierPlaceholder}
                autoCapitalize="none"
                autoComplete={isOwner ? "email" : "username"}
                className="h-12 w-full rounded-2xl border border-blue-100 bg-[#F4FAFF] px-4 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Password</span>
              <div className="flex h-12 overflow-hidden rounded-2xl border border-blue-100 bg-[#F4FAFF] transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearError();
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="flex w-12 items-center justify-center text-slate-500 transition hover:text-blue-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer select-none items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-500">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setError("Contact your PG owner/admin to reset password.")}
                className="text-sm font-bold text-blue-600 transition hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_34px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex animate-[fadeScale_0.2s_ease-out] items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <a
            href="/downloads/roomzy.apk"
            download
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white/78 text-sm font-black text-blue-700 shadow-[8px_10px_24px_rgba(30,64,175,0.10),inset_0_1px_0_rgba(255,255,255,0.92)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:text-blue-800"
          >
            <DownloadIcon />
            Download Android APK
          </a>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-[#E7F3FF] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <p className="text-sm font-black text-blue-950">Account access rule</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">
              Owner creates manager IDs. Manager allots rooms and shares tenant IDs after booking.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-[8px_10px_24px_rgba(30,64,175,0.10)] backdrop-blur">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-700">{label}</p>
    </div>
  );
}

function RoleSelector({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (value: UserRole) => void;
}) {
  const roles: Array<{ value: UserRole; label: string }> = [
    { value: "owner", label: "Owner" },
    { value: "manager", label: "Manager" },
    { value: "tenant", label: "Tenant" },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl border border-blue-100 bg-[#E7F3FF] p-1 shadow-[inset_6px_6px_14px_rgba(30,64,175,0.08),inset_-6px_-6px_14px_rgba(255,255,255,0.85)]">
      {roles.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange(role.value)}
          className={`h-11 rounded-xl text-sm font-bold transition ${
            value === role.value
              ? "bg-white text-blue-700 shadow-[5px_7px_14px_rgba(30,64,175,0.12)]"
              : "text-slate-500 hover:bg-white/45 hover:text-slate-800"
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="animate-[shake_0.32s_ease-in-out] rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.25A3.25 3.25 0 1012 8.75a3.25 3.25 0 000 6.5z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 5.62A9.77 9.77 0 0112 5.25c6 0 9.75 6.75 9.75 6.75a18.9 18.9 0 01-2.48 3.27M6.53 6.53C3.82 8.35 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.47 0 2.8-.4 3.98-1.02" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v11m0 0l-4-4m4 4l4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 17.5v1.25A2.25 2.25 0 007.25 21h9.5A2.25 2.25 0 0019 18.75V17.5" />
    </svg>
  );
}

function getErrorMessage(err: unknown) {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return "Login failed. Please check your details.";
}
