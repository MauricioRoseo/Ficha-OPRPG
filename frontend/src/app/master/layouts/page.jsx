"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MasterLayouts() {
  const [layouts, setLayouts] = useState([]);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const fetchLayouts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/layouts', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao buscar layouts');
      const all = await res.json();
      setLayouts(all || []);
    } catch (e) { console.error(e); setLayouts([]); }
  };

  useEffect(() => { fetchLayouts(); }, []);

  const createLayout = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setStatus('criando...');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    try {
      const res = await fetch('http://localhost:3001/layouts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, slug, is_public: isPublic ? 1 : 0 }) });
      if (!res.ok) {
        const b = await res.json().catch(()=>({}));
        throw new Error(b.message || 'Erro criar');
      }
      await fetchLayouts();
      setTitle(''); setIsPublic(false); setStatus('');
    } catch (e) { alert(e.message || 'Erro'); setStatus(''); }
  };

  const goToEdit = (id) => { router.push(`/master/layouts/${id}`); };

  const goToPublic = (slug) => { window.open(`/layouts/${slug}`, '_blank'); };

  return (
    <div className="p-6">
      <h2 className="text-lg mb-4">Layouts</h2>
      <div className="mb-4 p-4 border rounded">
        <div className="grid grid-cols-3 gap-2 items-end">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título do layout" className="p-2 bg-transparent border border-white/10 rounded col-span-2" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} /> Público</label>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={createLayout} className="px-3 py-1 bg-green-600 rounded text-sm">Criar layout</button>
        </div>
      </div>

      {layouts.length === 0 ? (
        <div>Nenhum layout ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {layouts.map(l => (
            <div key={l.id} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-sm text-gray-400">{l.is_public ? 'Público' : 'Privado'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>goToPublic(l.slug)} className="px-2 py-1 border rounded text-sm">Abrir público</button>
                <button onClick={()=>goToEdit(l.id)} className="px-2 py-1 border rounded text-sm">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
