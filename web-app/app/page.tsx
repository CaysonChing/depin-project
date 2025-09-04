import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
          Welcome
        </h1>
        <p className="text-lg text-gray-400 text-center max-w-lg">
          Join us today to get started. Choose an option below to continue.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <a
            href="/auth/login"
            className="w-full sm:w-auto rounded-full border border-solid border-indigo-500 bg-indigo-500 text-white font-medium text-lg h-12 px-8 transition-colors flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Log In
          </a>
          <a
            href="/auth/register"
            className="w-full sm:w-auto rounded-full border border-solid border-gray-400 text-gray-400 font-medium text-lg h-12 px-8 transition-colors flex items-center justify-center hover:bg-gray-800 hover:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Register
          </a>
        </div>
      </main>
    </div>
  );
}
