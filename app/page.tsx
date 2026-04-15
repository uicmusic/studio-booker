import Navbar from "@/components/Navbar";
import { auth } from "@/lib/next-auth";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <Image
              src="/uic-logo.png"
              alt="UIC College"
              width={500}
              height={150}
              className="h-40 w-auto"
            />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Studio Booker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            UIC Music Department
          </p>
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <p className="text-gray-500">
              Login to start booking studios and equipment
            </p>
          )}
        </div>

        {/* Demo Accounts */}
        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            Demo Accounts
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900">Admin</p>
              <p className="text-gray-600">admin@uic.edu</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900">Lecturer</p>
              <p className="text-gray-600">feliks@uic.edu</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-gray-900">Student</p>
              <p className="text-gray-600">student@uic.edu</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Studio Booker &copy; {new Date().getFullYear()} - UIC Music Department, BSD Campus</p>
        </div>
      </footer>
    </div>
  );
}
