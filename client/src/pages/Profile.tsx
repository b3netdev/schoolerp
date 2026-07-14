import { useState, type ChangeEvent, type FormEvent } from "react";
import { Mail, Shield, Save, KeyRound } from "lucide-react";

import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { useAppSelector } from "../../redux/hooks";
import useAuth from "@/hooks/useAuth";

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { updateProfile, changePassword, loading } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMessage({ type: "error", text: "Name and email are required." });
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error: any) {
      setProfileMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMessage({ type: "error", text: "All password fields are required." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage({ type: "success", text: "Password changed successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Profile" }]} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your personal account details.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-5 h-fit">
          <ProfileInfoCard
            name={user?.name || "Admin"}
            role={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Admin"}
            email={user?.email}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {profileMessage && (
                <p
                  className={`text-sm ${profileMessage.type === "success" ? "text-emerald-600" : "text-red-600"
                    }`}
                >
                  {profileMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={profileSaving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {passwordMessage && (
                <p
                  className={`text-sm ${passwordMessage.type === "success" ? "text-emerald-600" : "text-red-600"
                    }`}
                >
                  {passwordMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={passwordSaving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
