"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import type { User } from "@/types/auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<User[]>("/api/users/");
      setUsers(response);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await apiRequest<{ success: boolean }>(`/api/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      await loadUsers(); // Refresh the list
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Failed to update user role. Please try again.");
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-10">
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading users...
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

        {/* Page header */}
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="space-x-4">
            <Button
              asChild
              href="/admin"
              variant="outline"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
              variant="outline"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search users by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

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
                          <Button variant="outline" size="sm" className="w-full text-left">
                            {user.role === "student" ? "Student" : user.role === "staff" ? "Staff" : "Admin"}
                            <ChevronDown className="ml-2 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                          {user.role !== "student" && (
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(user.id, "student")}
                              className="flex justify-between items-center"
                            >
                              Student
                            </DropdownMenuItem>
                          )}
                          {user.role !== "staff" && (
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(user.id, "staff")}
                              className="flex justify-between items-center"
                            >
                              Staff
                            </DropdownMenuItem>
                          )}
                          {user.role !== "admin" && (
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(user.id, "admin")}
                              className="flex justify-between items-center"
                            >
                              Admin
                            </DropdownMenuItem>
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
                      <div className="flex space-x-2">
                        {/* TODO: Add edit/delete buttons if needed */}
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