"use client";

import Link from "next/link";
import { useState, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/layout/top-nav";
import { createLostItem } from "@/lib/items";

const CATEGORY_OPTIONS = [
  "Documents",
  "Electronics",
  "Accessories",
  "Bags",
  "Clothing",
  "Other",
];

export default function ReportLostPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [color, setColor] = useState("");
  const [dateLost, setDateLost] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("Complete the form, then submit.");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("Sending your report...");
    try {
      await createLostItem({
        name,
        description,
        category,
        color,
        date_lost: dateLost,
        location,
        image,
      });
      setMessage("Your lost item report was submitted.");
      router.push("/dashboard");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage(`We could not submit your report. ${text}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_#8686AC22,_transparent_45%),radial-gradient(circle_at_88%_92%,_#2727571C,_transparent_50%)]" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AppSidebar />
      <header className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-semibold">Report Lost Item</h1>
        <p className="text-sm text-muted-foreground">
          Provide item details and location to help find possible matches.
        </p>
      </header>

      <form className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="name">
              Item name
            </label>
            <input
              id="name"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="color">
              Color
            </label>
            <input
              id="color"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="dateLost">
              Date lost
            </label>
            <input
              id="dateLost"
              type="date"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={dateLost}
              onChange={(event) => setDateLost(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="description">
              Extra details
            </label>
            <textarea
              id="description"
              className="min-h-24 w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="image">
              Photo
            </label>
            <input
              id="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              className="w-full rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImage(file);
              }}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm transition-opacity disabled:opacity-60"
            disabled={submitting}
          >
            Submit report
          </button>
          <Link href="/dashboard" className="rounded-lg border border-border/80 bg-background/70 px-4 py-2 text-sm transition-colors hover:border-primary/40 hover:text-primary">
            Cancel
          </Link>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
