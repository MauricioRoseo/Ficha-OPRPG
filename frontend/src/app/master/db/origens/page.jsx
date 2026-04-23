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

export default function OrigensAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', pericia_1_id: null, pericia_2_id: null, habilidade_id: null });
  const [pericias, setPericias] = useState([]);
  const [habilidades, setHabilidades] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
    fetchFeatureLists();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/templates/origins', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar origens');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar origens'); }
    finally{ setLoading(false); }
  };

  const fetchFeatureLists = async ()=>{
    try{
      const p = await fetch('http://localhost:3001/features/search?type=pericia', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok? r.json(): []);
      const h = await fetch('http://localhost:3001/features/search?type=habilidade', { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.ok? r.json(): []);
      setPericias(p || []);
      setHabilidades(h || []);
    }catch(e){ console.error(e); }
  };

  const openDetail = (it)=>{
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setForm({ name: it.name || '', description: it.description || '', pericia_1_id: it.pericia_1_id || null, pericia_2_id: it.pericia_2_id || null, habilidade_id: it.habilidade_id || null });
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id)=>{
    if(!confirm('Remover origem?')) return;
    try{
      const res = await fetch(`http://localhost:3001/templates/origins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Origem removida');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover origem'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', description: '', pericia_1_id: null, pericia_2_id: null, habilidade_id: null });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      const res = await fetch('http://localhost:3001/templates/origins', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Origem criada');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar origem'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      const res = await fetch(`http://localhost:3001/templates/origins/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Origem atualizada');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar origem'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Origens</h2>
            <p className="text-xs text-gray-400">Gerencie origens (vincule até 2 perícias e 1 habilidade)</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Origem</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div>Carregando...</div> : (
          items.map(it => (
            <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 80 ? it.description.slice(0,80)+'...' : it.description) : '—'}</div>
              <div className="mt-2 text-xs text-gray-300">Perícias:&nbsp;{
                (it.pericia_1_id || it.pericia_2_id) ? [it.pericia_1_id, it.pericia_2_id].filter(Boolean).map(id => {
                  const f = pericias.find(p => String(p.id) === String(id));
                  return f ? f.name : id;
                }).join(', ') : '—'
              }</div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Origem: ${selected.name}` : 'Origem'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Perícia 1: </span>{selected.pericia_1_id ? (pericias.find(p=>p.id===selected.pericia_1_id)?.name || selected.pericia_1_id) : '—'}</div>
            <div><span className="text-gray-400">Perícia 2: </span>{selected.pericia_2_id ? (pericias.find(p=>p.id===selected.pericia_2_id)?.name || selected.pericia_2_id) : '—'}</div>
            <div><span className="text-gray-400">Habilidade: </span>{selected.habilidade_id ? (habilidades.find(h=>h.id===selected.habilidade_id)?.name || selected.habilidade_id) : '—'}</div>
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
            <div>
              <div className="text-xs text-gray-400 mb-1">Perícia 1</div>
              <select value={form.pericia_1_id || ''} onChange={e=>setForm(f=>({...f, pericia_1_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhum --</option>
                {pericias.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Perícia 2</div>
              <select value={form.pericia_2_id || ''} onChange={e=>setForm(f=>({...f, pericia_2_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhum --</option>
                {pericias.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Habilidade</div>
              <select value={form.habilidade_id || ''} onChange={e=>setForm(f=>({...f, habilidade_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhum --</option>
                {habilidades.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', description: selected.description || '', pericia_1_id: selected.pericia_1_id || null, pericia_2_id: selected.pericia_2_id || null, habilidade_id: selected.habilidade_id || null }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Origem">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div>
            <div className="text-xs text-gray-400 mb-1">Perícia 1</div>
            <select value={form.pericia_1_id || ''} onChange={e=>setForm(f=>({...f, pericia_1_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhum --</option>
              {pericias.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Perícia 2</div>
            <select value={form.pericia_2_id || ''} onChange={e=>setForm(f=>({...f, pericia_2_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhum --</option>
              {pericias.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Habilidade</div>
            <select value={form.habilidade_id || ''} onChange={e=>setForm(f=>({...f, habilidade_id: e.target.value || null}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhum --</option>
              {habilidades.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
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
