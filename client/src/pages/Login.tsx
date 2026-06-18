import { useState } from "react";
import { Eye, EyeOff, School, Lock, Mail, AlertCircle } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

const DEMO_EMAIL = "admin@school.edu";
const DEMO_PASSWORD = "admin123";

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        if (remember) localStorage.setItem("edu_auth", "1");
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setLoading(false);
    }, 700);
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">EduAdmin</span>
          </div>
          <p className="text-white/50 text-sm">School Management System</p>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your school<br />smarter, not harder.
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            A complete admin panel for managing students, teachers, attendance,
            fees, exams, and more — all in one place.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: "1,240+", label: "Students" },
              { value: "86", label: "Teachers" },
              { value: "42", label: "Classes" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-sm mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["JA", "MC", "AT", "FN"].map((init, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-sidebar flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"][i] }}
              >
                {init}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-sm">Trusted by 50+ staff members</p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <span className="text-foreground font-bold text-lg">EduAdmin</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Sign in to your admin account to continue
            </p>
          </div>

          {/* Demo hint */}
          <button
            type="button"
            onClick={fillDemo}
            className="w-full mb-6 p-3.5 rounded-xl border border-primary/30 bg-primary/5 text-sm text-left group hover:bg-primary/10 transition-colors"
            data-testid="demo-hint"
          >
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <span className="text-xs bg-primary/15 px-2 py-0.5 rounded-full">Demo</span>
              Click to fill demo credentials
            </div>
            <div className="text-muted-foreground space-y-0.5 ml-0.5">
              <p>Email: <span className="font-mono text-foreground">{DEMO_EMAIL}</span></p>
              <p>Password: <span className="font-mono text-foreground">{DEMO_PASSWORD}</span></p>
            </div>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" data-testid="login-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@school.edu"
                  className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  data-testid="email-input"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                data-testid="remember-checkbox"
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2024 EduAdmin · School Management System
          </p>
        </div>
      </div>
    </div>
  );
}
