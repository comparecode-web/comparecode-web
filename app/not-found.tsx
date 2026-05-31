import Link from "next/link";
import { MdHome, MdSearchOff } from "react-icons/md";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-bg-secondary bg-linear-to-br from-accent-primary/10 via-transparent to-accent-primary/5 px-4 py-8 sm:px-6">
      <main className="cc-animate-scale-in relative w-full max-w-xl rounded-2xl border border-border-default bg-bg-primary/95 p-6 text-center shadow-xl backdrop-blur-sm sm:p-10">
        <div className="cc-animate-fade-in-up mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-default bg-bg-secondary text-accent-primary">
          <MdSearchOff className="text-3xl" />
        </div>
        <p
          className="cc-animate-fade-in-up mx-auto w-fit bg-linear-to-r from-text-primary to-accent-primary bg-clip-text text-7xl font-black leading-none text-transparent sm:text-8xl"
          style={{ animationDelay: "80ms" }}
        >
          404
        </p>
        <h1
          className="cc-animate-fade-in-up mt-2 text-2xl font-extrabold text-text-primary sm:text-3xl"
          style={{ animationDelay: "160ms" }}
        >
          Page not found
        </h1>
        <p
          className="cc-animate-fade-in-up mt-3 text-sm text-text-secondary sm:text-base"
          style={{ animationDelay: "220ms" }}
        >
          The page you requested does not exist or has been moved.
        </p>
        <div
          className="cc-animate-fade-in-up mt-6 flex items-center justify-center"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-(--duration-medium) hover:brightness-95 hover:shadow-lg"
          >
            <MdHome className="text-base" />
            Return to home page
          </Link>
        </div>
      </main>
    </div>
  );
}

