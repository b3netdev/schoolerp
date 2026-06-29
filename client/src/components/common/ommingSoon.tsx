import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
            <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

                <div className="relative z-10 px-6 py-14 text-center sm:px-10">
                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                        <Sparkles className="h-10 w-10" />
                    </div>

                    {/* Badge */}
                    <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                        <Clock className="h-4 w-4" />
                        New Feature
                    </div>

                    {/* Heading */}
                    <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Coming Soon
                    </h1>

                    {/* Description */}
                    <p className="mx-auto mb-8 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                        This page is currently under development. We are working on this
                        feature and it will be available soon.
                    </p>

                    {/* Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:bg-primary/90"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;