"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/top-nav";
import { apiRequest } from "@/lib/api";
import { listFoundItems, listLostItems } from "@/lib/items";
import type { LostItem, FoundItem } from "@/types/items";

export default function AdminItemsPage() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Loading...");

  // Item states
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [lostLoading, setLostLoading] = useState(true);
  const [foundLoading, setFoundLoading] = useState(true);
  const [lostError, setLostError] = useState<string | null>(null);
  const [foundError, setFoundError] = useState<string | null>(null);

  // Filter states
  const [lostFilters, setLostFilters] = useState<LostItemFilters>({
    status: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [foundFilters, setFoundFilters] = useState<FoundItemFilters>({
    status: "",
    category: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  // Pagination states
  const [lostPage, setLostPage] = useState(1);
  const [foundPage, setFoundPage] = useState(1);
  const [lostTotal, setLostTotal] = useState(0);
  const [foundTotal, setFoundTotal] = useState(0);
  const pageSize = 10;

  // Active tab
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadUser = async () => {
      try {
        const current = await getCurrentUser();
        if (!alive) return;
        if (current.role !== "admin") {
          setMessage("Access denied. Admin privileges required.");
          router.replace("/dashboard");
          return;
        }
        setUser(current);
        setMessage(`Welcome back, Admin ${current.username}.`);
      } catch (error) {
        if (!alive) return;
        setMessage("Please sign in again.");
        router.replace("/login");
      } finally {
        if (alive) setLoading(false);
      }
    };
    void loadUser();
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    void loadLostItems();
  }, [user, lostFilters, lostPage]);

  useEffect(() => {
    if (!user) return;
    void loadFoundItems();
  }, [user, foundFilters, foundPage]);

  const loadLostItems = async () => {
    if (!mountedRef.current) return;
    setLostLoading(true);
    setLostError(null);

    try {
      const data = await listLostItems({
        status: lostFilters.status || undefined,
        category: lostFilters.category || undefined,
        date_lost__gte: lostFilters.dateFrom || undefined,
        date_lost__lte: lostFilters.dateTo || undefined,
        search: lostFilters.search || undefined,
        page: lostPage,
        page_size: pageSize,
      });

      if (!mountedRef.current) return;
      setLostItems(data.results ?? []);
      setLostTotal(data.count ?? (data.results?.length ?? 0));
    } catch (error) {
      if (!mountedRef.current) return;
      setLostError("Failed to load lost items");
      console.error("Error loading lost items:", error);
    } finally {
      if (mountedRef.current) setLostLoading(false);
    }
  };

  const loadFoundItems = async () => {
    if (!mountedRef.current) return;
    setFoundLoading(true);
    setFoundError(null);

    try {
      const data = await listFoundItems({
        status: foundFilters.status || undefined,
        category: foundFilters.category || undefined,
        date_found__gte: foundFilters.dateFrom || undefined,
        date_found__lte: foundFilters.dateTo || undefined,
        search: foundFilters.search || undefined,
        page: foundPage,
        page_size: pageSize,
      });

      if (!mountedRef.current) return;
      setFoundItems(data.results ?? []);
      setFoundTotal(data.count ?? (data.results?.length ?? 0));
    } catch (error) {
      if (!mountedRef.current) return;
      setFoundError("Failed to load found items");
      console.error("Error loading found items:", error);
    } finally {
      if (mountedRef.current) setFoundLoading(false);
    }
  };

  // Handle filter changes
  const handleLostFiltersChange = (filters: Partial<LostItemFilters>) => {
    setLostFilters(prev => ({ ...prev, ...filters }));
    setLostPage(1); // Reset to first page when filters change
  };

  const handleFoundFiltersChange = (filters: Partial<FoundItemFilters>) => {
    setFoundFilters(prev => ({ ...prev, ...filters }));
    setFoundPage(1); // Reset to first page when filters change
  };

  // Handle page changes
  const handleLostPageChange = (page: number) => {
    setLostPage(page);
  };

  const handleFoundPageChange = (page: number) => {
    setFoundPage(page);
  };

  // Handle status change
  const handleLostStatusChange = async (itemId: number, newStatus: "active" | "resolved") => {
    try {
      await apiRequest<LostItem>(`/api/items/lost/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      // Update optimistic update
      setLostItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update item status");
    }
  };

  const handleFoundStatusChange = async (itemId: number, newStatus: "unclaimed" | "claimed") => {
    try {
      await apiRequest<FoundItem>(`/api/items/found/${itemId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      // Update optimistic update
      setFoundItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update item status");
    }
  };

  // Handle delete item
  const handleDeleteLost = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiRequest<void>(`/api/items/lost/${itemId}/`, {
        method: "DELETE",
      });
      setLostItems(prev => prev.filter(item => item.id !== itemId));
      setLostTotal(prev => prev - 1);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

  const handleDeleteFound = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await apiRequest<void>(`/api/items/found/${itemId}/`, {
        method: "DELETE",
      });
      setFoundItems(prev => prev.filter(item => item.id !== itemId));
      setFoundTotal(prev => prev - 1);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
        <AppSidebar />
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
        <AppSidebar />
        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center text-sm text-muted-foreground">
          Loading user session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_90%_92%,_#2727571C,_transparent_48%)]" />
      <AppSidebar />
      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col">
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-b">
            <h1 className="text-2xl font-bold">Items Management</h1>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push("/admin/items/report-lost")}
                variant="outline"
              >
                Report Lost Item
              </Button>
              <Button
                onClick={() => router.push("/admin/items/report-found")}
                variant="outline"
              >
                Report Found Item
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-shrink-0 border-b px-4">
            <button
              className={`${activeTab === "lost"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-muted-foreground/80"}`}
              onClick={() => setActiveTab("lost")}
            >
              Lost Items ({lostTotal})
            </button>
            <button
              className={`${activeTab === "found"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-muted-foreground/80"}`}
              onClick={() => setActiveTab("found")}
            >
              Found Items ({foundTotal})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "lost" ? (
              <LostItemsSection
                lostItems={lostItems}
                lostLoading={lostLoading}
                lostError={lostError}
                lostFilters={lostFilters}
                onLostFiltersChange={handleLostFiltersChange}
                lostPage={lostPage}
                lostTotal={lostTotal}
                pageSize={pageSize}
                onLostPageChange={handleLostPageChange}
                onLostStatusChange={handleLostStatusChange}
                onDeleteLost={handleDeleteLost}
              />
            ) : (
              <FoundItemsSection
                foundItems={foundItems}
                foundLoading={foundLoading}
                foundError={foundError}
                foundFilters={foundFilters}
                onFoundFiltersChange={handleFoundFiltersChange}
                foundPage={foundPage}
                foundTotal={foundTotal}
                pageSize={pageSize}
                onFoundPageChange={handleFoundPageChange}
                onFoundStatusChange={handleFoundStatusChange}
                onDeleteFound={handleDeleteFound}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 items-center justify-between p-4 border-t">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-muted-foreground/80">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Page-level keyframes */}
      <style>{`
        @keyframes page-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="page-fade-up"] { animation: none !important; }
        }
      `}</style>
    </main>
  );
}

// Helper types
interface LostItemFilters {
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface FoundItemFilters {
  status: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

// Lost Items Section Component
function LostItemsSection({
  lostItems = [],
  lostLoading,
  lostError,
  lostFilters,
  onLostFiltersChange,
  lostPage,
  lostTotal,
  pageSize,
  onLostPageChange,
  onLostStatusChange,
  onDeleteLost,
}: {
  lostItems?: LostItem[];
  lostLoading: boolean;
  lostError: string | null;
  lostFilters: LostItemFilters;
  onLostFiltersChange: (filters: Partial<LostItemFilters>) => void;
  lostPage: number;
  lostTotal: number;
  pageSize: number;
  onLostPageChange: (page: number) => void;
  onLostStatusChange: (itemId: number, newStatus: "active" | "resolved") => void;
  onDeleteLost: (itemId: number) => void;
}) {
  const safeLostItems = lostItems ?? [];
  return (
    <div className="p-6 overflow-y-auto">
      {lostError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          {lostError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-4">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={lostFilters.status}
              onChange={(e) =>
                onLostFiltersChange({ status: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={lostFilters.category}
              onChange={(e) =>
                onLostFiltersChange({ category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Categories</option>
              {/* In a real app, these would come from an API */}
              <option value="Electronics">Electronics</option>
              <option value="Keys">Keys</option>
              <option value="Wallet">Wallet</option>
              <option value="Bag">Bag</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Lost From</label>
            <input
              type="date"
              value={lostFilters.dateFrom}
              onChange={(e) =>
                onLostFiltersChange({ dateFrom: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Lost To</label>
            <input
              type="date"
              value={lostFilters.dateTo}
              onChange={(e) =>
                onLostFiltersChange({ dateTo: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, description, location..."
              value={lostFilters.search}
              onChange={(e) =>
                onLostFiltersChange({ search: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onLostFiltersChange({
                  status: "",
                  category: "",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                });
                onLostPageChange(1);
              }}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {lostLoading && safeLostItems.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lost items...</p>
        </div>
      )}

      {/* Empty State */}
      {!lostLoading && safeLostItems.length === 0 && !lostError && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No lost items found matching your filters.</p>
        </div>
      )}

      {/* Error State */}
      {!lostLoading && lostError && !safeLostItems.length && (
        <div className="text-center py-12 text-red-500">
          <p>{lostError}</p>
          <button
            onClick={() => {
              onLostPageChange(1);
              // Refetch logic would go here in a real implementation
            }}
            className="mt-4 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Items Table */}
      {!lostLoading && safeLostItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Lost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeLostItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    #{item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.category || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.color || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(item.date_lost).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {item.status === "active" ? "Active" : "Resolved"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={`${item.name} image`}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const newStatus = item.status === "active" ? "resolved" : "active";
                          onLostStatusChange(item.id, newStatus);
                        }}
                        className="px-3 py-1 bg-primary text-white text-xs hover:bg-primary/90 rounded"
                      >
                        {item.status === "active" ? "Resolve" : "Reopen"}
                      </button>
                      <button
                        onClick={() => onDeleteLost(item.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 text-xs hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center text-sm">
            <p className="text-muted-foreground">
              Showing {safeLostItems.length} of {lostTotal} items
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  lostPage > 1 && onLostPageChange(lostPage - 1)
                }
                disabled={lostPage <= 1}
                className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  (lostPage * pageSize) < lostTotal && onLostPageChange(lostPage + 1)
                }
                disabled={(lostPage * pageSize) >= lostTotal}
                className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Found Items Section Component
function FoundItemsSection({
  foundItems = [],
  foundLoading,
  foundError,
  foundFilters,
  onFoundFiltersChange,
  foundPage,
  foundTotal,
  pageSize,
  onFoundPageChange,
  onFoundStatusChange,
  onDeleteFound,
}: {
  foundItems?: FoundItem[];
  foundLoading: boolean;
  foundError: string | null;
  foundFilters: FoundItemFilters;
  onFoundFiltersChange: (filters: Partial<FoundItemFilters>) => void;
  foundPage: number;
  foundTotal: number;
  pageSize: number;
  onFoundPageChange: (page: number) => void;
  onFoundStatusChange: (itemId: number, newStatus: "unclaimed" | "claimed") => void;
  onDeleteFound: (itemId: number) => void;
}) {
  const safeFoundItems = foundItems ?? [];
  return (
    <div className="p-6 overflow-y-auto">
      {foundError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          {foundError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-4">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={foundFilters.status}
              onChange={(e) =>
                onFoundFiltersChange({ status: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={foundFilters.category}
              onChange={(e) =>
                onFoundFiltersChange({ category: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Keys">Keys</option>
              <option value="Wallet">Wallet</option>
              <option value="Bag">Bag</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Found From</label>
            <input
              type="date"
              value={foundFilters.dateFrom}
              onChange={(e) =>
                onFoundFiltersChange({ dateFrom: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date Found To</label>
            <input
              type="date"
              value={foundFilters.dateTo}
              onChange={(e) =>
                onFoundFiltersChange({ dateTo: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, description, location..."
              value={foundFilters.search}
              onChange={(e) =>
                onFoundFiltersChange({ search: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                onFoundFiltersChange({
                  status: "",
                  category: "",
                  dateFrom: "",
                  dateTo: "",
                  search: "",
                });
                onFoundPageChange(1);
              }}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {foundLoading && safeFoundItems.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading found items...</p>
        </div>
      )}

      {/* Empty State */}
      {!foundLoading && safeFoundItems.length === 0 && !foundError && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No found items found matching your filters.</p>
        </div>
      )}

      {/* Error State */}
      {!foundLoading && foundError && !safeFoundItems.length && (
        <div className="text-center py-12 text-red-500">
          <p>{foundError}</p>
          <button
            onClick={() => {
              onFoundPageChange(1);
              // Refetch logic would go here in a real implementation
            }}
            className="mt-4 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Items Table */}
      {!foundLoading && safeFoundItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Found
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeFoundItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    #{item.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.category || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.color || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(item.date_found).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.status === "unclaimed"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {item.status === "unclaimed" ? "Unclaimed" : "Claimed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={`${item.name} image`}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const newStatus = item.status === "unclaimed" ? "claimed" : "unclaimed";
                          onFoundStatusChange(item.id, newStatus);
                        }}
                        className="px-3 py-1 bg-primary text-white text-xs hover:bg-primary/90 rounded"
                      >
                        {item.status === "unclaimed" ? "Mark as Claimed" : "Mark as Unclaimed"}
                      </button>
                      <button
                        onClick={() => onDeleteFound(item.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 text-xs hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center text-sm">
            <p className="text-muted-foreground">
              Showing {safeFoundItems.length} of {foundTotal} items
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  foundPage > 1 && onFoundPageChange(foundPage - 1)
                }
                disabled={foundPage <= 1}
                className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  (foundPage * pageSize) < foundTotal && onFoundPageChange(foundPage + 1)
                }
                disabled={(foundPage * pageSize) >= foundTotal}
                className="px-3 py-1 bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Button component (simple version)
function Button({
  children,
  onClick,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline";
  className?: string;
}) {
  const baseClasses = "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}