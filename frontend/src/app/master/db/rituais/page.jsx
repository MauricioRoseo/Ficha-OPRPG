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

export default function RitualsAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', circle: '', element: '', description: '', effect: '', execution: '', alcance: '', duration: '', resistencia_pericia_id: '', aprimoramento_discente: false, custo_aprimoramento_discente: '', descricao_aprimoramento_discente: '', aprimoramento_verdadeiro: false, custo_aprimoramento_verdadeiro: '', descricao_aprimoramento_verdadeiro: '', symbol_image: '', symbol_image_secondary: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/rituals', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar rituais');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar rituais'); }
    finally{ setLoading(false); }
  };

  const openDetail = async (it)=>{
    try{
      const res = await fetch(`http://localhost:3001/rituals/${it.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar ritual');
      const data = await res.json();
      setSelected(data);
      setDetailOpen(true);
      setEditing(false);
      setForm({
        name: data.name || '',
        circle: data.circle || '',
        element: data.element || '',
        description: data.description || '',
        effect: data.effect || '',
        execution: data.execution || '',
        alcance: data.alcance || '',
        duration: data.duration || '',
        resistencia_pericia_id: data.resistencia_pericia_id || '',
        aprimoramento_discente: !!data.aprimoramento_discente,
        custo_aprimoramento_discente: data.custo_aprimoramento_discente || '',
        descricao_aprimoramento_discente: data.descricao_aprimoramento_discente || '',
        aprimoramento_verdadeiro: !!data.aprimoramento_verdadeiro,
        custo_aprimoramento_verdadeiro: data.custo_aprimoramento_verdadeiro || '',
        descricao_aprimoramento_verdadeiro: data.descricao_aprimoramento_verdadeiro || '',
        symbol_image: data.symbol_image || '',
        symbol_image_secondary: data.symbol_image_secondary || ''
      });
    }catch(e){ console.error(e); alert('Erro ao abrir ritual'); }
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id)=>{
    if(!confirm('Remover ritual?')) return;
    try{
      const res = await fetch(`http://localhost:3001/rituals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Ritual removido');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover ritual'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', circle: '', element: '', description: '', effect: '', execution: '', alcance: '', duration: '', resistencia_pericia_id: '', aprimoramento_discente: false, custo_aprimoramento_discente: '', descricao_aprimoramento_discente: '', aprimoramento_verdadeiro: false, custo_aprimoramento_verdadeiro: '', descricao_aprimoramento_verdadeiro: '', symbol_image: '', symbol_image_secondary: '' });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      const res = await fetch('http://localhost:3001/rituals', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Ritual criado');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar ritual'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    try{
      const payload = { ...form };
      const res = await fetch(`http://localhost:3001/rituals/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Ritual atualizado');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar ritual'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Rituais</h2>
            <p className="text-xs text-gray-400">Gerencie o catálogo de rituais</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Ritual</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <div>Carregando...</div> : (
          items.map(it => (
            <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-gray-400 mt-1">{it.element ? it.element : '—'} • Círculo: {it.circle || '—'}</div>
              <div className="mt-2 text-xs text-gray-300">{it.effect ? (it.effect.length>100? it.effect.slice(0,100)+'...': it.effect) : (it.description? (it.description.length>100? it.description.slice(0,100)+'...': it.description) : '—')}</div>
            </div>
          ))
        )}
      </div>

      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Ritual: ${selected.name}` : 'Ritual'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Círculo: </span>{selected.circle || '—'}</div>
            <div><span className="text-gray-400">Elemento: </span>{selected.element || '—'}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Efeito: </span><div className="mt-1 text-gray-200">{selected.effect || '—'}</div></div>
            <div><span className="text-gray-400">Execução: </span>{selected.execution || '—'}</div>
            <div><span className="text-gray-400">Alcance: </span>{selected.alcance || '—'}</div>
            <div><span className="text-gray-400">Duração: </span>{selected.duration || '—'}</div>
            <div><span className="text-gray-400">Resistência (perícia id): </span>{selected.resistencia_pericia_id || '—'}</div>
            <div><span className="text-gray-400">Aprimoramento discente: </span>{selected.aprimoramento_discente ? 'Sim' : 'Não'}</div>
            <div><span className="text-gray-400">Aprimoramento verdadeiro: </span>{selected.aprimoramento_verdadeiro ? 'Sim' : 'Não'}</div>
            <div className="flex gap-2">
              <button onClick={startEdit} className="px-3 py-1 bg-blue-600/80 rounded">Editar</button>
              <button onClick={()=>handleDelete(selected.id)} className="px-3 py-1 bg-red-600/60 rounded">Remover</button>
            </div>
          </div>
        )}

        {selected && editing && (
          <div className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Círculo" value={form.circle} onChange={e=>setForm(f=>({...f, circle: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input placeholder="Elemento" value={form.element} onChange={e=>setForm(f=>({...f, element: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input placeholder="Execução" value={form.execution} onChange={e=>setForm(f=>({...f, execution: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            </div>
            <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <textarea placeholder="Efeito" value={form.effect} onChange={e=>setForm(f=>({...f, effect: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Alcance" value={form.alcance} onChange={e=>setForm(f=>({...f, alcance: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
              <input placeholder="Duração" value={form.duration} onChange={e=>setForm(f=>({...f, duration: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Aprimoramento discente</label>
              <input type="checkbox" checked={form.aprimoramento_discente} onChange={e=>setForm(f=>({...f, aprimoramento_discente: e.target.checked}))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Aprimoramento verdadeiro</label>
              <input type="checkbox" checked={form.aprimoramento_verdadeiro} onChange={e=>setForm(f=>({...f, aprimoramento_verdadeiro: e.target.checked}))} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', circle: selected.circle || '', element: selected.element || '', description: selected.description || '', effect: selected.effect || '', execution: selected.execution || '', alcance: selected.alcance || '', duration: selected.duration || '', resistencia_pericia_id: selected.resistencia_pericia_id || '', aprimoramento_discente: !!selected.aprimoramento_discente, custo_aprimoramento_discente: selected.custo_aprimoramento_discente || '', descricao_aprimoramento_discente: selected.descricao_aprimoramento_discente || '', aprimoramento_verdadeiro: !!selected.aprimoramento_verdadeiro, custo_aprimoramento_verdadeiro: selected.custo_aprimoramento_verdadeiro || '', descricao_aprimoramento_verdadeiro: selected.descricao_aprimoramento_verdadeiro || '', symbol_image: selected.symbol_image || '', symbol_image_secondary: selected.symbol_image_secondary || '' }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Ritual">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Círculo" value={form.circle} onChange={e=>setForm(f=>({...f, circle: Number(e.target.value)}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Elemento" value={form.element} onChange={e=>setForm(f=>({...f, element: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
            <input placeholder="Execução" value={form.execution} onChange={e=>setForm(f=>({...f, execution: e.target.value}))} className="p-2 rounded bg-[#021018] border border-white/6" />
          </div>
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Efeito" value={form.effect} onChange={e=>setForm(f=>({...f, effect: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-3 py-1 bg-green-600/80 rounded">Criar</button>
            <button onClick={()=>setCreatingOpen(false)} className="px-3 py-1 border rounded">Cancelar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
