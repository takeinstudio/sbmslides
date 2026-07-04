import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Slide not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl btn-brand px-6 py-3 text-sm font-semibold"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-2xl btn-brand px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SBM Slides — Create professional presentations effortlessly" },
      { name: "description", content: "SBM Slides is a minimal, modern presentation editor. Create, save, and export beautiful slides in seconds." },
      { property: "og:title", content: "SBM Slides" },
      { property: "og:description", content: "Create professional presentation slides effortlessly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&family=Roboto:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [auth, setAuth] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sbm_auth") === "true";
    }
    return false;
  });

  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === "satyabrat" && pass === "qwertyui") {
      setAuth(true);
      sessionStorage.setItem("sbm_auth", "true");
    } else {
      setErr("Invalid ID or password");
    }
  };

  if (!auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl glass p-6 sm:p-8 shadow-2xl border border-border">
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gradient">SBM Slides</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please sign in to continue</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">ID</label>
              <input 
                type="text" 
                value={id} 
                onChange={e => setId(e.target.value)} 
                className="w-full rounded-xl bg-black/50 px-4 py-3 text-sm outline-none border border-border focus:border-primary focus:ring-1 focus:ring-primary transition" 
                placeholder="Enter your ID"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Password</label>
              <input 
                type="password" 
                value={pass} 
                onChange={e => setPass(e.target.value)} 
                className="w-full rounded-xl bg-black/50 px-4 py-3 text-sm outline-none border border-border focus:border-primary focus:ring-1 focus:ring-primary transition" 
                placeholder="••••••••"
              />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <button type="submit" className="mt-4 w-full rounded-xl btn-brand py-3 text-sm font-semibold transition">
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}
