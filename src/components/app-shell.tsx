import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth";

type SessionLike = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type AppShellProps = {
  session: SessionLike;
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/entries/manual", label: "Manual Entry" },
  { href: "/entries/live", label: "Start / Finish" },
  { href: "/exports", label: "Exports" },
];

function isCurrentPath(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === href;
  }

  return currentPath.startsWith(href);
}

export function AppShell({
  session,
  currentPath,
  title,
  description,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--brand-line)]/80 bg-[color:rgba(244,247,242,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              <Image
                src="/logo.svg"
                alt="Time Tracker logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-2xl shadow-sm"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-[var(--brand-deep)] sm:text-xl">
                  Time Tracker
                </h1>
                <p className="truncate text-sm text-[color:rgba(25,52,31,0.72)]">
                  Welcome, {session.user?.name || session.user?.email}
                </p>
              </div>
            </Link>

            <form className="w-full sm:w-auto"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/user/login" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-deep)] sm:w-auto"
              >
                Sign out
              </button>
            </form>
          </div>

          <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {navigationItems.map((item) => {
              const active = isCurrentPath(currentPath, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "bg-[var(--surface-strong)] text-[var(--brand-deep)] ring-1 ring-[var(--brand-line)] hover:bg-[var(--brand-wash)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 overflow-hidden rounded-[28px] border border-[var(--brand-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(237,244,233,0.96))] p-5 shadow-[0_18px_50px_rgba(36,89,47,0.08)] sm:mb-6 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl bg-[var(--brand-soft)] p-3 sm:block">
              <Image
                src="/logo.svg"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11"
              />
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--brand-deep)]">
                {title}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-[color:rgba(25,52,31,0.76)] sm:text-base">
                {description}
              </p>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
