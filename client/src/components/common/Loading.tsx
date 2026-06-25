
const LoadingPage = ({
  title = "Loading",
  message = "Please wait while we prepare your workspace.",
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-card-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Spinner */}
          <div
            className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-primary"
            role="status"
            aria-label="Loading"
          />

          {/* Content */}
          <h1 className="mt-6 text-lg font-semibold tracking-tight">
            {title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;