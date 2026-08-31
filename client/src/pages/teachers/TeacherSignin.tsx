import api from "@/lib/api";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useAppDispatch } from "../../../redux/hooks";
import { setAuth } from "../../../redux/slicers/authslicer";
import { useNavigate } from "react-router-dom";

export type TeacherSigninValues = {
  teacherId: string;
  password: string;
};

type TeacherSigninProps = {
  onSubmit?: (values: TeacherSigninValues) => void | Promise<void>;
  onForgotPassword?: () => void;
  schoolName?: string;
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useAppDispatch()
    const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!teacherId.trim() || !password) {
      setError("Enter your Teacher ID and password to continue.");
      return;
    }


    try {
      setIsSubmitting(true);
      console.log(teacherId, password, "DATA")

      const data = await api.post(`teacher/login`, { employee_code: teacherId, password: password })
      if (data?.data?.success == true) {
        dispatch(setAuth(data.data.data))
         navigate(`/${data.role}/dashboard`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 py-8 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50 sm:px-6">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_48%,#f9fbff_100%)] dark:bg-[linear-gradient(135deg,#0f172a_0%,#111d36_52%,#0f172a_100%)]" />
      <div className="absolute -left-28 top-[-8rem] -z-10 size-[32rem] rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/10" />
      <div className="absolute -bottom-40 -right-24 -z-10 size-[30rem] rounded-full bg-indigo-200/45 blur-3xl dark:bg-indigo-500/10" />
      <div className="absolute left-[10%] top-[22%] -z-10 size-24 rounded-full border border-primary/10 bg-white/20 dark:bg-white/[0.02]" />

      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_32px_90px_-38px_rgba(30,64,175,0.38)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,hsl(var(--primary)),#2f63bd)] p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-24 size-80 rounded-full border border-white/15" />
          <div className="absolute -bottom-28 -left-24 size-80 rounded-full border-[28px] border-white/10" />
          <div className="relative">
            <div className="grid size-12 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-6 9 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg>
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{schoolName}</p>
            <h1 className="mt-3 max-w-sm text-4xl font-bold leading-tight tracking-tight">Your teaching workspace, in one place.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/80">Manage your classes, sections, attendance, and daily academic tasks securely.</p>
          </div>
          <div className="relative border-t border-white/15 pt-6"><p className="text-sm font-medium text-white/85">Teacher access portal</p><p className="mt-1 text-sm text-white/60">Secure access for authorised school staff.</p></div>
        </div>

        <div className="p-7 sm:p-10">
          <div className="mb-8 lg:hidden">
            <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><svg aria-hidden="true" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-6 9 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></svg></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">{schoolName}</p>
          </div>

          <div><p className="text-sm font-semibold text-primary">Teacher portal</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-card-foreground">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your credentials to continue to your dashboard.</p></div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {error && <div id={errorId} role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">{error}</div>}
            <div className="space-y-2"><label htmlFor={teacherIdId} className="text-sm font-semibold text-card-foreground">Teacher ID</label><input id={teacherIdId} name="teacherId" type="text" autoComplete="username" value={teacherId} onChange={(event) => setTeacherId(event.target.value)} aria-describedby={error ? errorId : undefined} placeholder="Example: TCH-2026-00001" disabled={isSubmitting} required className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" /></div>
            <div className="space-y-2"><div className="flex items-center justify-between gap-3"><label htmlFor={passwordId} className="text-sm font-semibold text-card-foreground">Password</label>{onForgotPassword && <button type="button" onClick={onForgotPassword} disabled={isSubmitting} className="text-sm font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-60">Forgot password?</button>}</div><div className="relative"><input id={passwordId} name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={error ? errorId : undefined} placeholder="Enter your password" disabled={isSubmitting} required className="h-12 w-full rounded-xl border border-input bg-background px-3.5 pr-12 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={isSubmitting} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed">{showPassword ? <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.3 0 9.3 5 10 8-0.3 1.1-1.1 2.5-2.2 3.7" /><path d="M6.6 6.6C4.5 8 2.6 10.4 2 12c0.8 3 4.8 8 10 8 1.7 0 3.1-0.4 4.3-1" /></svg> : <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button></div></div>
            <button type="submit" disabled={isSubmitting} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Signing in…" : "Log in to teacher portal"}</button>
          </form>
          <p className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">Need access help? Please contact your school administration.</p>
        </div>
      </section>
    </main>
  );
}