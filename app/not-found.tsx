import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg-secondary px-4 py-8 sm:px-6">
      <main className="w-full max-w-xl rounded-2xl border border-border-default bg-bg-primary p-6 text-center shadow-lg sm:p-8">
        <p className="text-7xl font-black leading-none text-text-primary sm:text-8xl">404</p>
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary sm:text-3xl">Page not found</h1>
        <p className="mt-3 text-sm text-text-secondary sm:text-base">
          The page you requested does not exist or has been moved.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-95"
          >
            Return to home page
          </Link>
        </div>
      </main>
    </div>
  );
}
