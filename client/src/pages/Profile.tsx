import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Mail,
  Shield,
  Save,
  KeyRound,
  Camera,
  Trash2,
  Loader2,
} from "lucide-react";

import { Breadcrumb } from "@/components/common/Breadcrumb";
import { useAppSelector } from "../../redux/hooks";
import useAuth from "@/hooks/useAuth";
import api from "@/lib/api";

const MAX_PROFILE_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ProfileData = {
  id: number;
  name: string;
  email: string;
  role?: string;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;


const getProfileImageUrl = (
  imagePath?: string | null,
): string | null => {
  if (!imagePath) {
    return null;
  }


  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const baseURL =
    api.defaults.baseURL;

  if (!baseURL) {
    return imagePath;
  }

  try {
    
    const absoluteBaseURL =
      baseURL.startsWith("http://") ||
        baseURL.startsWith("https://")
        ? baseURL
        : new URL(
          baseURL,
          window.location.origin,
        ).toString();

    
    return new URL(
      imagePath,
      absoluteBaseURL,
    ).toString();
  } catch {
    return imagePath;
  }
};

const getInitials = (
  name?: string,
): string => {
  if (!name?.trim()) {
    return "AD";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
};

const Profile = () => {
  const { user } = useAppSelector(
    (state) => state.auth,
  );

 
  const {
    changePassword,
    loading,
  } = useAuth();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  
  const [
    profile,
    setProfile,
  ] = useState<ProfileData | null>(
    null,
  );

  
  const [
    profileImagePreview,
    setProfileImagePreview,
  ] = useState<string | null>(
    null,
  );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    imageUploading,
    setImageUploading,
  ] = useState(false);

  const [
    imageRemoving,
    setImageRemoving,
  ] = useState(false);

  const [
    imageMessage,
    setImageMessage,
  ] = useState<MessageState>(
    null,
  );


  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [
    profileMessage,
    setProfileMessage,
  ] = useState<MessageState>(
    null,
  );

  const [
    profileSaving,
    setProfileSaving,
  ] = useState(false);

  /**
   * Password form
   */
  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState<MessageState>(
    null,
  );

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const loadProfile =
    useCallback(async () => {
      try {
        setProfileLoading(true);

        const response =
          await api.get(
            "/profile",
          );

        const profileData =
          response.data
            ?.data as ProfileData;

        if (profileData) {
          setProfile(
            profileData,
          );

          setProfileForm({
            name:
              profileData.name ??
              "",
            email:
              profileData.email ??
              "",
          });
        }
      } catch (error: any) {
        console.error(
          "Failed to load profile:",
          error,
        );

        setProfileMessage({
          type: "error",
          text:
            error?.response?.data
              ?.message ||
            "Failed to load profile.",
        });
      } finally {
        setProfileLoading(
          false,
        );
      }
    }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);


  useEffect(() => {
    if (!profile) {
      setProfileForm({
        name:
          user?.name || "",
        email:
          user?.email || "",
      });
    }
  }, [
    user?.name,
    user?.email,
    profile,
  ]);

  /**
   * Cleanup local preview URL.
   */
  useEffect(() => {
    return () => {
      if (
        profileImagePreview
      ) {
        URL.revokeObjectURL(
          profileImagePreview,
        );
      }
    };
  }, [
    profileImagePreview,
  ]);

  /**
   * Backend image URL
   */
  const existingProfileImage =
    getProfileImageUrl(
      profile?.profile_image ??
      (
        user as
        | {
          profile_image?:
          | string
          | null;
        }
        | null
        | undefined
      )?.profile_image ??
      null,
    );

  /**
   * Preview gets priority while
   * new image is uploading.
   */
  const profileImageSrc =
    profileImagePreview ||
    existingProfileImage;

  const displayName =
    profile?.name ||
    user?.name ||
    profileForm.name ||
    "Admin";

  const displayEmail =
    profile?.email ||
    user?.email ||
    "";

  const displayRole =
    profile?.role ||
    user?.role ||
    "admin";

  
  const handleProfileImageChange =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      setImageMessage(null);

      if (!file) {
        return;
      }

      
      if (
        !ALLOWED_PROFILE_IMAGE_TYPES.includes(
          file.type,
        )
      ) {
        setImageMessage({
          type: "error",
          text: "Only JPG, PNG and WEBP images are allowed.",
        });

        event.target.value =
          "";

        return;
      }

     
      if (
        file.size >
        MAX_PROFILE_IMAGE_SIZE
      ) {
        setImageMessage({
          type: "error",
          text: "Profile picture must be smaller than 5 MB.",
        });

        event.target.value =
          "";

        return;
      }
      if (
        profileImagePreview
      ) {
        URL.revokeObjectURL(
          profileImagePreview,
        );
      }

      const previewURL =
        URL.createObjectURL(
          file,
        );

      setProfileImagePreview(
        previewURL,
      );

      setImageUploading(true);

      try {
        const formData =
          new FormData();

        formData.append(
          "profile_image",
          file,
        );

        
        const response =
          await api.post(
            "/profile/image",
            formData,
          );

        const updatedProfile =
          response.data
            ?.data as ProfileData;

        if (
          updatedProfile
        ) {
          setProfile(
            updatedProfile,
          );
        }

        setImageMessage({
          type: "success",
          text:
            response.data
              ?.message ||
            "Profile picture updated successfully.",
        });

      
        URL.revokeObjectURL(
          previewURL,
        );

        setProfileImagePreview(
          null,
        );
      } catch (error: any) {
        URL.revokeObjectURL(
          previewURL,
        );

        setProfileImagePreview(
          null,
        );

        setImageMessage({
          type: "error",
          text:
            error?.response?.data
              ?.message ||
            "Failed to upload profile picture.",
        });
      } finally {
        setImageUploading(
          false,
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }
      }
    };


  const handleRemoveProfileImage =
    async () => {
      if (
        imageRemoving ||
        imageUploading
      ) {
        return;
      }

      setImageMessage(null);
      setImageRemoving(true);

      try {
        const response =
          await api.delete(
            "/profile/image",
          );

        const updatedProfile =
          response.data
            ?.data as ProfileData;

        if (
          updatedProfile
        ) {
          setProfile(
            updatedProfile,
          );
        } else {
          setProfile(
            (current) =>
              current
                ? {
                  ...current,
                  profile_image:
                    null,
                }
                : current,
          );
        }

        setProfileImagePreview(
          null,
        );

        setImageMessage({
          type: "success",
          text:
            response.data
              ?.message ||
            "Profile picture removed successfully.",
        });
      } catch (error: any) {
        setImageMessage({
          type: "error",
          text:
            error?.response?.data
              ?.message ||
            "Failed to remove profile picture.",
        });
      } finally {
        setImageRemoving(
          false,
        );
      }
    };

  /**
   * ====================================
   * PROFILE INPUT CHANGE
   * ====================================
   */
  const handleProfileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProfileForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  /**
   * ====================================
   * UPDATE PROFILE
   * ====================================
   */
  const handleProfileSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setProfileMessage(null);

      const name =
        profileForm.name.trim();

      const email =
        profileForm.email
          .trim()
          .toLowerCase();

      if (
        !name ||
        !email
      ) {
        setProfileMessage({
          type: "error",
          text: "Name and email are required.",
        });

        return;
      }

      setProfileSaving(true);

      try {
        const response =
          await api.post(
            "/profile/update",
            {
              name,
              email,
            },
          );

        const updatedProfile =
          response.data
            ?.data as ProfileData;

        if (
          updatedProfile
        ) {
          setProfile(
            updatedProfile,
          );

          setProfileForm({
            name:
              updatedProfile.name,
            email:
              updatedProfile.email,
          });
        }

        setProfileMessage({
          type: "success",
          text:
            response.data
              ?.message ||
            "Profile updated successfully.",
        });
      } catch (error: any) {
        setProfileMessage({
          type: "error",
          text:
            error?.response?.data
              ?.message ||
            "Failed to update profile.",
        });
      } finally {
        setProfileSaving(
          false,
        );
      }
    };

  /**
   * ====================================
   * PASSWORD INPUT CHANGE
   * ====================================
   */
  const handlePasswordChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setPasswordForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  /**
   * ====================================
   * CHANGE PASSWORD
   * ====================================
   */
  const handlePasswordSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setPasswordMessage(
        null,
      );

      if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
      ) {
        setPasswordMessage({
          type: "error",
          text: "All password fields are required.",
        });

        return;
      }

      if (
        passwordForm
          .newPassword.length <
        6
      ) {
        setPasswordMessage({
          type: "error",
          text: "New password must be at least 6 characters.",
        });

        return;
      }

      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {
        setPasswordMessage({
          type: "error",
          text: "New password and confirmation do not match.",
        });

        return;
      }

      setPasswordSaving(true);

      try {
        await changePassword({
          currentPassword:
            passwordForm.currentPassword,

          newPassword:
            passwordForm.newPassword,
        });

        setPasswordMessage({
          type: "success",
          text: "Password changed successfully.",
        });

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error: any) {
        setPasswordMessage({
          type: "error",
          text:
            error?.response?.data
              ?.message ||
            "Failed to change password.",
        });
      } finally {
        setPasswordSaving(
          false,
        );
      }
    };

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Profile",
          },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your
          personal account details.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ======================
            PROFILE CARD
        ====================== */}

        <div className="h-fit rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}

            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary/10 shadow-sm ring-1 ring-border">
                {profileLoading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                ) : profileImageSrc ? (
                  <img
                    src={
                      profileImageSrc
                    }
                    alt={
                      displayName
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="select-none text-3xl font-semibold text-primary">
                    {getInitials(
                      profileForm.name ||
                      displayName,
                    )}
                  </span>
                )}
              </div>

              {/* Camera */}

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  imageUploading ||
                  profileLoading
                }
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                {imageUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleProfileImageChange
                }
                disabled={
                  imageUploading
                }
                className="hidden"
              />
            </div>

            {/* Name */}

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              {displayName}
            </h2>

            {/* Role */}

            <p className="mt-1 text-sm font-medium capitalize text-primary">
              {displayRole}
            </p>

            {/* Email */}

            {displayEmail && (
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {displayEmail}
              </p>
            )}

            {/* Image Actions */}

            <div className="mt-5 w-full border-t border-border pt-4">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  imageUploading ||
                  profileLoading
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {imageUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}

                {imageUploading
                  ? "Uploading..."
                  : profileImageSrc
                    ? "Change Profile Picture"
                    : "Upload Profile Picture"}
              </button>

              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or WEBP.
                Maximum 5 MB.
              </p>

              {/* Remove backend image */}

              {existingProfileImage &&
                !profileImagePreview && (
                  <button
                    type="button"
                    onClick={
                      handleRemoveProfileImage
                    }
                    disabled={
                      imageRemoving ||
                      imageUploading
                    }
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {imageRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}

                    {imageRemoving
                      ? "Removing..."
                      : "Remove Profile Picture"}
                  </button>
                )}

              {imageMessage && (
                <p
                  className={`mt-3 text-xs ${imageMessage.type ===
                    "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                    }`}
                >
                  {imageMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================
            RIGHT CONTENT
        ====================== */}

        <div className="space-y-6">
          {/* PERSONAL INFORMATION */}

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />

              <h2 className="text-lg font-semibold text-foreground">
                Personal Information
              </h2>
            </div>

            <form
              onSubmit={
                handleProfileSubmit
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      profileForm.name
                    }
                    onChange={
                      handleProfileChange
                    }
                    disabled={
                      profileLoading
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      profileForm.email
                    }
                    onChange={
                      handleProfileChange
                    }
                    disabled={
                      profileLoading
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {profileMessage && (
                <p
                  className={`text-sm ${profileMessage.type ===
                    "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                    }`}
                >
                  {
                    profileMessage.text
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  profileSaving ||
                  profileLoading
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {profileSaving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </div>

          {/* PASSWORD */}

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />

              <h2 className="text-lg font-semibold text-foreground">
                Change Password
              </h2>
            </div>

            <form
              onSubmit={
                handlePasswordSubmit
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Current Password
                  </label>

                  <input
                    type="password"
                    name="currentPassword"
                    value={
                      passwordForm.currentPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
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
                    value={
                      passwordForm.newPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
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
                    value={
                      passwordForm.confirmPassword
                    }
                    onChange={
                      handlePasswordChange
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {passwordMessage && (
                <p
                  className={`text-sm ${passwordMessage.type ===
                    "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                    }`}
                >
                  {
                    passwordMessage.text
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  passwordSaving ||
                  loading
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}

                {passwordSaving
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;