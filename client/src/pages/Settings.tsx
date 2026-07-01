import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Save,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useSettings from "@/hooks/useSettngs";

type SettingGroup = "general" | "users" | "security" | "notifications";

type SettingFieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "timezone";

interface SelectOption {
  label: string;
  value: string;
}

interface SettingField {
  name: string;
  field_key: string;
  setting_group: SettingGroup;
  type: SettingFieldType;
  value?: string;
  options?: SelectOption[];
}

interface TabItem {
  id: SettingGroup;
  label: string;
  icon: ReactNode;
}

interface TimeZoneOption {
  key: string;
  value: string;
  label: string;
}

interface SettingResponse {
  id?: number;
  name: string;
  setting_group: string;
  key?: string;
  type: string;
  value?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface SettingsPayload {
  name: string;
  setting_group: string;
  key: string;
  type: string;
  value: string;
}

type FormDataState = Record<string, string>;
type DbKeyState = Record<string, string>;

const fallbackTimeZones: string[] = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

const getTimeZoneOffset = (timeZone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(new Date());
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset?.replace("GMT", "UTC") || "UTC";
  } catch {
    return "UTC";
  }
};

const getSupportedTimeZones = (): string[] => {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };

  if (typeof intlWithSupportedValues.supportedValuesOf === "function") {
    return intlWithSupportedValues.supportedValuesOf("timeZone");
  }

  return fallbackTimeZones;
};

const timeZoneOptions: TimeZoneOption[] = getSupportedTimeZones().map(
  (zone) => ({
    key: zone,
    value: zone,
    label: `${getTimeZoneOffset(zone)} - ${zone.replace(/_/g, " ")}`,
  })
);

const tabs: TabItem[] = [
  {
    id: "general",
    label: "General",
    icon: <SettingsIcon className="h-4 w-4" />,
  },
  {
    id: "users",
    label: "Users",
    icon: <User className="h-4 w-4" />,
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
  },
];

const settingsFields: SettingField[] = [
  // General
  {
    name: "School Name",
    field_key: "school_name",
    setting_group: "general",
    type: "text",
  },
  {
    name: "School Phone",
    field_key: "school_phone",
    setting_group: "general",
    type: "text",
  },
  {
    name: "School Email",
    field_key: "school_email",
    setting_group: "general",
    type: "email",
  },
  {
    name: "Time Zone",
    field_key: "timezone",
    setting_group: "general",
    type: "timezone",
  },
  {
    name: "Address",
    field_key: "school_address",
    setting_group: "general",
    type: "textarea",
  },

  // Users
  {
    name: "Default User Role",
    field_key: "default_user_role",
    setting_group: "users",
    type: "select",
    options: [
      { label: "Admin", value: "admin" },
      { label: "Teacher", value: "teacher" },
      { label: "Student", value: "student" },
    ],
  },
  {
    name: "Allow User Registration",
    field_key: "allow_user_registration",
    setting_group: "users",
    type: "select",
    options: [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" },
    ],
  },

  // Security
  {
    name: "Two Factor Authentication",
    field_key: "two_factor_authentication",
    setting_group: "security",
    type: "select",
    options: [
      { label: "Enabled", value: "true" },
      { label: "Disabled", value: "false" },
    ],
  },
  {
    name: "Password Minimum Length",
    field_key: "password_minimum_length",
    setting_group: "security",
    type: "number",
  },

  // Notifications
  {
    name: "Email Notification",
    field_key: "email_notification",
    setting_group: "notifications",
    type: "select",
    options: [
      { label: "Enabled", value: "true" },
      { label: "Disabled", value: "false" },
    ],
  },
  {
    name: "SMS Notification",
    field_key: "sms_notification",
    setting_group: "notifications",
    type: "select",
    options: [
      { label: "Enabled", value: "true" },
      { label: "Disabled", value: "false" },
    ],
  },
];

const createEmptyFormData = (): FormDataState => {
  return settingsFields.reduce<FormDataState>((acc, field) => {
    acc[field.field_key] = field.value ?? "";
    return acc;
  }, {});
};

const createDefaultDbKeys = (): DbKeyState => {
  return settingsFields.reduce<DbKeyState>((acc, field) => {
    acc[field.field_key] = field.field_key;
    return acc;
  }, {});
};

const normalizeText = (value: string | undefined | null): string => {
  return String(value ?? "").trim().toLowerCase();
};

const findSettingForField = (
  field: SettingField,
  fetchedSettings: SettingResponse[]
): SettingResponse | undefined => {
  return fetchedSettings.find((setting) => {
    const keyMatched = normalizeText(setting.key) === normalizeText(field.field_key);

    const nameAndGroupMatched =
      normalizeText(setting.name) === normalizeText(field.name) &&
      normalizeText(setting.setting_group) === normalizeText(field.setting_group);

    return keyMatched || nameAndGroupMatched;
  });
};

const buildFormDataFromFetchedSettings = (
  fetchedSettings: SettingResponse[]
): {
  formData: FormDataState;
  dbKeys: DbKeyState;
} => {
  const nextFormData = createEmptyFormData();
  const nextDbKeys = createDefaultDbKeys();

  settingsFields.forEach((field) => {
    const matchedSetting = findSettingForField(field, fetchedSettings);

    nextFormData[field.field_key] = String(matchedSetting?.value ?? "");
    nextDbKeys[field.field_key] = matchedSetting?.key || field.field_key;
  });

  return {
    formData: nextFormData,
    dbKeys: nextDbKeys,
  };
};

const Settings = () => {
  const { getSettings, updateSettingsData, getLoading, updateLoading } =
    useSettings();

  const [activeTab, setActiveTab] = useState<SettingGroup>("general");

  const [formData, setFormData] = useState<FormDataState>(createEmptyFormData());

  const [initialFormData, setInitialFormData] = useState<FormDataState>(
    createEmptyFormData()
  );

  const [dbKeys, setDbKeys] = useState<DbKeyState>(createDefaultDbKeys());

  const activeFields = settingsFields.filter(
    (field) => field.setting_group === activeTab
  );

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      const fetchedSettings = await getSettings();

      if (!isMounted) return;

      const safeSettings = Array.isArray(fetchedSettings)
        ? fetchedSettings
        : [];

      const patchedData = buildFormDataFromFetchedSettings(safeSettings);

      setFormData(patchedData.formData);
      setInitialFormData(patchedData.formData);
      setDbKeys(patchedData.dbKeys);
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };

    // Keep empty dependency to fetch only once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changedPayload = useMemo<SettingsPayload[]>(() => {
    return settingsFields
      .filter((field) => {
        const currentValue = String(formData[field.field_key] ?? "");
        const initialValue = String(initialFormData[field.field_key] ?? "");

        return currentValue !== initialValue;
      })
      .map((field) => ({
        name: field.name,
        setting_group: field.setting_group,
        key: dbKeys[field.field_key] || field.field_key,
        type: field.type,
        value: String(formData[field.field_key] ?? ""),
      }));
  }, [formData, initialFormData, dbKeys]);

  const hasChanges = changedPayload.length > 0;

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const handleSelectChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value ?? "",
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!hasChanges) return;

    console.log("Only changed settings payload:", changedPayload);

    const updatedSettings = await updateSettingsData(changedPayload);

    if (!updatedSettings) return;

    const updatedArray = Array.isArray(updatedSettings)
      ? updatedSettings
      : [updatedSettings];

    const nextDbKeys = { ...dbKeys };

    updatedArray.forEach((setting: SettingResponse) => {
      const matchedField = settingsFields.find((field) => {
        const keyMatched =
          normalizeText(setting.key) === normalizeText(dbKeys[field.field_key]) ||
          normalizeText(setting.key) === normalizeText(field.field_key);

        const nameAndGroupMatched =
          normalizeText(setting.name) === normalizeText(field.name) &&
          normalizeText(setting.setting_group) ===
          normalizeText(field.setting_group);

        return keyMatched || nameAndGroupMatched;
      });

      if (matchedField) {
        nextDbKeys[matchedField.field_key] =
          setting.key || matchedField.field_key;
      }
    });

    setDbKeys(nextDbKeys);
    setInitialFormData(formData);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
  };

  const renderField = (field: SettingField) => {
    if (field.type === "textarea") {
      return (
        <div key={field.field_key} className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {field.name}
          </label>

          <textarea
            name={field.field_key}
            value={formData[field.field_key] ?? ""}
            onChange={handleInputChange}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      );
    }

    if (field.type === "timezone") {
      return (
        <div key={field.field_key}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {field.name}
          </label>

          <Select
            value={formData[field.field_key] ?? ""}
            onValueChange={(value) => handleSelectChange(field.field_key, value)}
          >
            <SelectTrigger className="w-full rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/30">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>

            <SelectContent className="max-h-72">
              {timeZoneOptions.map((zone) => (
                <SelectItem key={zone.key} value={zone.value}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.field_key}>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {field.name}
          </label>

          <Select
            value={formData[field.field_key] ?? ""}
            onValueChange={(value) => handleSelectChange(field.field_key, value)}
          >
            <SelectTrigger className="w-full rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/30">
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>

            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field.field_key}>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {field.name}
        </label>

        <input
          type={field.type}
          name={field.field_key}
          value={formData[field.field_key] ?? ""}
          onChange={handleInputChange}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage school, user, security, and notification settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold capitalize text-foreground">
                {activeTab} Settings
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update {activeTab} related settings from here.
              </p>
            </div>

            {getLoading && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Loading...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeFields.map((field) => renderField(field))}
          </div>

          {hasChanges && (
            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={updateLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {updateLoading ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                disabled={updateLoading}
                onClick={handleCancel}
                className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default Settings;