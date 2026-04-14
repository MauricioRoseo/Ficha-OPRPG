"use client";

import React, { useEffect, useState } from "react";

export default function InventoryPanel({ character, onCharacterUpdate }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', description: '', space: 0, category: '' });
  const [patrimonio, setPatrimonio] = useState(character.patrimonio || '');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchItems = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/inventory/character/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar inventário');
      const data = await res.json();
      setItems(data || []);
    } catch (e) { console.error(e); setItems([]); }
  };

  const searchCatalog = async (q) => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/items?search=${encodeURIComponent(q)}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar catálogo');
      const data = await res.json();
      setCatalogResults(data || []);
    } catch (e) { console.error(e); setCatalogResults([]); }
  };

  useEffect(()=>{ fetchItems(); setPatrimonio(character.patrimonio || ''); }, [character?.id]);

  const handleCreate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      const payload = { ...form, character_id: character.id };
      const res = await fetch('http://localhost:3001/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao criar item');
      setForm({ name: '', description: '', space: 0, category: '' });
      setShowAdd(false);
      setShowModal(false);
      await fetchItems();
      const json = await res.json();
      if (json && json.carga_atual !== undefined && onCharacterUpdate) {
        onCharacterUpdate(prev => ({ ...prev, carga_atual: json.carga_atual, carga_maxima: json.carga_maxima }));
      }
    } catch (e) { console.error(e); alert('Erro ao criar item'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover item?')) return;
    try {
      const res = await fetch(`http://localhost:3001/inventory/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao remover');
      const json = await res.json();
      await fetchItems();
      if (json && json.carga_atual !== undefined && onCharacterUpdate) {
        onCharacterUpdate(prev => ({ ...prev, carga_atual: json.carga_atual, carga_maxima: json.carga_maxima }));
      }
    } catch (e) { console.error(e); }
  };

  const handleSelectCatalog = async (item) => {
    // create inventory entry based on catalog item
    try {
      const payload = { character_id: character.id, name: item.name, description: item.description, space: item.space, category: item.category };
      const res = await fetch('http://localhost:3001/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao adicionar item do catálogo');
      const json = await res.json();
      await fetchItems();
      setShowModal(false);
      if (json && json.carga_atual !== undefined && onCharacterUpdate) {
        onCharacterUpdate(prev => ({ ...prev, carga_atual: json.carga_atual, carga_maxima: json.carga_maxima }));
      }
    } catch (e) { console.error(e); alert('Erro ao adicionar item do catálogo'); }
  };

  // autosave patrimonio with debounce
  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const raw = patrimonio;
        const trimmed = raw === undefined || raw === null ? '' : String(raw);

        // if empty, send null; otherwise send the raw string (allow free text)
        const payloadPatrimonio = trimmed === '' ? null : trimmed;

        const res = await fetch(`http://localhost:3001/characters/${character.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
          body: JSON.stringify({ patrimonio: payloadPatrimonio })
        });
        if (!res.ok) {
          let msg = 'Erro ao salvar patrimônio';
          try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) {}
          throw new Error(msg);
        }

        if (onCharacterUpdate) onCharacterUpdate(prev => ({ ...prev, patrimonio: payloadPatrimonio }));
      } catch (e) {
        console.error('Erro ao autosalvar patrimônio', e);
      }
    }, 800);

    return () => clearTimeout(handle);
  }, [patrimonio]);

  return (
    <div>
      <div className="mb-3 stat-label">Inventário</div>
      <div className="panel p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Itens carregados</div>
          <div className="flex gap-2">
            <button onClick={()=>{ setShowModal(true); setShowAdd(false); setCatalogResults([]); setSearchTerm(''); }} className="px-2 py-1 border border-white/10 rounded text-sm">Novo item</button>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className="text-sm text-gray-400">Carga:</div>
          <div className="flex gap-1 items-center">
            <div className="px-2 py-1 bg-[#021018] border border-white/6 rounded">{character.carga_atual ?? '-'}</div>
            <div className="text-xs text-gray-400">/</div>
            <div className="px-2 py-1 bg-[#021018] border border-white/6 rounded">{character.carga_maxima ?? '-'}</div>
          </div>
        </div>

        {/* Modal */}
        {showModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Adicionar item</h4>
                <button onClick={()=>setShowModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <div className="mb-3">
                <input placeholder="Pesquisar catálogo de itens ou digite para filtrar" value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); searchCatalog(e.target.value); }} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
              </div>
              <div className="max-h-48 overflow-auto mb-3">
                {catalogResults.length > 0 ? (
                  <ul>
                    {catalogResults.map(c => (
                      <li key={c.id} className="p-2 border-b border-white/6 flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.description}</div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="text-sm text-gray-400">{c.space}</div>
                          <button onClick={()=>handleSelectCatalog(c)} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-400">Nenhum item encontrado. Clique em "Outro item" para adicionar manualmente.</div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>{ setShowAdd(true); setCatalogResults([]); }} className="px-2 py-1 border border-white/10 rounded">Outro item</button>
              </div>

              {showAdd ? (
                <form onSubmit={handleCreate} className="space-y-2 mt-3">
                  <input required placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <textarea placeholder="Descrição" value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Espaço (peso)" value={form.space} onChange={e=>setForm(f=>({...f, space: Number(e.target.value)}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                    <select value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                      <option value="">Nenhuma</option>
                      <option value="0">0</option>
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={()=>{ setShowAdd(false); setForm({ name: '', description: '', space: 0, category: '' }); }} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                    <button className="px-3 py-1 bg-white/6 rounded">Criar</button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th>Nome</th>
                <th>Descrição</th>
                <th>Espaço</th>
                <th>Categoria</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i=> (
                <tr key={i.id} className="border-t border-white/6">
                  <td className="py-2">{i.name}</td>
                  <td className="py-2">{i.description || '-'}</td>
                  <td className="py-2">{i.space}</td>
                  <td className="py-2">{i.category || '-'}</td>
                  <td className="py-2"><button onClick={()=>handleDelete(i.id)} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400">Remover</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <label className="text-xs text-gray-400">Patrimônio</label>
          <textarea value={patrimonio} onChange={e=>{ setPatrimonio(e.target.value); }} className="w-full p-2 bg-[#021018] text-white border border-white/6 rounded" />
          <div className="flex justify-end mt-2">
            <div className="text-xs text-gray-400">(Salvamento automático ativado)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
