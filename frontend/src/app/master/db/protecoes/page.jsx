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

export default function ProtectionsAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', passive_defense: 0, damage_resistance: 0, encumbrance_penalty: 0, default_equipped: false, metadata: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/protections/templates', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar proteções');
      const data = await res.json();
      setItems((data && data.templates) || []);
    }catch(e){ console.error(e); alert('Erro ao carregar proteções'); }
    finally{ setLoading(false); }
  };

  const openDetail = (it) => {
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setForm({ name: it.name || '', description: it.description || '', passive_defense: it.passive_defense || 0, damage_resistance: it.damage_resistance || 0, encumbrance_penalty: it.encumbrance_penalty || 0, default_equipped: it.default_equipped ? true : false, metadata: it.metadata ? (typeof it.metadata === 'string' ? it.metadata : JSON.stringify(it.metadata)) : '' });
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id) => {
    if(!confirm('Remover proteção?')) return;
    try{
      const res = await fetch(`http://localhost:3001/protections/templates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Proteção removida');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover proteção'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', description: '', passive_defense: 0, damage_resistance: 0, encumbrance_penalty: 0, default_equipped: false, metadata: '' });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      try{ payload.metadata = form.metadata ? JSON.parse(form.metadata) : null; }catch(e){ /* leave string */ }
      const res = await fetch('http://localhost:3001/protections/templates', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Proteção criada');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar proteção'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      try{ payload.metadata = form.metadata ? JSON.parse(form.metadata) : null; }catch(e){ }
      const res = await fetch(`http://localhost:3001/protections/templates/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Proteção atualizada');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar proteção'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Proteções</h2>
            <p className="text-xs text-gray-400">Gerencie templates de proteção (defesa passiva, resistência a dano, penalidade de carga)</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Proteção</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div>Carregando...</div> : (
          items.map(it => (
            <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 120 ? it.description.slice(0,120)+'...' : it.description) : '—'}</div>
              <div className="mt-2 text-xs text-gray-300">Defesa: {it.passive_defense || 0} • Resistência: {it.damage_resistance || 0}</div>
            </div>
          ))
        )}
      </div>

      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Proteção: ${selected.name}` : 'Proteção'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Defesa passiva: </span>{selected.passive_defense || 0}</div>
            <div><span className="text-gray-400">Resistência a dano: </span>{selected.damage_resistance || 0}</div>
            <div><span className="text-gray-400">Penalidade de carga: </span>{selected.encumbrance_penalty || 0}</div>
            <div><span className="text-gray-400">Equipada por padrão: </span>{selected.default_equipped ? 'Sim' : 'Não'}</div>
            <div><span className="text-gray-400">Metadata: </span><div className="mt-1 text-gray-200">{selected.metadata ? (typeof selected.metadata === 'string' ? selected.metadata : JSON.stringify(selected.metadata)) : '—'}</div></div>
            <div className="flex gap-2">
              <button onClick={startEdit} className="px-3 py-1 bg-blue-600/80 rounded">Editar</button>
              <button onClick={()=>handleDelete(selected.id)} className="px-3 py-1 bg-red-600/60 rounded">Remover</button>
            </div>
          </div>
        )}

        {selected && editing && (
          <div className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Defesa passiva" value={form.passive_defense} onChange={e=>setForm(f=>({...f, passive_defense: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Resistência" value={form.damage_resistance} onChange={e=>setForm(f=>({...f, damage_resistance: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Penalidade de carga" value={form.encumbrance_penalty} onChange={e=>setForm(f=>({...f, encumbrance_penalty: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Equipada por padrão</label>
              <input type="checkbox" checked={form.default_equipped} onChange={e=>setForm(f=>({...f, default_equipped: e.target.checked}))} />
            </div>
            <textarea placeholder="Metadata (JSON)" value={form.metadata} onChange={e=>setForm(f=>({...f, metadata: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', description: selected.description || '', passive_defense: selected.passive_defense || 0, damage_resistance: selected.damage_resistance || 0, encumbrance_penalty: selected.encumbrance_penalty || 0, default_equipped: selected.default_equipped ? true : false, metadata: selected.metadata ? (typeof selected.metadata === 'string' ? selected.metadata : JSON.stringify(selected.metadata)) : '' }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Proteção">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Defesa passiva" value={form.passive_defense} onChange={e=>setForm(f=>({...f, passive_defense: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Resistência" value={form.damage_resistance} onChange={e=>setForm(f=>({...f, damage_resistance: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Penalidade de carga" value={form.encumbrance_penalty} onChange={e=>setForm(f=>({...f, encumbrance_penalty: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Equipada por padrão</label>
            <input type="checkbox" checked={form.default_equipped} onChange={e=>setForm(f=>({...f, default_equipped: e.target.checked}))} />
          </div>
          <textarea placeholder="Metadata (JSON)" value={form.metadata} onChange={e=>setForm(f=>({...f, metadata: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1 bg-green-600/80 rounded">Criar</button>
            <button onClick={()=>setCreatingOpen(false)} className="px-3 py-1 border rounded">Cancelar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
