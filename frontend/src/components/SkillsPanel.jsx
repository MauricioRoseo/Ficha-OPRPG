"use client";

import React, { useEffect, useState } from "react";

export default function SkillsPanel({ character }) {
  const [skills, setSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', type: 'habilidade', origin: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchSkills = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/features/character/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar habilidades');
      const data = await res.json();
      // features grouped - take `habilidade` and `poder` etc. We will show all that are 'habilidade' or 'poder' or origem/trilha
      const grouped = data || {};
      const merged = [];
      ['habilidade','poder','origem','trilha','regra_casa'].forEach(k => {
        if (grouped[k] && grouped[k].length) merged.push(...grouped[k]);
      });
      setSkills(merged);
    } catch (e) { console.error(e); setSkills([]); }
  };

  useEffect(()=>{ fetchSkills(); }, [character?.id]);

  const searchFeatures = async (q) => {
    try {
      const res = await fetch(`http://localhost:3001/features/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar features');
      const data = await res.json();
      setCatalogResults(data || []);
    } catch (e) { console.error(e); setCatalogResults([]); }
  };

  const handleAddFromCatalog = async (feat) => {
    try {
      const res = await fetch(`http://localhost:3001/features/${character.id}/${feat.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error('Erro ao adicionar habilidade');
      setShowModal(false);
      fetchSkills();
    } catch (e) { console.error(e); alert('Erro ao adicionar habilidade'); }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/features', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(newSkill) });
      if (!res.ok) throw new Error('Erro ao criar habilidade');
      const json = await res.json();
      // immediately add to character
      await fetch(`http://localhost:3001/features/${character.id}/${json.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({}) });
      setShowCreate(false);
      setNewSkill({ name: '', description: '', type: 'habilidade' });
      fetchSkills();
    } catch (e) { console.error(e); alert('Erro ao criar habilidade'); }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Poderes de Origem, Classe, Geral e Paranormal</div>
      <div className="panel p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-400">Poderes de Origem, Classe, Geral e Paranormal</div>
          <div className="flex gap-2">
            <button onClick={()=>{ setShowModal(true); setCatalogResults([]); setSearchTerm(''); }} className="px-2 py-1 border border-white/10 rounded text-sm">Adicionar Habilidade</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {skills.map(s => (
            <div key={s.id} className="p-3 bg-[#011415] border border-white/6 rounded">
              <div className="text-sm text-gray-300">({s.origin || s.template_name || s.metadata?.source || 'Origem desconhecida'} - {s.name}). {s.description || s.template_description || '-'}</div>
            </div>
          ))}
        </div>

        {/* Modal pesquisar */}
        {showModal ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Buscar poder</h4>
                <button onClick={()=>setShowModal(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
                    <div className="mb-3">
                      <input placeholder="Pesquisar poderes por nome" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); searchFeatures(e.target.value); }} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                    </div>
                    <div className="max-h-48 overflow-auto mb-3">
                      {catalogResults.map(c => (
                        <div key={c.id} className="p-2 border-b border-white/6 flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.description}</div>
                          </div>
                          <div>
                            <button onClick={()=>handleAddFromCatalog(c)} className="px-2 py-1 border border-white/10 rounded">Adicionar</button>
                          </div>
                        </div>
                      ))}
                      {catalogResults.length === 0 && <div className="text-sm text-gray-400">Nenhum resultado</div>}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={()=>{ setShowCreate(true); setShowModal(false); }} className="px-2 py-1 border border-white/10 rounded text-sm">Outra Habilidade</button>
                    </div>
            </div>
          </div>
        ) : null}

        {/* Modal criar nova habilidade */}
        {showCreate ? (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="bg-[#021018] p-4 rounded w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold">Criar nova habilidade</h4>
                <button onClick={()=>setShowCreate(false)} className="px-2 py-1 border border-white/10 rounded">Fechar</button>
              </div>
              <form onSubmit={handleCreateSkill} className="space-y-2">
                <input required placeholder="Nome" value={newSkill.name} onChange={e=>setNewSkill(n=>({...n, name: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <input placeholder="Origem / Fonte" value={newSkill.origin} onChange={e=>setNewSkill(n=>({...n, origin: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <textarea placeholder="Descrição" value={newSkill.description} onChange={e=>setNewSkill(n=>({...n, description: e.target.value}))} className="w-full p-2 bg-[#011415] text-white border border-white/6 rounded" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={()=>setShowCreate(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button className="px-3 py-1 bg-white/6 rounded">Criar e adicionar</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
