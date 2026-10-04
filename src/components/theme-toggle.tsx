"use client";

import Icon from "@/components/icon";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      title="Toggle light / dark"
      className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-ink/10 bg-surface text-ink/70 shadow-card transition hover:text-ink ${className}`}
    >
      <Icon name="moon" className="theme-moon h-[18px] w-[18px]" />
      <Icon name="sun" className="theme-sun h-[18px] w-[18px]" />
    </button>
  );
}
