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

export default function TrailsAdminPage(){
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', class_id: '' });
  const [classes, setClasses] = useState([]);
  const [abilities, setAbilities] = useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(()=>{
    if(!token){ router.push('/'); return; }
    fetchList();
    fetchClasses();
    fetchAbilities();
  }, []);

  const fetchList = async ()=>{
    setLoading(true);
    try{
      const res = await fetch('http://localhost:3001/templates/trails', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar trilhas');
      const data = await res.json();
      setItems(data || []);
    }catch(e){ console.error(e); alert('Erro ao carregar trilhas'); }
    finally{ setLoading(false); }
  };

  const fetchClasses = async ()=>{
    try{
      const res = await fetch('http://localhost:3001/templates/classes', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar classes');
      const data = await res.json();
      setClasses(data || []);
    }catch(e){ console.error(e); }
  };

  const fetchAbilities = async ()=>{
    try{
      const res = await fetch('http://localhost:3001/features/search?type=habilidade', { headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok) throw new Error('Erro ao buscar habilidades');
      const data = await res.json();
      setAbilities(data || []);
    }catch(e){ console.error(e); }
  };

  const openDetail = (it)=>{
    setSelected(it);
    setDetailOpen(true);
    setEditing(false);
    setForm({
      name: it.name || '',
      description: it.description || '',
      class_id: it.class_id || '',
      ability_lvl_2_id: it.ability_lvl_2_id || null,
      ability_lvl_8_id: it.ability_lvl_8_id || null,
      ability_lvl_13_id: it.ability_lvl_13_id || null,
      ability_lvl_20_id: it.ability_lvl_20_id || null
    });
  };

  const closeDetail = ()=>{ setDetailOpen(false); setSelected(null); setEditing(false); };

  const handleDelete = async (id)=>{
    if(!confirm('Remover trilha?')) return;
    try{
      const res = await fetch(`http://localhost:3001/templates/trails/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Trilha removida');
      if(selected && selected.id === id) closeDetail();
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao remover trilha'); }
  };

  const handleCreateOpen = ()=>{
    setCreatingOpen(true);
    setForm({ name: '', description: '', class_id: '', ability_lvl_2_id: '', ability_lvl_8_id: '', ability_lvl_13_id: '', ability_lvl_20_id: '' });
  };

  const handleCreate = async ()=>{
    if(!form.name){ alert('Preencha o nome'); return; }
    if(!form.class_id){ alert('Selecione uma classe'); return; }
    try{
      const payload = { ...form };
      const res = await fetch('http://localhost:3001/templates/trails', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Trilha criada');
      setCreatingOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao criar trilha'); }
  };

  const startEdit = ()=>{ setEditing(true); };

  const handleSaveEdit = async ()=>{
    if(!selected || !selected.id) return;
    if(!form.name){ alert('Preencha o nome'); return; }
    if(!form.class_id){ alert('Selecione uma classe'); return; }
    try{
      const payload = { ...form };
      const res = await fetch(`http://localhost:3001/templates/trails/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(payload) });
      if(!res.ok){ const j = await res.json().catch(()=>null); throw new Error((j && j.message) || 'Erro'); }
      alert('Trilha atualizada');
      setEditing(false);
      setDetailOpen(false);
      await fetchList();
    }catch(e){ console.error(e); alert('Erro ao atualizar trilha'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Administração de Trilhas</h2>
            <p className="text-xs text-gray-400">Gerencie trilhas (relacione trilhas a uma classe)</p>
          </div>
          <div>
            <button onClick={()=>router.push('/master/db')} className="px-3 py-1 border rounded text-sm mr-2">Voltar ao Painel DB</button>
            <button onClick={handleCreateOpen} className="px-3 py-1 bg-green-600/80 rounded text-sm">Adicionar Trilha</button>
          </div>
        </div>
      </div>

      {loading ? <div>Carregando...</div> : (
        <div className="space-y-6">
          {classes.map(cls => {
            const clsTrails = items.filter(it => String(it.class_id) === String(cls.id));
            if(!clsTrails.length) return null;
            return (
              <div key={cls.id}>
                <h3 className="text-sm font-semibold mb-2">{cls.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {clsTrails.map(it => (
                    <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 120 ? it.description.slice(0,120)+'...' : it.description) : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Unassigned trails */}
          {items.filter(it => !it.class_id).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Sem Classe</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {items.filter(it => !it.class_id).map(it => (
                  <div key={it.id} className="p-4 border border-white/6 rounded-lg cursor-pointer hover:shadow-md bg-white/2" onClick={()=>openDetail(it)}>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 120 ? it.description.slice(0,120)+'...' : it.description) : '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={closeDetail} title={selected ? `Trilha: ${selected.name}` : 'Trilha'}>
        {selected && !editing && (
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Nome: </span>{selected.name}</div>
            <div><span className="text-gray-400">Descrição: </span><div className="mt-1 text-gray-200">{selected.description || '—'}</div></div>
            <div><span className="text-gray-400">Classe: </span>{classes.find(c=>String(c.id)===String(selected.class_id))?.name || selected.class_id || '—'}</div>
            <div><span className="text-gray-400">Habilidade (nível 2): </span>{abilities.find(a=>String(a.id)===String(selected.ability_lvl_2_id))?.name || selected.ability_lvl_2_id || '—'}</div>
            <div><span className="text-gray-400">Habilidade (nível 8): </span>{abilities.find(a=>String(a.id)===String(selected.ability_lvl_8_id))?.name || selected.ability_lvl_8_id || '—'}</div>
            <div><span className="text-gray-400">Habilidade (nível 13): </span>{abilities.find(a=>String(a.id)===String(selected.ability_lvl_13_id))?.name || selected.ability_lvl_13_id || '—'}</div>
            <div><span className="text-gray-400">Habilidade (nível 20): </span>{abilities.find(a=>String(a.id)===String(selected.ability_lvl_20_id))?.name || selected.ability_lvl_20_id || '—'}</div>
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
              <div className="text-xs text-gray-400 mb-1">Classe</div>
              <select value={form.class_id || ''} onChange={e=>setForm(f=>({...f, class_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- selecione --</option>
                {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Habilidade (nível 2)</div>
              <select value={form.ability_lvl_2_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_2_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhuma --</option>
                {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Habilidade (nível 8)</div>
              <select value={form.ability_lvl_8_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_8_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhuma --</option>
                {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Habilidade (nível 13)</div>
              <select value={form.ability_lvl_13_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_13_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhuma --</option>
                {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Habilidade (nível 20)</div>
              <select value={form.ability_lvl_20_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_20_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                <option value="">-- nenhuma --</option>
                {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-green-600/80 rounded">Salvar</button>
              <button onClick={()=>{ setEditing(false); setForm({ name: selected.name || '', description: selected.description || '', class_id: selected.class_id || '', ability_lvl_2_id: selected.ability_lvl_2_id || '', ability_lvl_8_id: selected.ability_lvl_8_id || '', ability_lvl_13_id: selected.ability_lvl_13_id || '', ability_lvl_20_id: selected.ability_lvl_20_id || '' }); }} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={creatingOpen} onClose={()=>setCreatingOpen(false)} title="Criar Trilha">
        <div className="space-y-2">
          <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
          <div>
            <div className="text-xs text-gray-400 mb-1">Classe</div>
            <select value={form.class_id || ''} onChange={e=>setForm(f=>({...f, class_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- selecione --</option>
              {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Habilidade (nível 2)</div>
            <select value={form.ability_lvl_2_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_2_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhuma --</option>
              {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Habilidade (nível 8)</div>
            <select value={form.ability_lvl_8_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_8_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhuma --</option>
              {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Habilidade (nível 13)</div>
            <select value={form.ability_lvl_13_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_13_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhuma --</option>
              {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Habilidade (nível 20)</div>
            <select value={form.ability_lvl_20_id || ''} onChange={e=>setForm(f=>({...f, ability_lvl_20_id: e.target.value || ''}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
              <option value="">-- nenhuma --</option>
              {abilities.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
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
