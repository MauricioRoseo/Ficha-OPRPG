"use client";

import React, { useEffect, useState } from "react";
import PericiaTemplatesModal from "./PericiaTemplatesModal";

export default function RituaisPanel({ character, attributes }) {
  const [rituais, setRituais] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const initialNew = { name: '', element: '', description: '', circle: 1, execution: '', alcance: '', duration: '', resistencia_pericia_id: null, resistencia_pericia_name: '', aprimoramento_discente: false, custo_aprimoramento_discente: '', descricao_aprimoramento_discente: '', aprimoramento_verdadeiro: false, custo_aprimoramento_verdadeiro: '', descricao_aprimoramento_verdadeiro: '', symbol_image: '', symbol_image_secondary: '' };
  const [newRitual, setNewRitual] = useState(initialNew);
  const [periciaModalOpen, setPericiaModalOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchRituais = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/rituals/character/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro fetching rituais');
      const data = await res.json();
      setRituais(data || []);
    } catch (e) { console.error(e); setRituais([]); }
  };

  useEffect(()=>{ fetchRituais(); }, [character?.id]);

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

  const getMaxCircleAccess = () => {
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
  };

  const handleAddFromCatalog = async (ritual) => {
    try {
      const limiteGasto = getCharacterLimiteGasto();
      const payload = {
        dt_resistencia: 10 + limiteGasto + (attributes?.presenca || 0),
        circulo: ritual.circle || ritual.circulo || 1,
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
      const payload = {
        name: newRitual.name,
        element: newRitual.element,
        description: newRitual.description,
        circulo: newRitual.circle || 1,
        execution: newRitual.execution || null,
        alcance: newRitual.alcance || null,
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
        dt_resistencia: 10 + limiteGasto + (attributes?.presenca || 0),
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
          </div>
        </div>

        
          <div className="mb-3 flex items-center gap-4">
            <div className="text-sm text-gray-400">DT de resistência:</div>
            <div className="font-mono">{10 + ((character && character.limite_gasto_pe) || attributes?.limite_gasto_pe || attributes?.intelecto || 0) + (attributes?.presenca || 0)}</div>
            <div className="text-sm text-gray-400 ml-4">Limite de rituais (Intelecto):</div>
            <div className="font-mono">{attributes?.intelecto || 1}</div>
            <div className="text-sm text-gray-400 ml-4">Nível acesso:</div>
            <div className="font-mono">Círculo {getMaxCircleAccess()}</div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rituais.map(r => (
            <div key={r.id} className="p-3 bg-[#011415] border border-white/6 rounded cursor-pointer flex gap-3" onClick={() => { setSelected(r); setShowDetail(true); }}>
              <div className="w-12 h-12 bg-[#021018] flex items-center justify-center rounded">
                {r.snapshot_symbol ? <img src={r.snapshot_symbol} alt={r.snapshot_name} className="w-full h-full object-contain" /> : <div className="text-xs text-gray-400">SÍM</div>}
              </div>
              <div>
                  <div className="font-semibold">{r.snapshot_name || r.snapshot_name}</div>
                <div className="text-xs text-gray-400">{r.snapshot_element || r.snapshot_element} • Círculo {r.circulo || '-'}</div>
              </div>
              <div className="ml-auto">
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
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Alvo / Área" value={newRitual.alcance} onChange={e=>setNewRitual(n=>({...n, alcance: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                  <input placeholder="Duração" value={newRitual.duration} onChange={e=>setNewRitual(n=>({...n, duration: e.target.value}))} className="p-2 bg-[#011415] text-white border border-white/6 rounded" />
                </div>
                <textarea placeholder="Descrição" value={newRitual.description} onChange={e=>setNewRitual(n=>({...n, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
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
                <div>
                  <button onClick={()=>setShowDetail(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
                </div>
              </div>

              <div className="space-y-3 mb-3">
                <div>
                  <div className="text-sm text-gray-400">Execução</div>
                  <div>{selected.snapshot_execution || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Alvo / Área</div>
                  <div>{selected.snapshot_alcance || '-'}</div>
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
                <div className="text-sm text-gray-400">Descrição</div>
                <div>{selected.snapshot_description || '-'}</div>
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
      </div>
    </div>
  );
}
