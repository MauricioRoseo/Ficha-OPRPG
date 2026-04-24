"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PericiasAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // selected feature for detail view
  const [selected, setSelected] = useState(null);
  // editing mode inside detail pane
  const [isEditing, setIsEditing] = useState(false);
  // creating flag
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', metadata: {}, has_encumbrance_penalty: false, encumbrance_penalty: 0 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if (!token) { router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/features/search?type=pericia', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao buscar perícias');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar perícias'); }
    finally{ setLoading(false); }
  };

  const handleCreate = async ()=>{
    if (!form.name) { alert('Preencha o nome'); return; }
    try{
      const payload = {
        name: form.name,
        type: 'pericia',
        description: form.description || null,
        metadata: form.metadata || {},
        has_encumbrance_penalty: form.has_encumbrance_penalty ? 1 : 0,
        encumbrance_penalty: form.has_encumbrance_penalty ? (Number(form.encumbrance_penalty) || 0) : null
      };
      const res = await fetch('http://localhost:3001/features', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Perícia criada');
  setForm({ name: '', description: '', metadata: {}, has_encumbrance_penalty: false, encumbrance_penalty: 0 });
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar perícia'); }
  };

  const startEdit = (it)=>{
    setSelected(it);
    setIsEditing(true);
    setCreating(false);
  setForm({ name: it.name || '', description: it.description || '', metadata: it.metadata || {}, has_encumbrance_penalty: !!it.has_encumbrance_penalty, encumbrance_penalty: it.encumbrance_penalty || 0 });
  };
  const cancelEdit = ()=>{ setIsEditing(false); setCreating(false); setForm({ name: '', description: '', metadata: {}, has_encumbrance_penalty: false, encumbrance_penalty: 0 }); };

  const handleUpdate = async ()=>{
    try{
      const payload = {
        name: form.name,
        type: 'pericia',
        description: form.description || null,
        metadata: form.metadata || {},
        has_encumbrance_penalty: form.has_encumbrance_penalty ? 1 : 0,
        encumbrance_penalty: form.has_encumbrance_penalty ? (Number(form.encumbrance_penalty) || 0) : null
      };
      if (!selected || !selected.id) throw new Error('Nenhuma perícia selecionada');
      const res = await fetch(`http://localhost:3001/features/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Perícia atualizada');
      cancelEdit();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar perícia'); }
  };

  const handleDelete = async (id)=>{
    if (!confirm('Remover perícia?')) return;
    try{
      const res = await fetch(`http://localhost:3001/features/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Perícia removida');
      // if deleted item was selected, clear selection
      if (selected && selected.id === id) setSelected(null);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover perícia'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Perícias</h2>
            <p className="text-xs text-gray-400">Criar, editar ou excluir perícias do sistema</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm">Voltar ao Painel DB</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: cards list */}
        <div className="md:col-span-2 surface-block p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Perícias</h3>
            <div>
              <button onClick={()=>{ setSelected(null); setCreating(true); setIsEditing(false); setForm({ name: '', description: '', metadata: {}, has_encumbrance_penalty: false, encumbrance_penalty: 0 }); }} className="px-3 py-1 bg-blue-600/80 rounded text-sm">Criar nova</button>
            </div>
          </div>

          {loading ? <div>Carregando...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(i => (
                <div key={i.id} onClick={()=>{ setSelected(i); setIsEditing(false); setCreating(false); }} className="p-3 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-semibold">{i.name}</div>
                      
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details / create / edit panel */}
        <div className="md:col-span-1 surface-block p-4">
          {selected ? (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Detalhes da Perícia</h3>
                <div>
                  <button onClick={()=>{ setIsEditing(true); setCreating(false); startEdit(selected); }} className="px-2 py-1 mr-2 border rounded text-xs">Editar</button>
                  <button onClick={()=>handleDelete(selected.id)} className="px-2 py-1 bg-red-600/60 rounded text-xs">Remover</button>
                </div>
              </div>

              {!isEditing ? (
                  <div className="mt-4 space-y-2 text-sm">
                  <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
                  <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200" style={{whiteSpace: 'pre-wrap'}}>{selected.description || '—'}</div></div>
                  <div><span className="text-gray-400">Penalidade de carga: </span>{selected.has_encumbrance_penalty ? selected.encumbrance_penalty || 'Sim' : 'Não'}</div>
                  <div><span className="text-gray-400">Metadata: </span><pre className="text-xs mt-1 bg-[#021018] p-2 rounded text-gray-200">{JSON.stringify(selected.metadata || {}, null, 2)}</pre></div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  
                  <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.has_encumbrance_penalty} onChange={e=>setForm(f=>({...f, has_encumbrance_penalty: e.target.checked}))} /> Penalidade de carga</label>
                    {form.has_encumbrance_penalty && (
                      <input type="number" value={form.encumbrance_penalty} onChange={e=>setForm(f=>({...f, encumbrance_penalty: e.target.value}))} className="w-24 p-2 rounded bg-[#021018] border border-white/6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Metadata (JSON)</div>
                    <textarea value={JSON.stringify(form.metadata || {}, null, 2)} onChange={e=>{
                      try{ const v = JSON.parse(e.target.value); setForm(f=>({...f, metadata: v})); }catch(err){ /* ignore parse error until save */ setForm(f=>({...f, metadata: e.target.value})); }
                    }} className="w-full p-2 rounded bg-[#021018] border border-white/6 text-xs" rows={6} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleUpdate} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
                    <button onClick={cancelEdit} className="px-3 py-1 border rounded">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-bold">Criar nova Perícia</h3>
              <div className="mt-3 space-y-2">
                <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                
                <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.has_encumbrance_penalty} onChange={e=>setForm(f=>({...f, has_encumbrance_penalty: e.target.checked}))} /> Penalidade de carga</label>
                  {form.has_encumbrance_penalty && (
                    <input type="number" value={form.encumbrance_penalty} onChange={e=>setForm(f=>({...f, encumbrance_penalty: e.target.value}))} className="w-24 p-2 rounded bg-[#021018] border border-white/6" />
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Metadata (JSON)</div>
                  <textarea value={JSON.stringify(form.metadata || {}, null, 2)} onChange={e=>{
                    try{ const v = JSON.parse(e.target.value); setForm(f=>({...f, metadata: v})); }catch(err){ setForm(f=>({...f, metadata: e.target.value})); }
                  }} className="w-full p-2 rounded bg-[#021018] border border-white/6 text-xs" rows={6} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreate} className="px-3 py-1 bg-green-600/80 rounded">Criar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
