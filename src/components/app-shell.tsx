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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b bg-white dark:bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-black dark:text-white">
                Time Tracker
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {session.user?.name || session.user?.email}
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/user/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Sign out
              </button>
            </form>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const active = isCurrentPath(currentPath, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-black">
          <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>

        {children}
      </main>
    </div>
  );
}
