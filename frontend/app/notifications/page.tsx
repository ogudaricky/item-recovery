"use client";

import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/layout/top-nav";
import { listNotifications, markNotificationRead } from "@/lib/notifications";
import type { AppNotification } from "@/types/notifications";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Loading your notifications...");

  async function loadNotifications(unreadOnly: boolean) {
    setLoading(true);
    setMessage("Loading your notifications...");
    try {
      const rows = await listNotifications({ unread: unreadOnly });
      setNotifications(rows);
      setMessage(`Loaded ${rows.length} notifications.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not load notifications. ${text}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications(showUnreadOnly);
  }, [showUnreadOnly]);

  async function handleMarkRead(id: number) {
    setLoading(true);
    setMessage("Saving your update...");
    try {
      const updated = await markNotificationRead(id);
      setNotifications((previous) =>
          previous.map((notification) =>
              notification.id === id ? updated : notification,
          ),
      );
      if (showUnreadOnly) {
        setNotifications((previous) => previous.filter((item) => !item.is_read));
      }
      setMessage("Notification marked as reviewed.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not update this notification. ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10 lg:pl-[240px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,_#8686AC22,_transparent_44%),radial-gradient(circle_at_92%_90%,_#2727571C,_transparent_50%)]" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
          <AppSidebar />
          <header className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-semibold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Review updates about possible matches and claims.
            </p>
          </header>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(event) => setShowUnreadOnly(event.target.checked)}
                />
                Show unread only
              </label>
              <button
                  type="button"
                  className="rounded-lg border border-border/80 bg-background/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                  onClick={() => void loadNotifications(showUnreadOnly)}
                  disabled={loading}
              >
                Refresh
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-base font-medium">Your Notifications</h2>
            {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications to show.</p>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Message</th>
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Read</th>
                      <th className="py-2 font-medium">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {notifications.map((notification) => (
                        <tr key={notification.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">{notification.message}</td>
                          <td className="py-2 pr-3">{formatDate(notification.created_at)}</td>
                          <td className="py-2 pr-3">{notification.is_read ? "Yes" : "No"}</td>
                          <td className="py-2">
                            {notification.is_read ? (
                                <span className="text-xs text-muted-foreground">No action</span>
                            ) : (
                                <button
                                    type="button"
                                    className="rounded-md border border-border/80 bg-background/70 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                                    onClick={() => void handleMarkRead(notification.id)}
                                    disabled={loading}
                                >
                                  Mark as read
                                </button>
                            )}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        </div>
      </main>
  );
}