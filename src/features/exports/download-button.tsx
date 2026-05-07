"use client";

import { useState } from "react";

type DownloadType = "latest-week" | "current-period";

interface DownloadButtonProps {
  type: DownloadType;
  title: string;
  subtitle: string;
}

export function DownloadButton({ type, title, subtitle }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exports/results?type=${type}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+?)"/);
      a.download = match ? match[1] : `${type}.xlsx`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-[26px] border border-brand-line bg-surface-strong p-5 shadow-sm transition-colors hover:bg-brand-wash disabled:opacity-60 disabled:cursor-not-allowed text-left w-full"
    >
      <p className="font-semibold text-brand-deep">
        {loading ? "Downloading…" : title}
      </p>
      <p className="mt-1 text-sm text-[rgba(25,52,31,0.7)]">{subtitle}</p>
    </button>
  );
}
