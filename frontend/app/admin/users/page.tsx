"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { listUsers, deleteUser, toggleUserStatus, updateUserRole } from "@/lib/users";
import type { User, UserRole } from "@/types/auth";

const roleLabels: Record<UserRole, string> = {
  student: "Student",
  staff: "Staff",
  admin: "Admin",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyUserIds, setBusyUserIds] = useState<number[]>([]);

  useEffect(() => {
    void loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [user, usersList] = await Promise.all([getCurrentUser(), listUsers()]);
      setCurrentUser(user);
      setUsers(usersList);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to load admin data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    if (busyUserIds.includes(userId)) return;
    setBusyUserIds((prev) => [...prev, userId]);
    setError(null);

    try {
      const updatedUser = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((item) => (item.id === userId ? updatedUser : item)));
    } catch (caught) {
      console.error("Failed to update user role:", caught);
      setError("Unable to update role. Please try again.");
    } finally {
      setBusyUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    if (busyUserIds.includes(userId)) return;
    setBusyUserIds((prev) => [...prev, userId]);
    setError(null);

    try {
      const updatedUser = await toggleUserStatus(userId, isActive);
      setUsers((prev) => prev.map((item) => (item.id === userId ? updatedUser : item)));
    } catch (caught) {
      console.error("Failed to update user status:", caught);
      setError("Unable to update status. Please try again.");
    } finally {
      setBusyUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!currentUser) return;
    if (userId === currentUser.id) {
      alert("You cannot delete your own account while signed in.");
      return;
    }

    const target = users.find((user) => user.id === userId);
    if (!target) return;

    const confirmed = window.confirm(`Delete ${target.username}? This action cannot be undone.`);
    if (!confirmed) return;

    setBusyUserIds((prev) => [...prev, userId]);
    setError(null);

    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    } catch (caught) {
      console.error("Failed to delete user:", caught);
      setError("Unable to delete user. Please try again.");
    } finally {
      setBusyUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.first_name.toLowerCase().includes(term) ||
      user.last_name.toLowerCase().includes(term);

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-10">
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading admin users...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-10">
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading user session...
        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-10">
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4">

        {/* Sidebar (reuse from admin page) */}
        {/* TODO: Could extract this to a shared component */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user roles, active status, and remove outdated accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/admin">Back to Dashboard</a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
          <Input
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="min-w-0"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* Users table */}
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="mb-4 text-base font-medium">All Users ({filteredUsers.length})</h2>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users found matching your search.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left w-20">ID</TableHead>
                  <TableHead className="text-left">Username</TableHead>
                  <TableHead className="text-left">Email</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left w-24">Role</TableHead>
                  <TableHead className="text-left w-16">Status</TableHead>
                  <TableHead className="text-left w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between text-left">
                            {roleLabels[user.role]}
                            <ChevronDown className="ml-2 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                          {Object.entries(roleLabels).map(([roleKey, label]) =>
                            roleKey !== user.role ? (
                              <DropdownMenuItem
                                key={roleKey}
                                onSelect={() => handleRoleChange(user.id, roleKey as UserRole)}
                                className="flex justify-between items-center"
                              >
                                {label}
                              </DropdownMenuItem>
                            ) : null,
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant={user.is_active ? "secondary" : "default"}
                          onClick={() => handleToggleStatus(user.id, !user.is_active)}
                          disabled={busyUserIds.includes(user.id)}
                        >
                          {busyUserIds.includes(user.id) ? "Saving..." : user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id || busyUserIds.includes(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Page-level keyframes */}
      <style>{`
        @keyframes page-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="page-fade-up"] { animation: none !important; }
        }
      `}</style>
    </main>
  );
}