"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditLayout(){
  const params = useParams();
  const id = params?.id;
  const [layout, setLayout] = useState(null);
  const [available, setAvailable] = useState([]);
  const [chars, setChars] = useState([]);
  const router = useRouter();

  const fetchLayout = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // get layout info via /layouts (creator list) then use id to fetch characters for it via backend layout service
      const res = await fetch(`http://localhost:3001/layouts`, { headers: { Authorization: `Bearer ${token}` } });
      const list = await res.json();
      const found = (list || []).find(x => String(x.id) === String(id));
      setLayout(found || null);
    } catch (e) { console.error(e); }
  };

  const fetchAvailableChars = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/characters', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAvailable(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchLayoutDetails = async () => {
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/layouts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('fetchLayoutDetails failed', res.status);
        return;
      }
      const data = await res.json();
      setChars(data.characters || []);
      // update layout in case of changed metadata
      setLayout(data.layout || layout);
    } catch(e){ console.error(e); }
  };

  useEffect(()=>{ fetchLayout(); fetchAvailableChars(); }, []);
  useEffect(()=>{ if (layout) fetchLayoutDetails(); }, [layout]);

  const addChar = async (characterId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/layouts/${id}/characters`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ character_id: characterId }) });
    if (!res.ok) { alert('Erro ao adicionar'); return; }
    await fetchLayoutDetails();
  };

  const removeChar = async (characterId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/layouts/${id}/characters/${characterId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert('Erro ao remover'); return; }
    await fetchLayoutDetails();
  };

  const deleteLayout = async () => {
    if (!confirm('Excluir layout?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/layouts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert('Erro ao excluir'); return; }
    router.push('/master/layouts');
  };

  return (
    <div className="p-6">
      <h2 className="text-lg mb-4">Editar Layout</h2>
      {!layout ? <div>Carregando...</div> : (
        <div>
          <div className="mb-4">
            <div className="font-semibold">{layout.title}</div>
            <div className="text-sm text-gray-400">Slug público: /layouts/{layout.slug}</div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">Personagens no layout</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {chars.map(c=> (
                <div key={c.id} className="p-2 border rounded">
                  <div className="font-semibold">{c.name}</div>
                  <div className="mt-2">
                    <button onClick={()=>removeChar(c.id)} className="text-red-500 text-sm">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">Adicionar personagem</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {available.map(a=> (
                <div key={a.id} className="p-2 border rounded flex items-center justify-between">
                  <div className="text-sm">{a.name}</div>
                  <button onClick={()=>addChar(a.id)} className="px-2 py-1 border rounded text-sm">Adicionar</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button onClick={deleteLayout} className="px-3 py-1 bg-red-600 rounded text-sm">Excluir layout</button>
          </div>
        </div>
      )}
    </div>
  );
}
