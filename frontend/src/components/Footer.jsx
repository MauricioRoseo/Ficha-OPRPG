"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // hide footer on login page
  if (pathname === "/") return null;

  return (
    <footer style={{ background: 'var(--surface)', color: 'var(--foreground)' }} className="mt-6 text-center text-xs">
      <div className="flex justify-center py-4">
        <div className="w-[85%] h-px" style={{ background: 'rgba(230,238,246,0.12)' }} />
      </div>
    </footer>
  );
}
