"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { changePassword, getMe, saveAuthData, updateMe, uploadProfileImage } from "@/services/authService";

interface ProfileUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  loginId?: string;
  role: "owner" | "manager" | "tenant";
  status: "active" | "inactive";
  profilePhotoUrl?: string;
  createdAt?: string;
}

const emptyPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function SettingsPage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMe();
      const profile = response.data.data;
      setUser(profile);
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        email: profile.email || "",
      });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      const response = await updateMe({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setUser(response.data.data);
      syncStoredUser(response.data.data);
      toast.success("Profile updated");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadResponse = await uploadProfileImage(file);
      const imageUrl = uploadResponse.data.data.url;
      const profileResponse = await updateMe({ profilePhotoUrl: imageUrl });
      setUser(profileResponse.data.data);
      syncStoredUser(profileResponse.data.data);
      toast.success("Profile image updated");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Image upload failed. Check Cloudinary env values."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemovePhoto() {
    if (!user?.profilePhotoUrl || uploading) return;
    if (!window.confirm("Remove your current profile photo?")) return;

    try {
      setUploading(true);
      const response = await updateMe({ profilePhotoUrl: "" });
      setUser(response.data.data);
      syncStoredUser(response.data.data);
      toast.success("Profile image removed");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to remove profile image"));
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      toast.success("Password changed successfully");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to change password"));
    } finally {
      setChangingPassword(false);
    }
  }

  const avatarInitial = user?.name?.trim().charAt(0).toUpperCase() || "U";

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading profile...</div>;
  }

  if (!user) {
    return <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">Profile could not be loaded.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-blue-100 bg-[#B9D9FA] p-6 shadow-[8px_10px_28px_rgba(30,64,175,0.16)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Account</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Profile</h1>
        <p className="mt-1 text-sm font-semibold text-slate-700">Update your details, profile image, and password.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-blue-100 ring-4 ring-[#E2F0FF]">
              {user.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-600">{avatarInitial}</div>
              )}
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700">
                {uploading ? "Wait..." : "Upload"}
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleImageChange} disabled={uploading} />
              </label>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={!user.profilePhotoUrl || uploading}
                className="min-h-11 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email || user.loginId || "No login contact"}</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">{user.role}</span>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase text-cyan-700">{user.status}</span>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
            <h2 className="text-lg font-black text-slate-900">Personal Details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} />
              <Field label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
              <Field label="Email" value={form.email} type="email" onChange={(email) => setForm((current) => ({ ...current, email }))} />
              <ReadOnlyField label="Assigned ID" value={user.loginId || "Owner email login"} />
            </div>
            <div className="mt-6 flex justify-end">
              <button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
            <h2 className="text-lg font-black text-slate-900">Change Password</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field label="Old Password" type="password" value={passwordForm.oldPassword} onChange={(oldPassword) => setPasswordForm((current) => ({ ...current, oldPassword }))} />
              <Field label="New Password" type="password" value={passwordForm.newPassword} onChange={(newPassword) => setPasswordForm((current) => ({ ...current, newPassword }))} />
              <Field label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(confirmPassword) => setPasswordForm((current) => ({ ...current, confirmPassword }))} />
            </div>
            <div className="mt-6 flex justify-end">
              <button disabled={changingPassword} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
                {changingPassword ? "Changing..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50/40 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input value={value} readOnly className="h-11 w-full rounded-xl border border-blue-100 bg-slate-100 px-3 text-sm text-slate-500 outline-none" />
    </label>
  );
}

function syncStoredUser(user: ProfileUser) {
  const token = localStorage.getItem("pg_token");
  if (token) saveAuthData(token, user);
  window.dispatchEvent(new Event("pg_user_updated"));
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}
