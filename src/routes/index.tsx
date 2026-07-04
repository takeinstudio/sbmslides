import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, FolderOpen, Sparkles, FileText } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.7 0.19 285), transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, oklch(0.82 0.13 235), transparent 70%)" }} />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl btn-brand">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">SBM Slides</span>
        </div>
        <Link to="/saved" className="text-sm text-muted-foreground hover:text-foreground transition">
          Saved
        </Link>
      </nav>

      <main className="relative z-10 flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in">

          <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">
            <span className="text-gradient">SBM Slides</span>
          </h1>


          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row flex-wrap">
            <Link
              to="/create"
              className="group inline-flex items-center gap-3 rounded-2xl btn-brand px-6 py-4 text-sm sm:text-base font-semibold w-full sm:w-auto justify-center"
            >
              <Plus className="h-5 w-5 transition group-hover:rotate-90" />
              Create Slide
            </Link>
            <Link
              to="/create-qp"
              className="group inline-flex items-center gap-3 rounded-2xl bg-indigo-500 text-white px-6 py-4 text-sm sm:text-base font-semibold hover:bg-indigo-600 transition w-full sm:w-auto justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              <FileText className="h-5 w-5" />
              Create Question Paper
            </Link>
            <Link
              to="/saved"
              className="inline-flex items-center gap-3 rounded-2xl glass px-6 py-4 text-sm sm:text-base font-semibold hover:bg-card transition w-full sm:w-auto justify-center"
            >
              <FolderOpen className="h-5 w-5" />
              Saved
            </Link>
          </div>
        </div>

        <p className="mt-16 text-xs text-muted-foreground">
          Made with care by Satyabrat Mishra
        </p>
      </main>
    </div>
  );
}
