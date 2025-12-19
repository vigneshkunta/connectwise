"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Video, Shield, Users } from "lucide-react";

import { API, getToken, getUser } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleStart = async () => {
    // ❌ Not logged in
    if (!user) {
      toast.error("You must log in first.");
      router.push("/login");
      return;
    }

    // ❌ Not verified
    if (!user.isVerified) {
      toast.warning("Your account is not verified yet.");
      return;
    }

    // 🔐 Backend confirmation
    const res = await fetch(`${API}/api/auth/video-access`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      toast.error("Access denied.");
      return;
    }

    // ✅ Go to video
    router.push("/video");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-slate-900 dark:text-slate-50">
      {/* Reduced pt-20 to eliminate the gap with the header */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            Connect Instantly
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            A secure anonymous video chat platform. Only verified users can
            connect, ensuring safety and quality.
          </p>

          <button
            onClick={handleStart}
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-violet-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-violet-500 shadow-xl shadow-violet-500/20 cursor-pointer"
          >
            Start Connecting
          </button>

          <div className="grid md:grid-cols-3 gap-6 mt-32">
            {[
              {
                icon: Video,
                title: "Video Chat",
                desc: "Real-time high-quality video conversations.",
              },
              {
                icon: Shield,
                title: "Verified Users",
                desc: "Only verified users can access the platform.",
              },
              {
                icon: Users,
                title: "Anonymous Matching",
                desc: "Instantly connect with random verified users.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-all duration-300"
              >
                <feature.icon className="w-10 h-10 text-violet-600 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
