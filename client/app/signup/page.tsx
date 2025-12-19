"use client";

import { API, getToken } from "@/lib/auth";
import { useEffect } from "react";
import Link from "next/link";

export default function SignupPage() {
  useEffect(() => {
    if (getToken()) window.location.href = "/";
  }, []);

  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: (form.email as any).value,
        password: (form.password as any).value,
      }),
    });

    if (!res.ok) return alert("Signup failed");

    alert("Signup successful. Await verification.");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#FDFBFF] dark:bg-[#0D0A13] flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md bg-white dark:bg-[#15121C] border border-purple-100 dark:border-purple-900/20 rounded-3xl p-10 shadow-xl shadow-purple-500/5">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#2E1065] dark:text-[#F5F3FF] tracking-tight">
          Join the Community
        </h1>

        <form onSubmit={signup} className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA] ml-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full bg-[#F5F3FF] dark:bg-[#0D0A13] rounded-2xl border border-purple-100 dark:border-purple-900/30 px-4 py-3.5 text-[#2E1065] dark:text-[#EDE9FE] outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all placeholder:text-purple-300 dark:placeholder:text-purple-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] dark:text-[#A78BFA] ml-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="Choose a strong password"
              className="mt-2 w-full bg-[#F5F3FF] dark:bg-[#0D0A13] rounded-2xl border border-purple-100 dark:border-purple-900/30 px-4 py-3.5 text-[#2E1065] dark:text-[#EDE9FE] outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:border-[#7C3AED] transition-all placeholder:text-purple-300 dark:placeholder:text-purple-900"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#7C3AED] text-white py-4 font-bold shadow-lg shadow-purple-500/25 hover:bg-[#6D28D9] hover:shadow-purple-500/40 transition-all active:scale-[0.98] cursor-pointer"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#6D28D9]/60 dark:text-[#A78BFA]/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#7C3AED] font-bold hover:text-[#6D28D9] transition-colors ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
