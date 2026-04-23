"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MasterDbPage() {
  const router = useRouter();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/');
      return;
    }

    // quick role check from token
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        const role = payload.role || payload.roles || 'player';
        if (!(role === 'master' || role === 'admin')) {
          router.push('/dashboard');
          return;
        }
      }
    } catch (e) {
      // ignore and proceed to fetch (backend will enforce)
    }

    const headers = { Authorization: `Bearer ${token}` };

    // wrap fetches individually so a single network error doesn't reject the whole Promise.all
    const safeFetchJson = (url, opts, fallback = []) => fetch(url, opts).then(r => r.ok ? r.json() : fallback).catch(err => {
      console.debug('[MasterDb] fetch failed for', url, err && err.message);
      return fallback;
    });

  const pFeatures = safeFetchJson('http://localhost:3001/features', { headers });
  const pClasses = safeFetchJson('http://localhost:3001/templates/classes', { headers });
  const pOrigins = safeFetchJson('http://localhost:3001/templates/origins', { headers });
  const pRituals = safeFetchJson('http://localhost:3001/rituals', { headers });
    const pItems = safeFetchJson('http://localhost:3001/items?search=', { headers });
    const pProtections = safeFetchJson('http://localhost:3001/protections/templates', { headers }, { templates: [] });
    const pUsers = safeFetchJson('http://localhost:3001/users', { headers });

    Promise.all([pFeatures, pClasses, pOrigins, pRituals, pItems, pProtections, pUsers])
      .then(async ([features, classes, origins, rituals, items, protectionsResp, users]) => {
        const periciasCount = (features || []).filter(f => (f.type || '').toLowerCase() === 'pericia').length;
        const habilidadesCount = (features || []).filter(f => (f.type || '').toLowerCase() === 'habilidade').length;

        // trails: fetch per-class trails and sum
        let trailsCount = 0;
        try {
          const trailsPromises = (classes || []).map(c => fetch(`http://localhost:3001/templates/trails/${c.id}`).then(r => r.ok ? r.json() : []));
          const trailsByClass = await Promise.all(trailsPromises);
          trailsCount = trailsByClass.reduce((s, arr) => s + (arr ? arr.length : 0), 0);
        } catch (e) {
          trailsCount = 0;
        }

        setCounts({
          usuarios: (users || []).length,
          pericias: periciasCount,
          habilidades: habilidadesCount,
          origens: (origins || []).length,
          classes: (classes || []).length,
          trilhas: trailsCount,
          itens: (items || []).length,
          protecoes: (protectionsResp && protectionsResp.templates ? protectionsResp.templates.length : 0),
          rituais: (rituals || []).length
        });
      })
      .catch(err => {
        console.error('Erro ao carregar contagens do painel admin', err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const cards = [
    { key: 'usuarios', title: 'Usuários', icon: '👥', route: '/master/db/usuarios' },
    { key: 'pericias', title: 'Perícias', icon: '🎯', route: '/master/db/pericias' },
    { key: 'habilidades', title: 'Habilidades', icon: '✨', route: '/master/db/habilidades' },
    { key: 'origens', title: 'Origens', icon: '🌱', route: '/master/db/origens' },
    { key: 'classes', title: 'Classes', icon: '🏷️', route: '/master/db/classes' },
    { key: 'trilhas', title: 'Trilhas', icon: '🛤️', route: '/master/db/trilhas' },
    { key: 'itens', title: 'Itens', icon: '🎒', route: '/master/db/itens' },
    { key: 'protecoes', title: 'Proteções', icon: '🛡️', route: '/master/db/protecoes' },
    { key: 'rituais', title: 'Rituais', icon: '🔮', route: '/master/db/rituais' }
  ];

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Painel de Gestão do Banco de Dados</h2>
            <p className="text-xs text-gray-400">Visão geral — clique em um card para gerenciar cada tópico</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={async () => {
              const token = localStorage.getItem('token');
              if (!token) return alert('Autentique-se');
              try {
                const res = await fetch('http://localhost:3001/admin/export', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const now = new Date();
                const name = `ficha-oprpg-export-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}.json`;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
                alert('Erro ao exportar: ' + (e.message || e));
              }
            }} className="px-3 py-1 bg-blue-600/80 rounded text-sm">Exportar DB</button>

            <label className="px-3 py-1 border rounded cursor-pointer text-sm bg-white/5">
              Importar
              <input type="file" accept="application/json" onChange={async (ev) => {
                const file = ev.target.files && ev.target.files[0];
                if (!file) return;
                const text = await file.text();
                let json = null;
                try { json = JSON.parse(text); } catch (e) { alert('Arquivo inválido'); return; }
                const token = localStorage.getItem('token');
                if (!token) return alert('Autentique-se');
                try {
                  const res = await fetch('http://localhost:3001/admin/import', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
                  if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
                  const j = await res.json();
                  alert('Import concluído: ' + JSON.stringify(j.results || j));
                  // refresh counts
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  alert('Erro ao importar: ' + (e.message || e));
                }
              }} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.key} href={c.route} className="block">
            <div className="p-4 border border-white/10 rounded-lg hover:shadow-md transition bg-white/3 h-full">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{c.icon}</div>
                <div>
                  <div className="text-sm text-gray-300">{c.title}</div>
                  <div className="text-2xl font-bold">
                    {loading ? '…' : (counts[c.key] === null ? '—' : (typeof counts[c.key] === 'number' ? counts[c.key] : '-'))}
                  </div>
                  {c.note && <div className="text-xs text-yellow-300 mt-1">{c.note}</div>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
