"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function Modal({ open, onClose, title, children }){
  if(!open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="modal-card relative bg-[#071018] border border-white/10 rounded-lg p-4 w-full max-w-2xl z-10">
        <button onClick={onClose} className="modal-close px-2 py-1 border rounded text-sm">Fechar</button>
        <div className="modal-sticky-header flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-sticky-footer flex justify-end mt-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
}

export default function ItemsAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', space: 0, category: '', metadata: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/items?search=', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar itens');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar itens'); }
    finally{ setLoading(false); }
  };

  const openDetail = (it) => {
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setForm({
      name: it.name || '',
      description: it.description || '',
      space: it.space || 0,
      category: it.category || '',
      metadata: it.metadata ? (typeof it.metadata === 'string' ? it.metadata : JSON.stringify(it.metadata)) : ''
    });
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id) => {
    if(!confirm('Remover item do catálogo?')) return;
    try{
      const res = await fetch(`http://localhost:3001/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Item removido');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover item'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', description: '', space: 0, category: '', metadata: '' });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      try{
        payload.metadata = form.metadata ? JSON.parse(form.metadata) : null;
      }catch(e){ alert('Metadata inválido: informe JSON válido, por exemplo {"Tipo":"Item Operacional"}'); return; }
      const res = await fetch('http://localhost:3001/items', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Item criado');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar item'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      try{ payload.metadata = form.metadata ? JSON.parse(form.metadata) : null; }catch(e){ alert('Metadata inválido: informe JSON válido'); return; }
      const res = await fetch(`http://localhost:3001/items/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Item atualizado');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar item'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Itens</h2>
            <p className="text-xs text-gray-400">Gerencie o catálogo de itens do sistema</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Item</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div>Carregando...</div> : (
          items.map(it => (
            <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 120 ? it.description.slice(0,120)+'...' : it.description) : '—'}</div>
              <div className="mt-2 text-xs text-gray-300">Espaço: {it.space || 0} • Categoria: {it.category || '—'}</div>
            </div>
          ))
        )}
      </div>

      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Item: ${selected.name}` : 'Item'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Espaço: </span>{selected.space || 0}</div>
            <div><span className="text-gray-400">Categoria: </span>{selected.category || '—'}</div>
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
              <input type="number" placeholder="Espaço" value={form.space} onChange={e=>setForm(f=>({...f, space: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input placeholder="Categoria" value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            </div>
            <textarea placeholder="Metadata (JSON)" value={form.metadata} onChange={e=>setForm(f=>({...f, metadata: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', description: selected.description || '', space: selected.space || 0, category: selected.category || '', metadata: selected.metadata ? (typeof selected.metadata === 'string' ? selected.metadata : JSON.stringify(selected.metadata)) : '' }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Item">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Espaço" value={form.space} onChange={e=>setForm(f=>({...f, space: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Categoria" value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
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
