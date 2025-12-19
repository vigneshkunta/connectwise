"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { getUser, logout } from "@/lib/auth";

type User = {
  isAdmin: boolean;
};

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#050505]/70 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 shadow-md shadow-gray-900/5">
      <div className="max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight group"
        >
          <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5 text-white" />
          </div>
          ConnectWise
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden md:block"
          >
            Home
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              {user.isAdmin && (
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden md:block"
                >
                  Manage
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:opacity-70 transition-opacity cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
