"use client";

import { useEffect, useState } from "react";
import { API, getToken, getUser } from "@/lib/auth";

type User = {
  _id: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        setError("No auth token found");
        setUsers([]);
        return;
      }

      const res = await fetch(`${API}/api/auth/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.message || "Failed to fetch users");
        setUsers([]);
        return;
      }

      if (!Array.isArray(data)) {
        setError("API did not return an array");
        setUsers([]);
        return;
      }

      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Network or server error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const me = getUser();
    if (!me || !me.isAdmin) {
      window.location.href = "/";
      return;
    }
    fetchUsers();
  }, []);

  async function handleAction(url: string, method: string = "PATCH") {
    try {
      setError(null);
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || data?.message || "Action failed");
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      setError("Network or server error");
    }
  }

  async function toggleVerify(id: string) {
    await handleAction(`${API}/api/auth/admin/toggle-verify/${id}`, "PATCH");
  }

  async function del(id: string) {
    if (!confirm("Delete this user?")) return;
    await handleAction(`${API}/api/auth/admin/delete-user/${id}`, "DELETE");
  }

  return (
    <div className="min-h-screen bg-[#FDFBFF] dark:bg-[#0D0A13] px-4 pt-24 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-[#2E1065] dark:text-[#F5F3FF] tracking-tight">
          User Management
        </h1>
        <p className="text-[#6D28D9]/70 dark:text-[#A78BFA]/60 mb-10">
          Manage user verification and access control
        </p>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50/50 backdrop-blur-sm p-5 text-red-700 flex items-center gap-3">
            <span className="bg-red-100 p-1 rounded-full">⚠️</span>
            <span className="text-sm font-medium">
              <strong>Error:</strong> {error}
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-[#15121C] border border-purple-100 dark:border-purple-900/20 rounded-3xl shadow-xl shadow-purple-500/5 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-purple-400 animate-pulse font-medium">
              Loading users…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F3FF] dark:bg-[#1A1625] text-[#5B21B6] dark:text-[#A78BFA]">
                    <th className="text-left px-8 py-5 font-bold uppercase tracking-wider text-xs">
                      Email
                    </th>
                    <th className="text-left px-8 py-5 font-bold uppercase tracking-wider text-xs">
                      Status
                    </th>
                    <th className="text-left px-8 py-5 font-bold uppercase tracking-wider text-xs">
                      Role
                    </th>
                    <th className="text-right px-8 py-5 font-bold uppercase tracking-wider text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-50 dark:divide-purple-900/10">
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-16 text-center text-purple-300 dark:text-purple-800 italic"
                      >
                        No users found in the database
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-[#F5F3FF]/30 dark:hover:bg-[#1A1625]/50 transition-colors"
                      >
                        <td className="px-8 py-5 font-semibold text-[#2E1065] dark:text-[#EDE9FE]">
                          {u.email}
                        </td>

                        <td className="px-8 py-5">
                          {u.isVerified ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-bold border border-amber-100 dark:border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-3 py-1 text-xs font-bold border border-purple-200 dark:border-purple-500/30">
                              Admin
                            </span>
                          ) : (
                            <span className="text-purple-300 dark:text-purple-800 text-xs font-medium">
                              Standard User
                            </span>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => toggleVerify(u._id)}
                              className="rounded-xl border border-purple-200 dark:border-purple-800 px-4 py-2 text-xs font-bold text-[#6D28D9] dark:text-[#A78BFA] hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all active:scale-95"
                            >
                              {u.isVerified ? "Unverify" : "Verify User"}
                            </button>

                            <button
                              onClick={() => del(u._id)}
                              className="rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 px-4 py-2 text-xs font-bold hover:bg-red-600 hover:text-white transition-all active:scale-95"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
