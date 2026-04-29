"use client";

import React, { useEffect, useState } from "react";
import PericiaTemplatesModal from "./PericiaTemplatesModal";

export default function RituaisPanel({ character, attributes, editable = false }) {
  const [rituais, setRituais] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showModifiers, setShowModifiers] = useState(false);
  const [modifiers, setModifiers] = useState([]);
  const initialNew = { name: '', element: '', description: '', circle: 1, execution: '', alcance: '', duration: '', resistencia_pericia_id: null, resistencia_pericia_name: '', aprimoramento_discente: false, custo_aprimoramento_discente: '', descricao_aprimoramento_discente: '', aprimoramento_verdadeiro: false, custo_aprimoramento_verdadeiro: '', descricao_aprimoramento_verdadeiro: '', symbol_image: '', symbol_image_secondary: '' };
  // include effect and alvo fields
  initialNew.effect = '';
  initialNew.alvo = '';
  const [newRitual, setNewRitual] = useState(initialNew);
  const [periciaModalOpen, setPericiaModalOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(getMaxCircleAccess());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // initialize selectedCircle and modifiers from server (character.status_formula) or fallback to localStorage
  useEffect(()=>{
    if (!character?.id) return;
    try {
      const sf = character.status_formula ? (typeof character.status_formula === 'string' ? JSON.parse(character.status_formula) : character.status_formula) : null;
      if (sf && sf.rituals && sf.rituals.selected_circle) {
        setSelectedCircle(Number(sf.rituals.selected_circle));
      } else {
        const key = `ritual_selected_circle_${character.id}`;
        const v = localStorage.getItem(key);
        if (v) setSelectedCircle(Number(v));
      }

      if (sf && sf.rituals && Array.isArray(sf.rituals.dt_modifiers)) {
        setModifiers(sf.rituals.dt_modifiers || []);
      } else {
        const key2 = `ritual_dt_modifiers_${character.id}`;
        const raw = localStorage.getItem(key2);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setModifiers(parsed);
        }
      }
    } catch(e) { /* ignore */ }
  }, [character?.id]);

  // persist selectedCircle to localStorage whenever it changes (immediate local persistence)
  useEffect(()=>{
    if (!character?.id) return;
    try { localStorage.setItem(`ritual_selected_circle_${character.id}`, String(selectedCircle)); } catch(e){}
  }, [selectedCircle, character?.id]);

  // autosave selectedCircle and modifiers to server (debounced)
  useEffect(()=>{
    if (!character?.id) return;
    const handler = setTimeout(async ()=>{
      try {
        const sf = character.status_formula ? (typeof character.status_formula === 'string' ? JSON.parse(character.status_formula) : character.status_formula) : {};
        const newSf = { ...(sf || {}), rituals: { ...(sf && sf.rituals ? sf.rituals : {}), selected_circle: selectedCircle, dt_modifiers: modifiers } };
        // persist locally as well
        try { localStorage.setItem(`ritual_dt_modifiers_${character.id}`, JSON.stringify(modifiers || [])); } catch(e){}

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`http://localhost:3001/characters/${character.id}/details`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ status_formula: newSf }) });
        if (!res.ok) {
          console.error('Falha ao salvar configurações de rituais no servidor');
        } else {
          // notify other parts of the app that character status_formula changed
          try { window.dispatchEvent(new CustomEvent('character:status_formula_updated', { detail: { characterId: character.id, status_formula: newSf } })); } catch(e){}
        }
      } catch (err) { console.error('Erro autosaving ritual settings', err); }
    }, 600);
    return ()=>clearTimeout(handler);
  }, [selectedCircle, modifiers, character?.id]);

  const computeBaseDt = () => {
    return 10 + (Number(character?.nivel) || 0) + (Number(attributes?.presenca) || 0);
  };

  const computeDisplayedDt = () => {
    // DT shown is always base (10 + level + presenca) plus panel-level modifiers
    const base = computeBaseDt();
    const totalMods = (modifiers || []).reduce((s,m)=>s + (Number(m.value)||0), 0);
    return base + totalMods;
  };

  const fetchRituais = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/rituals/character/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro fetching rituais');
      const data = await res.json();
      setRituais(data || []);
      // if we have a selected ritual, refresh it from new data so DT and modifiers display update
      if (selected && selected.id) {
          const found = (data || []).find(x => x.id === selected.id);
          if (found) {
            setSelected(found);
            // Do not override panel-level modifiers from ritual data. Modifiers are global to DT.
          }
        }
    } catch (e) { console.error(e); setRituais([]); }
  };

  useEffect(()=>{ fetchRituais(); }, [character?.id]);

  // listen for external events indicating a ritual was added elsewhere (e.g., levelUp)
  useEffect(() => {
    const handler = (ev) => {
      try {
        const cid = ev && ev.detail && ev.detail.characterId;
        if (!cid || Number(cid) !== Number(character?.id)) return;
        fetchRituais();
      } catch (e) { }
    };
    window.addEventListener('character:ritual_added', handler);
    return () => window.removeEventListener('character:ritual_added', handler);
  }, [character?.id]);

  const searchCatalog = async (q) => {
    try {
      const res = await fetch(`http://localhost:3001/rituals/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro buscar catálogo');
      const data = await res.json();
      setCatalogResults(data || []);
    } catch (e) { console.error(e); setCatalogResults([]); }
  };

  const getCharacterLimiteGasto = () => {
    return (character && character.limite_gasto_pe) || attributes?.limite_gasto_pe || attributes?.intelecto || 0;
  };

  function getMaxCircleAccess() {
    const lvl = character?.nivel || 1;
    const cls = (character?.classe || '').toLowerCase();
    // Ocultista progression
    if (cls.includes('ocult')) {
      if (lvl >= 17) return 4;
      if (lvl >= 11) return 3;
      if (lvl >= 5) return 2;
      return 1;
    }

    // Combatente or Especialista progression
    if (cls.includes('combat') || cls.includes('especial')) {
      if (lvl >= 15) return 3;
      if (lvl >= 9) return 2;
      return 1;
    }

    // Default (safe fallback similar to ocultista)
    if (lvl >= 17) return 4;
    if (lvl >= 11) return 3;
    if (lvl >= 5) return 2;
    return 1;
  }

  const handleAddFromCatalog = async (ritual) => {
    try {
      const limiteGasto = getCharacterLimiteGasto();
      const totalMods = (modifiers || []).reduce((s,m)=>s + (Number(m.value)||0), 0);
      const payload = {
        dt_resistencia: computeBaseDt() + totalMods,
        circulo: selectedCircle || ritual.circle || ritual.circulo || 1,
        limite_rituais: attributes?.intelecto || 1
      };
      const res = await fetch(`http://localhost:3001/rituals/character/${character.id}/${ritual.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao adicionar ritual');
      setShowModal(false);
      fetchRituais();
    } catch (e) { console.error(e); alert('Erro ao adicionar ritual'); }
  };

  const handleCreateRitual = async (e) => {
    e.preventDefault();
    try {
      const limiteGasto = getCharacterLimiteGasto();
      const totalMods = (modifiers || []).reduce((s,m)=>s + (Number(m.value)||0), 0);
      const payload = {
        name: newRitual.name,
        element: newRitual.element,
        description: newRitual.description,
  circulo: selectedCircle || newRitual.circle || 1,
        execution: newRitual.execution || null,
        effect: newRitual.effect || null,
        alcance: newRitual.alcance || null,
        alvo: newRitual.alvo || null,
        duration: newRitual.duration || null,
        resistencia_pericia_id: newRitual.resistencia_pericia_id || null,
        resistencia_pericia_name: newRitual.resistencia_pericia_name || null,
        aprimoramento_discente: newRitual.aprimoramento_discente ? 1 : 0,
        custo_aprimoramento_discente: newRitual.custo_aprimoramento_discente || null,
        descricao_aprimoramento_discente: newRitual.descricao_aprimoramento_discente || null,
        aprimoramento_verdadeiro: newRitual.aprimoramento_verdadeiro ? 1 : 0,
        custo_aprimoramento_verdadeiro: newRitual.custo_aprimoramento_verdadeiro || null,
        descricao_aprimoramento_verdadeiro: newRitual.descricao_aprimoramento_verdadeiro || null,
        symbol_image: newRitual.symbol_image || null,
        symbol_image_secondary: newRitual.symbol_image_secondary || null,
        dt_resistencia: computeBaseDt() + totalMods,
        limite_rituais: attributes?.intelecto || 1,
      };
      const res = await fetch(`http://localhost:3001/rituals/character/${character.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro criar ritual');
      setShowCreate(false);
      setNewRitual(initialNew);
      fetchRituais();
    } catch (e) { console.error(e); alert('Erro ao criar ritual'); }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remover ritual?')) return;
    try {
      const res = await fetch(`http://localhost:3001/rituals/character/${character.id}/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro remover ritual');
      fetchRituais();
    } catch (e) { console.error(e); alert('Erro ao remover ritual'); }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Rituais Conhecidos</div>
      <div className="panel p-3">
        <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-gray-400">Rituais conhecidos e limites</div>
            <div className="flex gap-2">
              <button onClick={()=>{ setShowModal(true); setCatalogResults([]); setSearchTerm(''); }} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar Ritual</button>
              {editable ? (
                <button onClick={()=>{ setShowModifiers(true); }} className="px-2 py-1 border border-white/10 rounded text-sm">Config</button>
              ) : null}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-4">
            <div className="text-sm text-gray-400">DT de resistência:</div>
            <div className="font-mono">{computeDisplayedDt()}</div>
            <div className="text-sm text-gray-400 ml-4">Limite de rituais (Intelecto):</div>
            <div className="font-mono">{attributes?.intelecto || 1}</div>
            <div className="text-sm text-gray-400 ml-4">Nível acesso:</div>
            <div>
              {editable ? (
                <select value={selectedCircle} onChange={e=>setSelectedCircle(Number(e.target.value))} className="p-1 bg-[#011415] border border-white/6 rounded">
                  {[1,2,3,4].map(c => (<option key={c} value={c}>{`${c}° Círculo`}</option>))}
                </select>
              ) : (
                <div className="font-mono">Círculo {selectedCircle || getMaxCircleAccess()}</div>
              )}
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rituais.map(r => (
            <div key={r.id} className="p-3 bg-[#011415] border border-white/6 rounded cursor-pointer flex gap-3" onClick={() => { setSelected(r); if (editable) { setEditMode(true); setEditForm({ name: r.snapshot_name, element: r.snapshot_element, description: r.snapshot_description, effect: r.snapshot_effect, execution: r.snapshot_execution, alcance: r.snapshot_alcance, alvo: r.snapshot_alvo, duration: r.snapshot_duration, circulo: r.circulo, dt_resistencia: r.dt_resistencia || r.snapshot_dt_resistencia || 0, symbol_image: r.snapshot_symbol || r.symbol || '', symbol_image_secondary: r.snapshot_symbol_secondary || '', resistencia_pericia_id: r.snapshot_resistencia_pericia_id || null, resistencia_pericia_name: r.snapshot_resistencia_pericia_name || null, aprimoramento_discente: r.snapshot_aprimoramento_discente || 0, custo_aprimoramento_discente: r.snapshot_custo_aprimoramento_discente || null, descricao_aprimoramento_discente: r.snapshot_descricao_aprimoramento_discente || null, aprimoramento_verdadeiro: r.snapshot_aprimoramento_verdadeiro || 0, custo_aprimoramento_verdadeiro: r.snapshot_custo_aprimoramento_verdadeiro || null, descricao_aprimoramento_verdadeiro: r.snapshot_descricao_aprimoramento_verdadeiro || null }); } else { setShowDetail(true); } }}>
              <div className="w-12 h-12 bg-[#021018] flex items-center justify-center rounded">
                {r.snapshot_symbol ? <img src={r.snapshot_symbol} alt={r.snapshot_name} className="w-full h-full object-contain" /> : <div className="text-xs text-gray-400">SÍM</div>}
              </div>
              <div>
            <div className="font-semibold">{r.snapshot_name || r.snapshot_name}</div>
                <div className="text-xs text-gray-400">
                  {r.snapshot_element || r.snapshot_element} • Círculo <span className="ml-1">{r.circulo || '-'}</span>
                </div>
                  <div className="mt-1 text-xs text-gray-300">
                    {r.snapshot_effect ? (r.snapshot_effect.length > 80 ? r.snapshot_effect.slice(0, 80) + '...' : r.snapshot_effect) : (r.snapshot_description ? (r.snapshot_description.length > 80 ? r.snapshot_description.slice(0, 80) + '...' : r.snapshot_description) : '')}
                  </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={(e)=>{ e.stopPropagation(); handleRemove(r.id); }} className="px-2 py-1 border border-white/10 rounded text-sm">Remover</button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal buscar catálogo */}
        {showModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Buscar rituais</h4>
                <button onClick={()=>setShowModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <div className="mb-3">
                <input placeholder="Pesquisar rituais por nome ou elemento" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); searchCatalog(e.target.value); }} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
              </div>
              <div className="max-h-48 overflow-auto mb-3">
                {catalogResults.map(c => (
                  <div key={c.id} className="p-2 border-b border-white/6 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.element} • Círculo {c.circle}</div>
                    </div>
                    <div>
                      <button onClick={()=>handleAddFromCatalog(c)} className="px-2 py-1 border border-white/10 rounded">Adicionar</button>
                    </div>
                  </div>
                ))}
                {catalogResults.length === 0 && <div className="text-sm text-gray-400">Nenhum resultado</div>}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={()=>{ setShowCreate(true); setShowModal(false); }} className="px-2 py-1 border border-white/10 rounded text-sm">Outro Ritual</button>
              </div>
            </div>
          </div>
        ) : null}

        <PericiaTemplatesModal isOpen={periciaModalOpen} onClose={()=>setPericiaModalOpen(false)} onUse={(p)=>{ setNewRitual(n=>({...n, resistencia_pericia_id: p.id, resistencia_pericia_name: p.name })); setPericiaModalOpen(false); }} />

        {/* Modal criar novo ritual */}
        {showCreate ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Criar novo ritual</h4>
                <button onClick={()=>setShowCreate(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <form onSubmit={handleCreateRitual} className="space-y-2">
                <input required placeholder="Nome" value={newRitual.name} onChange={e=>setNewRitual(n=>({...n, name: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <select value={newRitual.element} onChange={e=>setNewRitual(n=>({...n, element: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded">
                  <option value="">Elemento (selecionar)</option>
                  <option value="Sangue">Sangue</option>
                  <option value="Morte">Morte</option>
                  <option value="Conhecimento">Conhecimento</option>
                  <option value="Energia">Energia</option>
                  <option value="Medo">Medo</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={newRitual.circle} onChange={e=>setNewRitual(n=>({...n, circle: Number(e.target.value)}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                    <option value={1}>1°</option>
                    <option value={2}>2°</option>
                    <option value={3}>3°</option>
                    <option value={4}>4°</option>
                  </select>
                  <div>
                    <label className="text-xs text-gray-400">Resistência (perícia)</label>
                    <div className="flex gap-2 mt-1">
                      <button type="button" onClick={()=>setPericiaModalOpen(true)} className="px-2 py-1 border border-white/10 rounded text-sm">Escolher perícia</button>
                      <div className="px-2 py-1 bg-[#011415] text-sm rounded">{newRitual.resistencia_pericia_name || 'Nenhuma'}</div>
                    </div>
                  </div>
                </div>
                <input placeholder="Execução" value={newRitual.execution} onChange={e=>setNewRitual(n=>({...n, execution: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <textarea placeholder="Efeito" value={newRitual.effect || ''} onChange={e=>setNewRitual(n=>({...n, effect: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded mt-2" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input placeholder="Alcance" value={newRitual.alcance} onChange={e=>setNewRitual(n=>({...n, alcance: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <input placeholder="Alvo / Área" value={newRitual.alvo || ''} onChange={e=>setNewRitual(n=>({...n, alvo: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>
                <input placeholder="Duração" value={newRitual.duration} onChange={e=>setNewRitual(n=>({...n, duration: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded mt-2" />
                <textarea placeholder="Descrição" value={newRitual.description} onChange={e=>setNewRitual(n=>({...n, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded mt-2" />
                {/* resistência vinculada a perícia via modal */}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Discente - custo</label>
                    <input placeholder="Custo (PE)" value={newRitual.custo_aprimoramento_discente} onChange={e=>setNewRitual(n=>({...n, custo_aprimoramento_discente: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Discente - descrição</label>
                    <input placeholder="Descrição" value={newRitual.descricao_aprimoramento_discente} onChange={e=>setNewRitual(n=>({...n, descricao_aprimoramento_discente: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Verdadeiro - custo</label>
                    <input placeholder="Custo (PE)" value={newRitual.custo_aprimoramento_verdadeiro} onChange={e=>setNewRitual(n=>({...n, custo_aprimoramento_verdadeiro: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Verdadeiro - descrição</label>
                    <input placeholder="Descrição" value={newRitual.descricao_aprimoramento_verdadeiro} onChange={e=>setNewRitual(n=>({...n, descricao_aprimoramento_verdadeiro: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Imagem símbolo principal (URL)" value={newRitual.symbol_image} onChange={e=>setNewRitual(n=>({...n, symbol_image: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <input placeholder="Imagem símbolo secundário (URL)" value={newRitual.symbol_image_secondary} onChange={e=>setNewRitual(n=>({...n, symbol_image_secondary: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setShowCreate(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button className="px-3 py-1 bg-white/6 rounded">Criar e adicionar</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Modal detalhe ritual */}
        {showDetail && selected ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-[#021018] flex items-center justify-center rounded overflow-hidden">
                    {selected.snapshot_symbol ? <img src={selected.snapshot_symbol} alt={selected.snapshot_name} className="w-full h-full object-contain" /> : <div className="text-xs text-gray-400">SÍM</div>}
                  </div>
                  {selected.snapshot_symbol_secondary ? (
                    <div className="w-12 h-12 bg-[#021018] flex items-center justify-center rounded overflow-hidden">
                      <img src={selected.snapshot_symbol_secondary} alt={`${selected.snapshot_name} secondary`} className="w-full h-full object-contain" />
                    </div>
                  ) : null}
                  <div>
                    <h4 className="font-bold text-lg">{selected.snapshot_name}</h4>
                    <div className="text-sm text-gray-400">{(selected.snapshot_element || '-') + ' • Círculo ' + (selected.circulo || '-')}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                    {editable ? (
                      <>
                        <button onClick={() => {
                          // open edit form prefilled
                          setEditMode(true);
                          setEditForm({
                            name: selected.snapshot_name,
                            element: selected.snapshot_element,
                            description: selected.snapshot_description,
                            effect: selected.snapshot_effect,
                            execution: selected.snapshot_execution,
                            alcance: selected.snapshot_alcance,
                            alvo: selected.snapshot_alvo,
                            duration: selected.snapshot_duration,
                            // circulo and dt_resistencia are NOT edited here per requirements
                            symbol_image: selected.snapshot_symbol || selected.symbol || selected.snapshot_symbol,
                            symbol_image_secondary: selected.snapshot_symbol_secondary || '' ,
                            resistencia_pericia_id: selected.snapshot_resistencia_pericia_id || null,
                            resistencia_pericia_name: selected.snapshot_resistencia_pericia_name || null,
                            aprimoramento_discente: selected.snapshot_aprimoramento_discente || 0,
                            custo_aprimoramento_discente: selected.snapshot_custo_aprimoramento_discente || null,
                            descricao_aprimoramento_discente: selected.snapshot_descricao_aprimoramento_discente || null,
                            aprimoramento_verdadeiro: selected.snapshot_aprimoramento_verdadeiro || 0,
                            custo_aprimoramento_verdadeiro: selected.snapshot_custo_aprimoramento_verdadeiro || null,
                            descricao_aprimoramento_verdadeiro: selected.snapshot_descricao_aprimoramento_verdadeiro || null
                          });
                        }} className="px-2 py-1 border border-white/10 rounded">Editar</button>
                      </>
                    ) : null}
                  <button onClick={()=>setShowDetail(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
                </div>
              </div>

              <div className="space-y-3 mb-3">
                <div>
                  <div className="text-sm text-gray-400">Execução</div>
                  <div>{selected.snapshot_execution || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Alcance</div>
                  <div>{selected.snapshot_alcance || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Alvo / Área</div>
                  <div>{selected.snapshot_alvo || selected.snapshot_alcance || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Duração</div>
                  <div>{selected.snapshot_duration || '-'}</div>
                </div>
                {selected.snapshot_resistencia_pericia_name ? (
                  <div>
                    <div className="text-sm text-gray-400">Resistência</div>
                    <div>{selected.snapshot_resistencia_pericia_name}</div>
                  </div>
                ) : null}
              </div>

              <div className="mb-3">
                  <div className="text-sm text-gray-400">Efeito</div>
                <div>{selected.snapshot_effect || selected.snapshot_description || '-'}</div>
              </div>

              <div className="mt-3 space-y-2">
                { (selected.snapshot_aprimoramento_discente || selected.snapshot_custo_aprimoramento_discente || selected.snapshot_descricao_aprimoramento_discente) ? (
                  <div>
                    <div className="text-sm text-gray-400">Discente</div>
                    <div className="text-sm">{selected.snapshot_custo_aprimoramento_discente ? `+${selected.snapshot_custo_aprimoramento_discente} PE` : '-'}: {selected.snapshot_descricao_aprimoramento_discente || '-'}</div>
                  </div>
                ) : null }

                { (selected.snapshot_aprimoramento_verdadeiro || selected.snapshot_custo_aprimoramento_verdadeiro || selected.snapshot_descricao_aprimoramento_verdadeiro) ? (
                  <div>
                    <div className="text-sm text-gray-400">Verdadeiro</div>
                    <div className="text-sm">{selected.snapshot_custo_aprimoramento_verdadeiro ? `+${selected.snapshot_custo_aprimoramento_verdadeiro} PE` : '-'}: {selected.snapshot_descricao_aprimoramento_verdadeiro || '-'}</div>
                  </div>
                ) : null }
              </div>
            </div>
          </div>
        ) : null}

        {/* Edit modal inside detail */}
        {editMode && editForm ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-60">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Editar Ritual</h4>
                <div className="flex gap-2">
                  <button onClick={()=>{ setEditMode(false); setEditForm(null); }} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
                </div>
              </div>
              <form onSubmit={async (e)=>{ e.preventDefault();
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  const payload = {
                    snapshot_name: editForm.name,
                    snapshot_element: editForm.element,
                    snapshot_description: editForm.description,
                      snapshot_effect: editForm.effect || null,
                      snapshot_execution: editForm.execution,
                      snapshot_alcance: editForm.alcance,
                      snapshot_alvo: editForm.alvo || null,
                      snapshot_duration: editForm.duration,
                    snapshot_resistencia_pericia_id: editForm.resistencia_pericia_id || null,
                    snapshot_resistencia_pericia_name: editForm.resistencia_pericia_name || null,
                    snapshot_aprimoramento_discente: editForm.aprimoramento_discente ? 1 : 0,
                    snapshot_custo_aprimoramento_discente: editForm.custo_aprimoramento_discente || null,
                    snapshot_descricao_aprimoramento_discente: editForm.descricao_aprimoramento_discente || null,
                    snapshot_aprimoramento_verdadeiro: editForm.aprimoramento_verdadeiro ? 1 : 0,
                    snapshot_custo_aprimoramento_verdadeiro: editForm.custo_aprimoramento_verdadeiro || null,
                    snapshot_descricao_aprimoramento_verdadeiro: editForm.descricao_aprimoramento_verdadeiro || null,
                    snapshot_symbol: editForm.symbol_image || null,
                    snapshot_symbol_secondary: editForm.symbol_image_secondary || null
                  };
                  const res = await fetch(`http://localhost:3001/rituals/character/${character.id}/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
                  if (!res.ok) throw new Error('Erro ao salvar');
                  setEditMode(false); setEditForm(null); setShowDetail(false); fetchRituais();
                } catch (err) { console.error(err); alert('Erro ao salvar ritual'); }
              }} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Nome" value={editForm.name} onChange={e=>setEditForm(f=>({...f, name: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <select value={editForm.element || ''} onChange={e=>setEditForm(f=>({...f, element: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded">
                    <option value="">Elemento (selecionar)</option>
                    <option value="Sangue">Sangue</option>
                    <option value="Morte">Morte</option>
                    <option value="Conhecimento">Conhecimento</option>
                    <option value="Energia">Energia</option>
                    <option value="Medo">Medo</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Execução" value={editForm.execution || ''} onChange={e=>setEditForm(f=>({...f, execution: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <input placeholder="Alcance" value={editForm.alcance || ''} onChange={e=>setEditForm(f=>({...f, alcance: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>
                <div>
                  <textarea placeholder="Efeito" value={editForm.effect || ''} onChange={e=>setEditForm(f=>({...f, effect: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded mb-2" />
                  <textarea placeholder="Descrição" value={editForm.description || ''} onChange={e=>setEditForm(f=>({...f, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Alvo / Área" value={editForm.alvo || ''} onChange={e=>setEditForm(f=>({...f, alvo: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <div />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Imagem símbolo principal (URL)" value={editForm.symbol_image || ''} onChange={e=>setEditForm(f=>({...f, symbol_image: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <input placeholder="Imagem símbolo secundário (URL)" value={editForm.symbol_image_secondary || ''} onChange={e=>setEditForm(f=>({...f, symbol_image_secondary: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Discente - custo</label>
                    <input placeholder="Custo (PE)" value={editForm.custo_aprimoramento_discente || ''} onChange={e=>setEditForm(f=>({...f, custo_aprimoramento_discente: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Discente - descrição</label>
                    <input placeholder="Descrição" value={editForm.descricao_aprimoramento_discente || ''} onChange={e=>setEditForm(f=>({...f, descricao_aprimoramento_discente: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Verdadeiro - custo</label>
                    <input placeholder="Custo (PE)" value={editForm.custo_aprimoramento_verdadeiro || ''} onChange={e=>setEditForm(f=>({...f, custo_aprimoramento_verdadeiro: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Aprimoramento Verdadeiro - descrição</label>
                    <input placeholder="Descrição" value={editForm.descricao_aprimoramento_verdadeiro || ''} onChange={e=>setEditForm(f=>({...f, descricao_aprimoramento_verdadeiro: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>{ setEditMode(false); setEditForm(null); }} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button className="px-3 py-1 bg-white/6 rounded">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Modifiers modal */}
        {showModifiers ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-60">
            <div className="bg-[#021018] p-4 rounded w-full max-w-md">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Configurar modificadores DT</h4>
                <button onClick={()=>setShowModifiers(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto mb-3">
                {modifiers.map((m, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input placeholder="Etiqueta" value={m.label} onChange={e=>setModifiers(prev => { const copy = [...prev]; copy[idx] = {...copy[idx], label: e.target.value}; return copy; })} className="flex-1 p-2 bg-[#011415] text-white border border-white/6 rounded" />
                    <input type="number" value={m.value} onChange={e=>setModifiers(prev => { const copy = [...prev]; copy[idx] = {...copy[idx], value: Number(e.target.value)}; return copy; })} className="w-20 p-2 bg-[#011415] text-white border border-white/6 rounded text-center" />
                    <button onClick={()=>setModifiers(prev=>prev.filter((_,i)=>i!==idx))} className="px-2 py-1 border border-white/10 rounded">Rem</button>
                  </div>
                ))}
                {modifiers.length === 0 && <div className="text-sm text-gray-400">Nenhum modificador</div>}
              </div>
              <div className="flex gap-2 mb-3">
                <button onClick={()=>setModifiers(prev=>[...prev, { label: '', value: 0 }])} className="px-2 py-1 border border-white/10 rounded">Adicionar modificador</button>
                <div className="ml-auto font-mono">Total: { (modifiers.reduce((s,m)=>s + (Number(m.value)||0), 0)) }</div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={async ()=>{
                  // save modifiers to localStorage as panel-level DT modifiers and update displayed DT
                  try {
                    const key = `ritual_dt_modifiers_${character.id}`;
                    localStorage.setItem(key, JSON.stringify(modifiers || []));
                    setShowModifiers(false);
                    // no server call here: the DT is a client-side panel config (can be persisted server-side in a follow-up)
                  } catch (err) { console.error(err); alert('Falha ao salvar modificadores'); }
                }} className="px-3 py-1 bg-white/6 rounded">Salvar</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
