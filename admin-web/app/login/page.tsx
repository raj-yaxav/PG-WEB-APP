"use client";

import { useState } from "react";
import { login, register, saveAuthData } from "@/services/authService";

type AuthMode = "login" | "signup";
type UserRole = "owner" | "manager" | "tenant";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
    role: "owner" as UserRole,
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const clearError = () => setError("");

  const finishAuth = (response: any) => {
    const { token, user } = response.data.data;
    saveAuthData(token, user);
    window.location.href = "/dashboard";
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    clearError();

    try {
      const response = await login({
        role: loginForm.role,
        identifier: loginForm.identifier.trim(),
        password: loginForm.password,
      });
      finishAuth(response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    clearError();

    try {
      const response = await register({
        ...signupForm,
        name: signupForm.name.trim(),
        email: signupForm.email.trim(),
      });
      finishAuth(response);
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen overflow-hidden bg-gray-100 px-4 py-8 text-gray-900">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        {/* Background blur effects */}
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-12 top-16 h-36 w-36 rounded-full bg-indigo-100/50 blur-2xl" />

        <section className="relative grid w-full overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-gray-200/70 md:min-h-[700px] md:grid-cols-2">
          {/* Sliding panel covers the inactive side on desktop. */}
          <div
            className={`absolute inset-y-0 z-20 hidden w-1/2 bg-indigo-500 transition-transform duration-700 ease-in-out md:block ${
              isSignup ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col justify-between p-10 text-white">
              <div>
                {/* Shield Logo */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <svg width="28" height="32" viewBox="0 0 40 48" fill="none">
                    <path
                      d="M20 0L40 10V22C40 35.5 28 44 20 48C12 44 0 35.5 0 22V10L20 0Z"
                      fill="white"
                    />
                    <path
                      d="M12 24L18 30L28 18"
                      stroke="#6366F1"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-indigo-100">
                  PG Admin
                </p>
                <h2 className="mt-4 text-4xl font-black leading-tight">
                  {isSignup ? "Start managing smarter." : "Welcome back, admin."}
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-6 text-indigo-100">
                  {isSignup
                    ? "Create the owner account first. Managers and tenants will receive their login IDs from inside the system."
                    : "Owners use email. Managers and tenants use the assigned ID created for them."}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm text-indigo-50">
                Fast setup today. Full operating dashboard tomorrow.
              </div>
            </div>
          </div>

          {/* Login Form Side */}
          <div className="relative z-10 flex min-h-[700px] items-center justify-center p-6 sm:p-10">
            <AuthCard
              title="Welcome Back"
              subtitle="Log in to your account to continue."
              active={!isSignup}
              footerText="Don't have an account?"
              footerAction="Sign Up"
              onSwitch={() => {
                setMode("signup");
                clearError();
              }}
            >
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Phone Input */}
                <LoginIdentifierInput
                  role={loginForm.role}
                  value={loginForm.identifier}
                  onChange={(identifier) => {
                    setLoginForm((prev) => ({ ...prev, identifier }));
                    clearError();
                  }}
                />

                {/* Password Input */}
                <PasswordInput
                  value={loginForm.password}
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  onChange={(password) => {
                    setLoginForm((prev) => ({ ...prev, password }));
                    clearError();
                  }}
                />

                <RoleSelector
                  value={loginForm.role}
                  onChange={(role) => {
                    setLoginForm((prev) => ({ ...prev, role }));
                    clearError();
                  }}
                />

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-500 font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {!isSignup && error && <ErrorBanner message={error} />}

                <SubmitButton
                  loading={loading && !isSignup}
                  label="Sign In"
                  loadingLabel="Signing in..."
                />

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400 font-medium">Or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Social Login Icons */}
                <div className="flex justify-center gap-3">
                  <SocialIconButton provider="google" onClick={() => console.log("Google login")} />
                  <SocialIconButton provider="apple" onClick={() => console.log("Apple login")} />
                  <SocialIconButton provider="facebook" onClick={() => console.log("Facebook login")} />
                </div>
              </form>
            </AuthCard>
          </div>

          {/* Signup Form Side */}
          <div className="relative z-10 flex min-h-[700px] items-center justify-center p-6 sm:p-10">
            <AuthCard
              title="Create Account"
              subtitle="Create the owner account. Managers and tenants are added later."
              active={isSignup}
              footerText="Already have an account?"
              footerAction="Sign In"
              onSwitch={() => {
                setMode("login");
                clearError();
              }}
            >
              <form onSubmit={handleSignup} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-2">
                  <button
                    type="button"
                    onClick={() => console.log("Upload avatar")}
                    className="relative w-20 h-20 rounded-full bg-indigo-50 border-2 border-gray-200 flex items-center justify-center hover:border-indigo-300 transition-all"
                  >
                    <svg className="w-10 h-10 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Full Name */}
                <LabeledInput
                  label="Full Name"
                  value={signupForm.name}
                  placeholder="Enter your name"
                  onChange={(name) => {
                    setSignupForm((prev) => ({ ...prev, name }));
                    clearError();
                  }}
                />

                {/* Email */}
                <LabeledInput
                  label="Owner Email"
                  value={signupForm.email}
                  type="email"
                  placeholder="Enter your email"
                  onChange={(email) => {
                    setSignupForm((prev) => ({ ...prev, email }));
                    clearError();
                  }}
                />

                {/* Password */}
                <PasswordInput
                  value={signupForm.password}
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  onChange={(password) => {
                    setSignupForm((prev) => ({ ...prev, password }));
                    clearError();
                  }}
                />

                {isSignup && error && <ErrorBanner message={error} />}

                <SubmitButton
                  loading={loading && isSignup}
                  label="Create Account"
                  loadingLabel="Creating account..."
                />

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400 font-medium">Or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Social Login Icons */}
                <div className="flex justify-center gap-3">
                  <SocialIconButton provider="google" onClick={() => console.log("Google signup")} />
                  <SocialIconButton provider="apple" onClick={() => console.log("Apple signup")} />
                  <SocialIconButton provider="facebook" onClick={() => console.log("Facebook signup")} />
                </div>
              </form>
            </AuthCard>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ───────────────────────────────────────────────
   Sub-Components (unchanged structure, styled to match design)
   ─────────────────────────────────────────────── */

function AuthCard({
  title,
  subtitle,
  active,
  children,
  footerText,
  footerAction,
  onSwitch,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  children: React.ReactNode;
  footerText: string;
  footerAction: string;
  onSwitch: () => void;
}) {
  return (
    <div
      className={`w-full max-w-[420px] transition-all duration-500 ${
        active ? "block scale-100 opacity-100" : "hidden pointer-events-none scale-95 opacity-0 md:block"
      }`}
    >
      <div className="mb-8 text-center">
        {/* Shield Logo for mobile / when panel is hidden */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-200 md:hidden">
          <svg width="24" height="28" viewBox="0 0 40 48" fill="none">
            <path d="M20 0L40 10V22C40 35.5 28 44 20 48C12 44 0 35.5 0 22V10L20 0Z" fill="white" />
            <path d="M12 24L18 30L28 18" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
      <p className="mt-7 text-center text-sm text-gray-500">
        {footerText}{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {footerAction}
        </button>
      </p>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}

function LoginIdentifierInput({
  role,
  value,
  onChange,
}: {
  role: UserRole;
  value: string;
  onChange: (value: string) => void;
}) {
  const isOwner = role === "owner";
  const label = isOwner ? "Owner email" : role === "manager" ? "Manager ID" : "Tenant ID";
  const placeholder = isOwner ? "owner@example.com" : role === "manager" ? "MGR-1001" : "TEN-1001";

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <div className="flex h-12 overflow-hidden rounded-lg border border-gray-300 bg-white transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
        <input
          type={isOwner ? "email" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">Password</span>
      <div className="flex h-12 overflow-hidden rounded-lg border border-gray-300 bg-white transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your password"
          required
          className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="w-14 text-sm font-semibold text-gray-500 transition hover:text-indigo-500"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </label>
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
    <div>
      <span className="mb-2 block text-sm font-semibold text-gray-700">Account type</span>
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              value === role.value
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="animate-[shake_0.32s_ease-in-out] rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {loading ? (
        <span className="flex animate-[fadeScale_0.2s_ease-out] items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

/* ───────────────────────────────────────────────
   New Component: Social Icon Button
   ─────────────────────────────────────────────── */

function SocialIconButton({
  provider,
  onClick,
}: {
  provider: "google" | "apple" | "facebook";
  onClick: () => void;
}) {
  const icons = {
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    apple: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-95"
    >
      {icons[provider]}
    </button>
  );
}
