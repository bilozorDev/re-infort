import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Re-infort</h1>
            </div>

            <div className="flex items-center gap-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Welcome to Re-infort
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your application is ready with Clerk authentication and Supabase integration. Start
            building amazing features today.
          </p>

          <div className="flex gap-4 justify-center">
            <SignedOut>
              <Link
                href="/sign-up"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/sign-in"
                className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              🔐
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
            <p className="text-gray-600">
              Powered by Clerk for enterprise-grade security and user management
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Database</h3>
            <p className="text-gray-600">
              Supabase provides instant data sync and powerful queries
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              🚀
            </div>
            <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
            <p className="text-gray-600">
              Built with Next.js 15 for optimal performance and scalability
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
