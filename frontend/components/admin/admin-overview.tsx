"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Users, ShieldCheck, Bot, Building, List } from "lucide-react";

function getInitialReducedMotion(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useReducedMotion(): boolean {
    const [reduced, setReduced] = useState(getInitialReducedMotion);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = (event: MediaQueryListEvent) => {
            setReduced(event.matches);
        };

        mq.addEventListener("change", handleChange);

        return () => {
            mq.removeEventListener("change", handleChange);
        };
    }, []);

    return reduced;
}

function useCountUp(target: number | null, delayMs = 0): number {
    const [value, setValue] = useState(0);
    const raf = useRef<number>(0);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (target === null || reducedMotion) {
            return;
        }

        const targetValue = target;
        const timeoutId = window.setTimeout(() => {
            const start = performance.now();
            const duration = 850;

            function tick(now: number) {
                const t = Math.min((now - start) / duration, 1);

                setValue(Math.round((1 - (1 - t) ** 4) * targetValue));

                if (t < 1) {
                    raf.current = requestAnimationFrame(tick);
                }
            }

            raf.current = requestAnimationFrame(tick);
        }, delayMs);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(raf.current);
        };
    }, [target, delayMs, reducedMotion]);

    if (target === null) {
        return value;
    }

    return reducedMotion ? target : value;
}

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: number | null;
    textCls: string;
    iconBgCls: string;
    delay: number;
}

function StatCard({
                      icon,
                      label,
                      value,
                      textCls,
                      iconBgCls,
                      delay,
                  }: StatCardProps) {
    const count = useCountUp(value, delay);
    const reducedMotion = useReducedMotion();

    return (
        <div
            className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
            style={
                reducedMotion
                    ? undefined
                    : {
                        animation: `dov-fade-up 420ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
                    }
            }
        >
            <div className={`mb-4 inline-flex rounded-xl p-2.5 ${iconBgCls}`}>
                <span className={textCls}>{icon}</span>
            </div>

            <div className={`text-3xl font-semibold tabular-nums leading-none ${textCls}`}>
                {value === null ? (
                    <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-muted" />
                ) : (
                    count.toLocaleString()
                )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

interface UserStatsProps {
    users: any[]; // We'll type this properly when we have the User type imported
}

export function AdminOverview({ users }: { users: any[] }) {
    const reducedMotion = useReducedMotion();

    // Calculate stats from users array
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === "admin").length;
    const staffUsers = users.filter(u => u.role === "staff").length;
    const studentUsers = users.filter(u => u.role === "student").length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;

    return (
        <>
            <style>{`
                @keyframes dov-fade-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
            `}</style>

            <div className="relative z-0 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <StatCard
                        icon={<Users size={18} />}
                        label="Total Users"
                        value={totalUsers}
                        textCls="text-blue-500"
                        iconBgCls="bg-blue-500/10"
                        delay={0}
                    />

                    <StatCard
                        icon={<ShieldCheck size={18} />}
                        label="Admins"
                        value={adminUsers}
                        textCls="text-purple-500"
                        iconBgCls="bg-purple-500/10"
                        delay={80}
                    />

                    <StatCard
                        icon={<Bot size={18} />}
                        label="Staff"
                        value={staffUsers}
                        textCls="text-green-500"
                        iconBgCls="bg-green-500/10"
                        delay={160}
                    />

                    <StatCard
                        icon={<Building size={18} />}
                        label="Students"
                        value={studentUsers}
                        textCls="text-orange-500"
                        iconBgCls="bg-orange-500/10"
                        delay={240}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                        className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
                        style={
                            reducedMotion
                                ? undefined
                                : {
                                    animation:
                                        "dov-fade-up 420ms cubic-bezier(0.23,1,0.32,1) 320ms both",
                                }
                        }
                    >
                        <h2 className="mb-5 text-base font-medium">User Status</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-foreground">Active Users</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {activeUsers.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-foreground">Inactive Users</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {inactiveUsers.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-0.5 bg-border/50 my-4" />
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Active users can log in
                                </span>
                            </div>
                            <div className="flex items-center mt-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    Inactive users cannot log in
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
                        style={
                            reducedMotion
                                ? undefined
                                : {
                                    animation:
                                        "dov-fade-up 420ms cubic-bezier(0.23,1,0.32,1) 400ms both",
                                }
                        }
                    >
                        <h2 className="mb-5 text-base font-medium">User Management</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            As an admin, you can:
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-3">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                <span>
                                    View all users in the system
                                </span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                <span>
                                    Activate/deactivate user accounts
                                </span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                <span>
                                    Change user roles (student/staff/admin)
                                </span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1" />
                                <span>
                                    Reset user passwords if needed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}