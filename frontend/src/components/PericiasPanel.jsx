"use client";

import React, { useEffect, useState } from "react";
import PericiaTemplatesModal from "./PericiaTemplatesModal";

export default function PericiasPanel({ character, attributes }) {
  const data = attributes || character || {};
  const [pericias, setPericias] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchCharacterPericias = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/features/character/${character.id}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar perícias do personagem');
      const grouped = await res.json();
      setPericias(grouped.pericia || []);
    } catch (e) {
      console.error(e);
      setPericias([]);
    }
  };

  useEffect(() => { fetchCharacterPericias(); }, [character?.id, character?.defesa_passiva]);

  const handleUseTemplate = async (template) => {
    try {
      const res = await fetch('http://localhost:3001/features/' + character.id + '/' + template.id, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Erro ao adicionar perícia');
      await fetchCharacterPericias();
      setShowTemplates(false);
    } catch (e) {
      alert('Erro ao adicionar perícia');
      console.error(e);
    }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Perícias</div>

      <div className="panel panel-pericias p-4 rounded">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Perícias vinculadas ao personagem</div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Adicionar perícia</button>
            <button onClick={() => setShowAdd(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Criar manual</button>
          </div>
        </div>

        {(!pericias || pericias.length === 0) ? (
          <div className="text-sm text-gray-400">Ainda não há perícias vinculadas ao personagem.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th>Nome</th>
                  <th>Atributo</th>
                  <th className="w-28">Nível Trein.</th>
                  <th className="w-20">Bônus Extra</th>
                  <th className="w-24">Penal. Carga</th>
                  <th className="w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {pericias.map(p => (
                  <tr key={p.id} className="border-t border-white/6">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.metadata?.atributo || '-'}</td>
                    <td className="py-2">{p.training_level}</td>
                    <td className="py-2">{p.extra ?? 0}</td>
                    <td className="py-2">{p.penalidade_carga ? (p.encumbrance_penalty ?? 0) : '-'}</td>
                    <td className="py-2">{p.total ?? ( (p.value||0) + (p.extra||0) )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PericiaTemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onUse={handleUseTemplate} onCreateNew={() => { setShowTemplates(false); setShowAdd(true); }} />

      {/* simple manual create: reuse existing feature creation endpoint for type 'pericia' */}
      {showAdd ? (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Criar Perícia Manualmente</h3>
            {/* small form; on submit POST /features then add to character */}
              <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.target);
              const penalidadeFlag = f.get('penalidade_carga');
              const payload = {
                name: f.get('name'),
                type: 'pericia',
                description: f.get('description'),
                // legacy metadata kept for attribute mapping, but encumbrance handled via top-level fields
                metadata: { atributo: f.get('atributo') },
                has_encumbrance_penalty: penalidadeFlag ? 1 : 0,
                encumbrance_penalty: penalidadeFlag ? Number(penalidadeFlag) : null
              };
              try {
                const r = await fetch('http://localhost:3001/features', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
                if (!r.ok) throw new Error('Erro ao criar pericia');
                // get id
                const created = await r.json();
                // add to character
                const add = await fetch(`http://localhost:3001/features/${character.id}/${created.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({}) });
                if (!add.ok) throw new Error('Erro ao vincular pericia');
                await fetchCharacterPericias();
                setShowAdd(false);
              } catch (err) {
                alert('Erro ao criar e vincular perícia');
                console.error(err);
              }
            }} className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <input name="name" required className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Atributo base</label>
                <input name="atributo" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Descrição</label>
                <textarea name="description" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="penalidade_carga" type="number" placeholder="Penalidade carga" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
                <input name="extra_bonus" type="number" placeholder="Bônus extra" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>setShowAdd(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                <button className="px-3 py-1 bg-white/6 rounded">Criar e Vincular</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
