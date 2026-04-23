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

export default function ClassesAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', hp_initial: 0, hp_per_level: 0, effort_initial: 0, effort_per_level: 0, sanity_initial: 0, sanity_per_level: 0, choice_skills_count: 0, proficiencies: '', metadata: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/templates/classes', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar classes');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar classes'); }
    finally{ setLoading(false); }
  };

  const openDetail = (it)=>{
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setForm({
      name: it.name || '',
      description: it.description || '',
      hp_initial: it.hp_initial || 0,
      hp_per_level: it.hp_per_level || 0,
      effort_initial: it.effort_initial || 0,
      effort_per_level: it.effort_per_level || 0,
      sanity_initial: it.sanity_initial || 0,
      sanity_per_level: it.sanity_per_level || 0,
      choice_skills_count: it.choice_skills_count || 0,
      proficiencies: it.proficiencies ? (typeof it.proficiencies === 'string' ? it.proficiencies : JSON.stringify(it.proficiencies)) : '',
      metadata: it.metadata ? (typeof it.metadata === 'string' ? it.metadata : JSON.stringify(it.metadata)) : ''
    });
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id)=>{
    if(!confirm('Remover classe?')) return;
    try{
      const res = await fetch(`http://localhost:3001/templates/classes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Classe removida');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover classe'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', description: '', hp_initial: 0, hp_per_level: 0, effort_initial: 0, effort_per_level: 0, sanity_initial: 0, sanity_per_level: 0, choice_skills_count: 0, proficiencies: '', metadata: '' });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      // attempt to convert proficiencies/metadata to JSON when appropriate
      try{ payload.proficiencies = form.proficiencies ? JSON.parse(form.proficiencies) : null; }catch(e){ /* leave as string */ }
      try{ payload.metadata = form.metadata ? JSON.parse(form.metadata) : null; }catch(e){ /* leave as string */ }
      const res = await fetch('http://localhost:3001/templates/classes', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Classe criada');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar classe'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      try{ payload.proficiencies = form.proficiencies ? JSON.parse(form.proficiencies) : null; }catch(e){ }
      try{ payload.metadata = form.metadata ? JSON.parse(form.metadata) : null; }catch(e){ }
      const res = await fetch(`http://localhost:3001/templates/classes/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Classe atualizada');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar classe'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Classes</h2>
            <p className="text-xs text-gray-400">Gerencie classes (HP/Esforço/Sanidade por nível, proficiências e metadados)</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Classe</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div>Carregando...</div> : (
          items.map(it => (
            <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 80 ? it.description.slice(0,80)+'...' : it.description) : '—'}</div>
              <div className="mt-2 text-xs text-gray-300">HP: {it.hp_initial}/{it.hp_per_level} • Esforço: {it.effort_initial}/{it.effort_per_level}</div>
              <div className="text-xs text-gray-300">Sanidade: {it.sanity_initial}/{it.sanity_per_level} • Escolhas de perícias: {it.choice_skills_count || 0}</div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Classe: ${selected.name}` : 'Classe'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">HP (inicial / por nível): </span>{selected.hp_initial} / {selected.hp_per_level}</div>
            <div><span className="text-gray-400">Esforço (inicial / por nível): </span>{selected.effort_initial} / {selected.effort_per_level}</div>
            <div><span className="text-gray-400">Sanidade (inicial / por nível): </span>{selected.sanity_initial} / {selected.sanity_per_level}</div>
            <div><span className="text-gray-400">Escolhas de perícias: </span>{selected.choice_skills_count || 0}</div>
            <div><span className="text-gray-400">Proficiencias: </span><div className="mt-1 text-gray-200">{selected.proficiencies ? (typeof selected.proficiencies === 'string' ? selected.proficiencies : JSON.stringify(selected.proficiencies)) : '—'}</div></div>
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
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="HP inicial" value={form.hp_initial} onChange={e=>setForm(f=>({...f, hp_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="HP por nível" value={form.hp_per_level} onChange={e=>setForm(f=>({...f, hp_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Esforço inicial" value={form.effort_initial} onChange={e=>setForm(f=>({...f, effort_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Esforço por nível" value={form.effort_per_level} onChange={e=>setForm(f=>({...f, effort_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Sanidade inicial" value={form.sanity_initial} onChange={e=>setForm(f=>({...f, sanity_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input type="number" placeholder="Sanidade por nível" value={form.sanity_per_level} onChange={e=>setForm(f=>({...f, sanity_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            </div>
            <input type="number" placeholder="Escolhas de perícias" value={form.choice_skills_count} onChange={e=>setForm(f=>({...f, choice_skills_count: Number(e.target.value)}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <textarea placeholder="Proficiencias (JSON ou texto)" value={form.proficiencies} onChange={e=>setForm(f=>({...f, proficiencies: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <textarea placeholder="Metadata (JSON)" value={form.metadata} onChange={e=>setForm(f=>({...f, metadata: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', description: selected.description || '', hp_initial: selected.hp_initial || 0, hp_per_level: selected.hp_per_level || 0, effort_initial: selected.effort_initial || 0, effort_per_level: selected.effort_per_level || 0, sanity_initial: selected.sanity_initial || 0, sanity_per_level: selected.sanity_per_level || 0, choice_skills_count: selected.choice_skills_count || 0, proficiencies: selected.proficiencies ? (typeof selected.proficiencies === 'string' ? selected.proficiencies : JSON.stringify(selected.proficiencies)) : '', metadata: selected.metadata ? (typeof selected.metadata === 'string' ? selected.metadata : JSON.stringify(selected.metadata)) : '' }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Classe">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="HP inicial" value={form.hp_initial} onChange={e=>setForm(f=>({...f, hp_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="HP por nível" value={form.hp_per_level} onChange={e=>setForm(f=>({...f, hp_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Esforço inicial" value={form.effort_initial} onChange={e=>setForm(f=>({...f, effort_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Esforço por nível" value={form.effort_per_level} onChange={e=>setForm(f=>({...f, effort_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Sanidade inicial" value={form.sanity_initial} onChange={e=>setForm(f=>({...f, sanity_initial: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" placeholder="Sanidade por nível" value={form.sanity_per_level} onChange={e=>setForm(f=>({...f, sanity_per_level: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
          </div>
          <input type="number" placeholder="Escolhas de perícias" value={form.choice_skills_count} onChange={e=>setForm(f=>({...f, choice_skills_count: Number(e.target.value)}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Proficiencias (JSON ou texto)" value={form.proficiencies} onChange={e=>setForm(f=>({...f, proficiencies: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
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
