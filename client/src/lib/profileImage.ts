import api from "@/lib/api";

export const getProfileImageUrl = (
  imagePath?: string | null,
): string | undefined => {
  if (!imagePath) {
    return undefined;
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  const baseURL = api.defaults.baseURL;

  if (!baseURL) {
    return imagePath;
  }

  try {
    const absoluteBaseURL =
      baseURL.startsWith("http://") ||
      baseURL.startsWith("https://")
        ? baseURL
        : new URL(baseURL, window.location.origin).toString();

    return new URL(imagePath, absoluteBaseURL).toString();
  } catch {
    return imagePath;
  }
};
