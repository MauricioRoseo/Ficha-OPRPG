"use client";

import React, { useEffect, useState, useRef } from "react";

export default function InventoryPanel({ character, onCharacterUpdate, editable = false }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name: '', description: '', space: 0, category: '', metadataList: [] });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', space: 0, category: '' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItemId, setEditItemId] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({ base_attribute: 'forca', extra_attribute: '', modifiers: [] });
  const [attributesList, setAttributesList] = useState([]);
  const [patrimonio, setPatrimonio] = useState(character.patrimonio || '');
  // track last saved value to avoid resending identical or overwriting with null
  const lastSavedPatrimonio = useRef(character.patrimonio !== undefined ? character.patrimonio : null);
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

  const handleEditClick = (item) => {
    setEditItemId(item.id);
    setEditForm({ name: item.name || '', description: item.description || '', space: item.space || 0, category: item.category || '', metadataList: (item.metadata && typeof item.metadata === 'object') ? Object.keys(item.metadata).map((k,idx)=>({ id: Date.now() + idx, key: k, value: String(item.metadata[k] ?? '') })) : [] });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!editItemId) return;
    try {
      // build metadata object from metadataList
      const metaList = editForm.metadataList || [];
      const metadataObj = metaList.reduce((acc,m)=>{ if (m.key && m.key.length) acc[m.key] = m.value; return acc; }, {});
      const payload = { name: editForm.name, description: editForm.description, space: editForm.space, category: editForm.category, metadata: Object.keys(metadataObj).length ? metadataObj : null };
      const res = await fetch(`http://localhost:3001/inventory/${editItemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao atualizar item');
      const json = await res.json();
      await fetchItems();
      setShowEditModal(false);
      setEditItemId(null);
      if (json && json.carga_atual !== undefined && onCharacterUpdate) {
        onCharacterUpdate(prev => ({ ...prev, carga_atual: json.carga_atual, carga_maxima: json.carga_maxima }));
      }
    } catch (e) { console.error(e); alert('Erro ao atualizar item'); }
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

  useEffect(()=>{
    fetchItems();
    // initialize local patrimonio only if server has a non-null value.
    // If server returns null/undefined, keep local state to avoid overwriting user's input.
    const incoming = character && character.patrimonio;
    if (incoming !== undefined && incoming !== null) {
      setPatrimonio(String(incoming));
      lastSavedPatrimonio.current = incoming;
    }
  }, [character?.id]);

  useEffect(()=>{
    // load existing status_formula from character if present
    try {
      let sf = character && character.status_formula ? character.status_formula : null;
      if (typeof sf === 'string' && sf.length) sf = JSON.parse(sf);
      if (sf) setConfig({ base_attribute: sf.base_attribute || 'forca', extra_attribute: sf.extra_attribute || '', modifiers: sf.modifiers || [] });
    } catch (e) { /* ignore */ }
  }, [character?.id]);

  const fetchAttributesList = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/attributes/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar atributos');
      const data = await res.json();
      // data is an object with attribute fields
      setAttributesList(Object.keys(data || {}).filter(k=>['forca','agilidade','intelecto','vigor','presenca'].includes(k)).map(k=>({ key:k, label:k })));
    } catch (e) { console.error(e); setAttributesList([]); }
  };

  const handleOpenConfig = async () => {
    await fetchAttributesList();
    setShowConfigModal(true);
  };

  const handleAddModifier = () => setConfig(c=>({ ...c, modifiers: [...(c.modifiers||[]), { id: Date.now(), label: 'Mod', value: 0 }] }));

  const handleRemoveModifier = (id) => setConfig(c=>({ ...c, modifiers: (c.modifiers||[]).filter(m=>m.id!==id) }));

  const handleSaveConfig = async () => {
    try {
      const payload = { status_formula: { base_attribute: config.base_attribute, extra_attribute: config.extra_attribute || null, modifiers: config.modifiers || [] } };
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`http://localhost:3001/characters/${character.id}/details`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        let bodyText = '';
        try {
          const txt = await res.text();
          bodyText = txt;
          try { const j = JSON.parse(txt); if (j && j.message) bodyText = JSON.stringify(j); } catch (e) {}
        } catch (e) { bodyText = '<sem corpo>' }
        const msg = `Erro ${res.status}: ${bodyText}`;
        throw new Error(msg);
      }
      // refresh items and refetch full character to propagate carga/status updates
      const json = await res.json();
      setShowConfigModal(false);
      await fetchItems();
      try {
        const headers2 = { 'Content-Type': 'application/json' };
        if (token) headers2.Authorization = `Bearer ${token}`;
        const r2 = await fetch(`http://localhost:3001/characters/${character.id}/full`, { headers: headers2 });
        if (r2.ok) {
          const data = await r2.json();
          if (onCharacterUpdate) onCharacterUpdate(data.character || data);
        } else {
          if (onCharacterUpdate) onCharacterUpdate(prev=>({ ...prev }));
        }
      } catch (e) {
        if (onCharacterUpdate) onCharacterUpdate(prev=>({ ...prev }));
      }
    } catch (e) { console.error('Erro ao salvar configuração', e); alert(e && e.message ? e.message : 'Erro ao salvar configuração'); }
  };

  const handleCreate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      const metaList = form.metadataList || [];
      const metadataObj = metaList.reduce((acc,m)=>{ if (m.key && m.key.length) acc[m.key] = m.value; return acc; }, {});
      const payload = { name: form.name, description: form.description, space: form.space, category: form.category, metadata: Object.keys(metadataObj).length ? metadataObj : null, character_id: character.id };
      const res = await fetch('http://localhost:3001/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao criar item');
      setForm({ name: '', description: '', space: 0, category: '', metadataList: [] });
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
      const payload = { character_id: character.id, name: item.name, description: item.description, space: item.space, category: item.category, metadata: item.metadata || null };
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

  // Patrimônio edit flow: show read-only value with an Edit button that opens a modal.
  const [showPatrimonioModal, setShowPatrimonioModal] = useState(false);
  const [editPatrimonioValue, setEditPatrimonioValue] = useState('');

  const openPatrimonioEditor = () => {
    setEditPatrimonioValue(patrimonio || '');
    setShowPatrimonioModal(true);
  };

  const savePatrimonio = async () => {
    try {
      const trimmed = editPatrimonioValue === undefined || editPatrimonioValue === null ? '' : String(editPatrimonioValue);
      const payload = trimmed === '' ? null : trimmed;

      const res = await fetch(`http://localhost:3001/characters/${character.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ patrimonio: payload })
      });
      if (!res.ok) {
        let msg = 'Erro ao salvar patrimônio';
        try { const j = await res.json(); if (j && j.message) msg = j.message; } catch (e) {}
        throw new Error(msg);
      }

      // on success, update local state and lastSaved
      setPatrimonio(payload === null ? '' : payload);
      lastSavedPatrimonio.current = payload;
      if (onCharacterUpdate) onCharacterUpdate(prev => ({ ...prev, patrimonio: payload }));
      setShowPatrimonioModal(false);
    } catch (e) {
      console.error('Erro ao salvar patrimônio', e);
      alert('Erro ao salvar patrimônio');
    }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Inventário</div>
      <div className="panel p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Itens carregados</div>
          <div className="flex gap-2">
              <button onClick={()=>{ setShowModal(true); setShowAdd(false); setCatalogResults([]); setSearchTerm(''); }} className="px-2 py-1 border border-white/10 rounded text-sm">Novo item</button>
              {editable ? (
                <button onClick={handleOpenConfig} className="px-2 py-1 border border-white/10 rounded text-sm">Configurar carga</button>
              ) : null}
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

        <div className="mb-3">
          <div className="text-sm text-gray-400">Patrimônio</div>
          <div className="mt-2 flex items-center gap-3">
            <input readOnly value={patrimonio || ''} aria-label="Patrimônio" className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
            {editable ? (
              <button onClick={openPatrimonioEditor} aria-label="Editar patrimônio" title="Editar" className="px-2 py-1 border border-white/10 rounded text-sm">
                {/* simple pencil icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.41l-2.34-2.34a1.003 1.003 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Patrimônio editor modal */}
        {showPatrimonioModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Editar Patrimônio</h4>
                <button onClick={()=>setShowPatrimonioModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <div className="space-y-3">
                <textarea value={editPatrimonioValue} onChange={e=>setEditPatrimonioValue(e.target.value)} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded h-40" />
                <div className="flex justify-end gap-2">
                  <button onClick={()=>setShowPatrimonioModal(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button onClick={savePatrimonio} className="px-3 py-1 bg-white/6 rounded">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">Metadados</div>
                      <button type="button" onClick={()=>setForm(f=>({...f, metadataList: [...(f.metadataList||[]), { id: Date.now(), key: '', value: '' }] }))} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar</button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {(form.metadataList || []).map(m => (
                        <div key={m.id} className="flex gap-2">
                          <input placeholder="Chave" value={m.key} onChange={e=>setForm(f=>({...f, metadataList: f.metadataList.map(x=> x.id===m.id?({...x, key: e.target.value}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded w-1/3" />
                          <input placeholder="Valor" value={m.value} onChange={e=>setForm(f=>({...f, metadataList: f.metadataList.map(x=> x.id===m.id?({...x, value: e.target.value}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded flex-1" />
                          <button type="button" onClick={()=>setForm(f=>({...f, metadataList: f.metadataList.filter(x=> x.id!==m.id) }))} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400">Remover</button>
                        </div>
                      ))}
                      {(form.metadataList || []).length===0 ? <div className="text-sm text-gray-400">Nenhum metadado</div> : null}
                    </div>
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
                  <tr key={i.id} className="border-t border-white/6 cursor-pointer" onClick={()=>{ setSelectedItem(i); setShowViewModal(true); }}>
                    <td className="py-2">{i.name}</td>
                    <td className="py-2">&nbsp;</td>
                    <td className="py-2">{i.space}</td>
                    <td className="py-2">{i.category || '-'}</td>
                    <td className="py-2 flex gap-2">
                      <button onClick={(e)=>{ e.stopPropagation(); handleEditClick(i); }} className="px-2 py-1 border border-white/10 rounded text-sm">Editar</button>
                      <button onClick={(e)=>{ e.stopPropagation(); handleDelete(i.id); }} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>

        {showEditModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Editar item</h4>
                <button onClick={()=>setShowEditModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-2 mt-3">
                <input required placeholder="Nome" value={editForm.name} onChange={e=>setEditForm(f=>({...f, name: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <textarea placeholder="Descrição" value={editForm.description} onChange={e=>setEditForm(f=>({...f, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Espaço (peso)" value={editForm.space} onChange={e=>setEditForm(f=>({...f, space: Number(e.target.value)}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <select value={editForm.category} onChange={e=>setEditForm(f=>({...f, category: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                    <option value="">Nenhuma</option>
                    <option value="0">0</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Metadados</div>
                    <button type="button" onClick={()=>setEditForm(f=>({...f, metadataList: [...(f.metadataList||[]), { id: Date.now(), key: '', value: '' }] }))} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar</button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {(editForm.metadataList || []).map(m => (
                      <div key={m.id} className="flex gap-2">
                        <input placeholder="Chave" value={m.key} onChange={e=>setEditForm(f=>({...f, metadataList: f.metadataList.map(x=> x.id===m.id?({...x, key: e.target.value}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded w-1/3" />
                        <input placeholder="Valor" value={m.value} onChange={e=>setEditForm(f=>({...f, metadataList: f.metadataList.map(x=> x.id===m.id?({...x, value: e.target.value}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded flex-1" />
                        <button type="button" onClick={()=>setEditForm(f=>({...f, metadataList: f.metadataList.filter(x=> x.id!==m.id) }))} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400">Remover</button>
                      </div>
                    ))}
                    {(editForm.metadataList || []).length===0 ? <div className="text-sm text-gray-400">Nenhum metadado</div> : null}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>{ setShowEditModal(false); setEditItemId(null); }} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button className="px-3 py-1 bg-white/6 rounded">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {showViewModal && selectedItem ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Detalhes do item</h4>
                <button onClick={()=>{ setShowViewModal(false); setSelectedItem(null); }} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <div className="space-y-3">
                <div><strong>Nome:</strong> {selectedItem.name}</div>
                <div><strong>Descrição:</strong></div>
                <div className="p-2 bg-[#011415] rounded text-sm">{selectedItem.description || '—'}</div>
                <div><strong>Espaço:</strong> {selectedItem.space}</div>
                <div><strong>Categoria:</strong> {selectedItem.category || '—'}</div>
                <div><strong>Metadados:</strong></div>
                <div className="space-y-2">
                  {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 ? (
                    Object.keys(selectedItem.metadata).map(k => (
                      <div key={k} className="flex flex-col">
                        <label className="text-xs text-gray-400">{k}</label>
                        <input readOnly value={String(selectedItem.metadata[k] ?? '')} className="p-2 bg-[#011415] rounded border border-white/6" />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">Sem metadados</div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>{ setShowViewModal(false); setSelectedItem(null); }} className="px-3 py-1 border rounded">Fechar</button>
                  <button onClick={()=>{ setShowViewModal(false); setSelectedItem(null); handleEditClick(selectedItem); }} className="px-3 py-1 bg-white/6 rounded">Editar</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showConfigModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Configurar cálculo de carga</h4>
                <button onClick={()=>setShowConfigModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-400">Fórmula</div>
                  <div className="p-2 bg-[#011415] rounded">Se o atributo base for menor ou igual a 0, capacidade = 0. Senão: (atributo base + atributo extra) * 5 + somatório dos modificadores fixos.</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-gray-400">Atributo base</label>
                  <select value={config.base_attribute} onChange={e=>setConfig(c=>({...c, base_attribute: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                    <option value="forca">forca</option>
                    <option value="agilidade">agilidade</option>
                    <option value="intelecto">intelecto</option>
                    <option value="vigor">vigor</option>
                    <option value="presenca">presenca</option>
                  </select>

                  <label className="text-xs text-gray-400">Atributo extra (opcional)</label>
                  <select value={config.extra_attribute} onChange={e=>setConfig(c=>({...c, extra_attribute: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                    <option value="">Nenhum</option>
                    {attributesList.map(a=> (<option key={a.key} value={a.key}>{a.key}</option>))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">Modificadores fixos</div>
                    <button onClick={handleAddModifier} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar</button>
                  </div>
                  <div className="space-y-2 mt-2 max-h-40 overflow-auto">
                    {(config.modifiers || []).map(m=> (
                      <div key={m.id} className="flex gap-2 items-center">
                        <input value={m.label} onChange={e=>setConfig(c=>({ ...c, modifiers: c.modifiers.map(x=> x.id===m.id?({...x, label: e.target.value}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                        <input type="number" value={m.value} onChange={e=>setConfig(c=>({ ...c, modifiers: c.modifiers.map(x=> x.id===m.id?({...x, value: Number(e.target.value)}):x) }))} className="p-2 bg-[#011415] text-white border border-white/6 rounded w-28" />
                        <button onClick={()=>handleRemoveModifier(m.id)} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400">Remover</button>
                      </div>
                    ))}
                    {(config.modifiers || []).length===0 ? <div className="text-sm text-gray-400">Nenhum modificador</div> : null}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={()=>setShowConfigModal(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button onClick={handleSaveConfig} className="px-3 py-1 bg-white/6 rounded">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* removed duplicate editable patrimonio area — use the read-only field + modal editor above */}
      </div>
    </div>
  );
}
