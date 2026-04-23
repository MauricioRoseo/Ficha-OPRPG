"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function Modal({ open, onClose, title, children }){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-[#071018] border border-white/10 rounded-lg p-6 w-full max-w-2xl z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded text-sm">Fechar</button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HabilidadesAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', origin: '', metadata: {} });
  const [metaText, setMetaText] = useState('{}');
  const [metaValid, setMetaValid] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/features/search?type=habilidade', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar habilidades');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar habilidades'); }
    finally{ setLoading(false); }
  };

  const openDetail = (it)=>{
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setMetaText(JSON.stringify(it.metadata || {}, null, 2));
  setForm({ name: it.name || '', description: it.description || '', origin: it.origin || '', metadata: it.metadata || {} });
  };

  const closeDetail = ()=>{
    setDetailOpen(false);
    setSelected(null);
    setEditing(false);
  };

  const handleDelete = async (id)=>{
    if(!confirm('Remover habilidade?')) return;
    try{
      const res = await fetch(`http://localhost:3001/features/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Habilidade removida');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover habilidade'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
  setForm({ name: '', description: '', origin: '', metadata: {} });
    setMetaText('{}');
    setMetaValid(true);
  };

  const handleCreate = async ()=>{
    if(!form.name) { alert('Preencha o nome'); return; }
    if(!metaValid) { alert('Corrija o JSON de metadata antes de salvar'); return; }
    try{
      const payload = {
        name: form.name,
        type: 'habilidade',
        description: form.description || null,
        origin: form.origin || null,
        metadata: form.metadata || {}
      };
      const res = await fetch('http://localhost:3001/features', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Habilidade criada');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar habilidade'); }
  };

  const startEdit = ()=>{
    setEditing(true);
    setMetaText(JSON.stringify(form.metadata || {}, null, 2));
  };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name) { alert('Preencha o nome'); return; }
    if(!metaValid) { alert('Corrija o JSON de metadata antes de salvar'); return; }
    try{
      const payload = {
        name: form.name,
        type: 'habilidade',
        description: form.description || null,
        origin: form.origin || null,
        metadata: form.metadata || {}
      };
      const res = await fetch(`http://localhost:3001/features/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Habilidade atualizada');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar habilidade'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Habilidades</h2>
            <p className="text-xs text-gray-400">Gerencie habilidades do sistema</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Habilidade</button>
          </div>
        </div>
      </div>

      <div className="surface-block p-4">
        <h3 className="font-bold mb-3">Lista de Habilidades</h3>
        {loading ? <div>Carregando...</div> : (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="flex items-center justify-between p-3 border border-white/6 rounded-lg">
                <div className="flex items-center gap-3 cursor-pointer" onClick={()=>openDetail(it)}>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-gray-400">{it.origin || '—'}</div>
                </div>
                <div>
                  <button onClick={()=>handleDelete(it.id)} className="px-2 py-1 bg-red-600/60 rounded text-xs">Remover</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Habilidade: ${selected.name}` : 'Habilidade'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Origem: </span>{selected.origin || '—'}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Metadata: </span><pre className="text-xs mt-1 bg-[#021018] p-2 rounded text-gray-200">{JSON.stringify(selected.metadata || {}, null, 2)}</pre></div>
            
            <div className="flex gap-2">
              <button onClick={startEdit} className="px-3 py-1 bg-blue-600/80 rounded">Editar</button>
              <button onClick={()=>handleDelete(selected.id)} className="px-3 py-1 bg-red-600/60 rounded">Remover</button>
            </div>
          </div>
        )}

        {selected && editing && (
          <div className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Origem" value={form.origin} onChange={e=>setForm(f=>({...f, origin: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            
            <div>
              <div className="text-xs text-gray-400 mb-1">Metadata (JSON)</div>
              <textarea value={metaText} onChange={e=>{
                const v = e.target.value; setMetaText(v);
                try{ const parsed = JSON.parse(v); setForm(f=>({...f, metadata: parsed})); setMetaValid(true); }catch(err){ setMetaValid(false); }
              }} className="w-full p-2 rounded bg-[#021018] border border-white/6 text-xs" rows={6} />
              {!metaValid && <div className="text-xs text-red-400 mt-1">JSON inválido</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setMetaText(JSON.stringify(selected.metadata || {}, null, 2)); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Habilidade">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <input placeholder="Origem" value={form.origin} onChange={e=>setForm(f=>({...f, origin: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          
          <div>
            <div className="text-xs text-gray-400 mb-1">Metadata (JSON)</div>
            <textarea value={metaText} onChange={e=>{
              const v = e.target.value; setMetaText(v);
              try{ const parsed = JSON.parse(v); setForm(f=>({...f, metadata: parsed})); setMetaValid(true); }catch(err){ setMetaValid(false); }
            }} className="w-full p-2 rounded bg-[#021018] border border-white/6 text-xs" rows={6} />
            {!metaValid && <div className="text-xs text-red-400 mt-1">JSON inválido</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1 bg-green-600/80 rounded">Criar</button>
            <button onClick={()=>setCreatingOpen(false)} className="px-3 py-1 border rounded">Cancelar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
