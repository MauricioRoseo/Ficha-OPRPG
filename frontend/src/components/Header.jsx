"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  // read token only on client after hydration to avoid SSR/CSR mismatch
  // keep initial name as empty string so server and client initial HTML match
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // prefer fetching user info from backend (works even if token payload is minimal)
    fetch('http://localhost:3001/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(async (res) => {
      if (!res.ok) {
        // fallback: try decode token payload
        try {
          const p = token.split('.')[1];
          const payload = JSON.parse(atob(p));
          setName(payload.name || payload.email || '');
        } catch {
          // ignore
        }
        return;
      }

      const data = await res.json();
      setName(data.name || data.email || '');
    }).catch(() => {
      // on error fallback to token decode
      try {
        const p = token.split('.')[1];
        const payload = JSON.parse(atob(p));
        setName(payload.name || payload.email || '');
      } catch {
        // ignore
      }
    });
  }, []);

  // don't render header on the public login root page
  if (pathname === "/") return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="surface-block">
      <header className="flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-4">
          <h1 className="logo-special text-2xl tracking-wider">FICHA OPRPG</h1>
          <p className="text-red-500 text-sm">ARQUIVOS CONFIDENCIAIS</p>
        </div>

        <div className="relative">
          <div className="text-right">
            {/** use the same fallback string to keep SSR/CSR output identical until hydration updates the name */}
            <p className="text-xs text-gray-400">{name || 'AGENTE'}</p>
            <button onClick={() => setOpen(s => !s)} className="underline text-sm text-gray-200">{name || 'AGENTE'}</button>
          </div>

          {open && (
            <div className="absolute right-0 mt-2 w-44 z-50" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.5rem', borderRadius: '6px', zIndex: 9999 }}>
              <button onClick={handleLogout} className="w-full text-left text-xs py-1 text-red-500 hover:bg-neutral-800 transition px-2">Encerrar sessão</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex justify-center">
        <div className="w-[85%] h-px" style={{ background: 'rgba(223,239,248,0.12)' }} />
      </div>
    </div>
  );
}
