"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, PackageCheck, PackageX } from "lucide-react";


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

function useChartProgress(ready: boolean, delayMs = 420): number {
    const [progress, setProgress] = useState(0);
    const raf = useRef<number>(0);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ready || reducedMotion) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const start = performance.now();
            const duration = 1100;

            function tick(now: number) {
                const t = Math.min((now - start) / duration, 1);

                setProgress(1 - (1 - t) ** 3);

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
    }, [ready, delayMs, reducedMotion]);

    return ready && reducedMotion ? 1 : progress;
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

interface DonutChartProps {
    lost: number;
    found: number;
    progress: number;
    size?: number;
}

function DonutChart({ lost, found, progress, size = 156 }: DonutChartProps) {
    const radius = (size - 32) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const circumference = 2 * Math.PI * radius;
    const total = lost + found;

    const lostFraction = total > 0 ? lost / total : 0;
    const foundFraction = total > 0 ? found / total : 0;

    const lostLength = progress * lostFraction * circumference;
    const foundLength = progress * foundFraction * circumference;

    const topOffset = circumference / 4;
    const gap = total > 0 && lost > 0 && found > 0 ? 3 : 0;

    return (
        <div className="flex shrink-0 items-center justify-center">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                aria-label={`Donut chart: ${lost} lost, ${found} found`}
                role="img"
            >
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill="none"
                    strokeWidth={10}
                    className="stroke-border/30"
                />

                {lostLength > 0 && (
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill="none"
                        strokeWidth={13}
                        className="stroke-amber-500"
                        strokeLinecap="butt"
                        strokeDasharray={`${Math.max(0, lostLength - gap)} ${circumference}`}
                        strokeDashoffset={topOffset}
                    />
                )}

                {foundLength > 0 && (
                    <circle
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill="none"
                        strokeWidth={13}
                        className="stroke-emerald-500"
                        strokeLinecap="butt"
                        strokeDasharray={`${Math.max(0, foundLength - gap)} ${circumference}`}
                        strokeDashoffset={topOffset - lostLength}
                    />
                )}

                <text
                    x={centerX}
                    y={centerY - 7}
                    textAnchor="middle"
                    fontSize={20}
                    fontWeight={600}
                    className="fill-foreground"
                >
                    {total}
                </text>

                <text
                    x={centerX}
                    y={centerY + 12}
                    textAnchor="middle"
                    fontSize={10}
                    letterSpacing="0.07em"
                    className="fill-muted-foreground"
                >
                    TOTAL
                </text>
            </svg>
        </div>
    );
}

interface BarComparisonProps {
    lost: number;
    found: number;
    progress: number;
}

function BarComparison({ lost, found, progress }: BarComparisonProps) {
    const total = lost + found;

    const rows = [
        {
            label: "Lost",
            count: lost,
            pct: total > 0 ? (lost / total) * 100 : 0,
            barCls: "bg-amber-500",
            textCls: "text-amber-500",
            dotCls: "bg-amber-500",
        },
        {
            label: "Found",
            count: found,
            pct: total > 0 ? (found / total) * 100 : 0,
            barCls: "bg-emerald-500",
            textCls: "text-emerald-500",
            dotCls: "bg-emerald-500",
        },
    ] as const;

    return (
        <div className="w-full space-y-5">
            {rows.map((row) => (
                <div key={row.label}>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className={`inline-block h-2 w-2 rounded-full ${row.dotCls}`} />
                            {row.label}
                        </span>

                        <span className="tabular-nums text-muted-foreground">
                            {row.count.toLocaleString()}{" "}
                            <span className={`font-medium ${row.textCls}`}>
                                ({Math.round(row.pct)}%)
                            </span>
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-border/25">
                        <div
                            className={`h-full origin-left rounded-full ${row.barCls}`}
                            style={{
                                width: `${row.pct}%`,
                                transform: `scaleX(${progress})`,
                            }}
                        />
                    </div>
                </div>
            ))}

            {total > 0 && (
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-emerald-500">
                        {Math.round((found / total) * 100)}%
                    </span>
                    recovery rate — {found} of {total} items reported found
                </div>
            )}
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-39 w-39 shrink-0 animate-pulse rounded-full bg-muted/40" />

            <div className="w-full flex-1 space-y-4">
                {[1, 2].map((item) => (
                    <div key={item} className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-16 animate-pulse rounded-md bg-muted/40" />
                            <div className="h-4 w-20 animate-pulse rounded-md bg-muted/40" />
                        </div>

                        <div className="h-2 w-full animate-pulse rounded-full bg-muted/40" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export interface DashboardOverviewProps {
    lostCount: number | null;
    foundCount: number | null;
}

export function DashboardOverview({
                                      lostCount,
                                      foundCount,
                                  }: DashboardOverviewProps) {
    const reducedMotion = useReducedMotion();
    const ready = lostCount !== null && foundCount !== null;
    const chartProgress = useChartProgress(ready);

    const lost = lostCount ?? 0;
    const found = foundCount ?? 0;
    const total = lost + found;

    return (
        <>
            <style>{`
                @keyframes dov-fade-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
            `}</style>

            <div className="relative z-0 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={<PackageX size={18} />}
                    label="Lost reports"
                    value={lostCount}
                    textCls="text-amber-500"
                    iconBgCls="bg-amber-500/10"
                    delay={0}
                />

                <StatCard
                    icon={<PackageCheck size={18} />}
                    label="Found reports"
                    value={foundCount}
                    textCls="text-emerald-500"
                    iconBgCls="bg-emerald-500/10"
                    delay={80}
                />

                <StatCard
                    icon={<LayoutDashboard size={18} />}
                    label="Total reports"
                    value={ready ? total : null}
                    textCls="text-sky-500"
                    iconBgCls="bg-sky-500/10"
                    delay={160}
                />
                </div>

                <div
                    className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm"
                    style={
                        reducedMotion
                            ? undefined
                            : {
                                animation:
                                    "dov-fade-up 420ms cubic-bezier(0.23,1,0.32,1) 240ms both",
                            }
                    }
                >
                    <h2 className="mb-5 text-base font-medium">Reports Breakdown</h2>

                    {!ready ? (
                        <ChartSkeleton />
                    ) : total === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No reports yet — submit a lost or found report to see the breakdown.
                        </p>
                    ) : (
                        <div className="flex flex-col items-center gap-8 sm:flex-row">
                            <DonutChart lost={lost} found={found} progress={chartProgress} />
                            <BarComparison lost={lost} found={found} progress={chartProgress} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}