"use client";

import { API, getToken, getUser } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const user = getUser();
    if (!user || !user.isAdmin) {
      window.location.href = "/";
      return;
    }

    fetch(`${API}/api/auth/admin/users`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(res => res.json())
      .then(setUsers);
  }, []);

  async function toggleVerify(id: string) {
    await fetch(`${API}/api/auth/admin/toggle-verify/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    location.reload();
  }

  async function del(id: string) {
    await fetch(`${API}/api/auth/admin/delete-user/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    location.reload();
  }

  return (
    <div>
      <h2>Admin Users</h2>
      {users.map(u => (
        <div key={u._id}>
          {u.email} | Verified: {String(u.isVerified)}
          <button onClick={() => toggleVerify(u._id)}>Toggle Verify</button>
          <button onClick={() => del(u._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
