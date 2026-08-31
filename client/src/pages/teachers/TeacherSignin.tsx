import { FormEvent, useId, useState } from "react";

export type TeacherSigninValues = {
  teacherId: string;
  password: string;
  rememberMe: boolean;
};

type TeacherSigninProps = {
  /** Connect this to your authentication API. Return a rejected promise to show the error message. */
  onSubmit?: (values: TeacherSigninValues) => void | Promise<void>;
  /** Use this to navigate to your password-reset screen. */
  onForgotPassword?: () => void;
  schoolName?: string;
};

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {hidden ? (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.3 0 9.3 5 10 8-0.3 1.1-1.1 2.5-2.2 3.7" />
        <path d="M6.6 6.6C4.5 8 2.6 10.4 2 12c0.8 3 4.8 8 10 8 1.7 0 3.1-0.4 4.3-1" />
      </>
    ) : (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const SchoolIcon = () => (
  <svg aria-hidden="true" className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 10 9-6 9 6" />
    <path d="M5 10v9h14v-9" />
    <path d="M9 19v-5h6v5" />
    <path d="M8 10h.01M12 10h.01M16 10h.01" />
  </svg>
);

export default function TeacherSignin({
  onSubmit,
  onForgotPassword,
  schoolName = "School ERP",
}: TeacherSigninProps) {
  const teacherIdId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [teacherId, setTeacherId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!teacherId.trim() || !password) {
      setError("Please enter your Teacher ID and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit?.({ teacherId: teacherId.trim(), password, rememberMe });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_hsl(var(--primary)/0.10),_transparent_30%)]" />
      <div className="absolute -left-24 top-20 -z-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 -z-10 size-80 rounded-full bg-blue-400/10 blur-3xl" />

      <section className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <SchoolIcon />
          </div>
          <p className="text-sm font-semibold tracking-wide text-primary">{schoolName}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">Teachers Log in</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to manage your classes and students.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {error && (
            <div id={errorId} role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor={teacherIdId} className="text-sm font-semibold text-card-foreground">Teacher ID</label>
            <input
              id={teacherIdId}
              name="teacherId"
              type="text"
              autoComplete="username"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              aria-describedby={error ? errorId : undefined}
              placeholder="Enter your teacher ID"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor={passwordId} className="text-sm font-semibold text-card-foreground">Password</label>
              <button type="button" onClick={onForgotPassword} className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" disabled={isSubmitting}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id={passwordId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={error ? errorId : undefined}
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                required
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showPassword ? "Hide password" : "Show password"} disabled={isSubmitting}>
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} disabled={isSubmitting} className="size-4 rounded border-input text-primary accent-primary focus:ring-2 focus:ring-ring" />
            Remember me on this device
          </label>

          <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
          Need help? Contact your school administration.
        </p>
      </section>
    </main>
  );
}
