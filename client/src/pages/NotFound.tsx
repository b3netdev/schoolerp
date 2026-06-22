import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardContent className="grid min-h-[560px] grid-cols-1 p-0 lg:grid-cols-[1fr_420px]">
              {/* Left Content */}
              <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
                <div className="mb-8 inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  404 Error
                </div>

                <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  We could not find this page
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  The page you are trying to access may have been removed,
                  renamed, or the link may be incorrect. Please return to a safe
                  page and continue your work.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="h-11 rounded-lg bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoBack}
                    className="h-11 rounded-lg border-border px-6"
                  >
                    Go Back
                  </Button>
                </div>

                <div className="mt-10 border-t border-border pt-6">
                  <p className="text-sm font-medium text-foreground">
                    Need access to this page?
                  </p>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                    Contact your school administrator if you believe this page
                    should be available for your account or role.
                  </p>
                </div>
              </div>

              {/* Right Visual Area */}
              <div className="relative hidden border-l border-border bg-muted/40 lg:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_38%)]" />

                <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">
                  <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/15 bg-primary/10">
                    <span className="text-5xl font-bold text-primary">!</span>
                  </div>

                  <div className="text-[120px] font-black leading-none tracking-tighter text-primary/10">
                    404
                  </div>

                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    Page unavailable or restricted
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {import.meta.env.VITE_SCHOOL_NAME || "School Admin Panel"} · Secure
            Administration System
          </p>
        </div>
      </section>
    </main>
  );
};

export default NotFound;    