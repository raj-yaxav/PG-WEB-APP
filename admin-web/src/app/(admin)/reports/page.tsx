"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/complaints?view=reports");
  }, [router]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm font-semibold text-slate-600 shadow-[8px_10px_24px_rgba(30,64,175,0.08)]">
      Opening manager reports...
    </div>
  );
}
