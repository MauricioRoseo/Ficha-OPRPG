"use client";

import React, { useState } from "react";
import ProtectionFormModal from "./ProtectionFormModal";
import ProtectionTemplatesModal from "./ProtectionTemplatesModal";

export default function ProtectionsPanel({ character, attributes, protections: initialProtections, resistances = {}, onCharacterUpdate, onResistancesUpdate }) {
  const data = attributes || character || {};
  const [protections, setProtections] = useState(initialProtections || []);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const toggleEquipped = async (protId, currentlyEquipped) => {
    // optimistic update
    setProtections((prev) => prev.map(p => p.id === protId ? { ...p, equipped: currentlyEquipped ? 0 : 1 } : p));

    try {
      const res = await fetch(`http://localhost:3001/protections/${protId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ equipped: currentlyEquipped ? 0 : 1 })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.defesa_passiva !== undefined && onCharacterUpdate) {
          onCharacterUpdate(prev => ({ ...prev, defesa_passiva: data.defesa_passiva }));
        }
          if (data.resistances && onResistancesUpdate) {
            onResistancesUpdate(data.resistances);
          }
      } else {
        // revert on error status
        setProtections((prev) => prev.map(p => p.id === protId ? { ...p, equipped: currentlyEquipped } : p));
      }
    } catch (e) {
      // revert on error
      setProtections((prev) => prev.map(p => p.id === protId ? { ...p, equipped: currentlyEquipped } : p));
    }
  };

  const handleCreated = (newProt) => {
    setProtections(prev => [newProt, ...prev]);
    // if backend returned new passive defense value in response, update parent
    if (newProt && newProt.defesa_passiva !== undefined && onCharacterUpdate) {
      onCharacterUpdate(prev => ({ ...prev, defesa_passiva: newProt.defesa_passiva }));
    }
    setShowAddModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover proteção?')) return;
    try {
      const res = await fetch(`http://localhost:3001/protections/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao remover proteção');
      setProtections(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e); alert('Erro ao remover');
    }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Proteções & Resistências</div>

      <div className="panel panel-protections p-4 rounded">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Lista de proteções vinculadas ao personagem</div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Adicionar proteção</button>
            <button onClick={() => setShowAddModal(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Criar manual</button>
          </div>
        </div>

        {(!protections || protections.length === 0) ? (
          <div className="text-sm text-gray-400">Ainda não há proteções dessa ficha.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="w-12">Eq</th>
                  <th>Nome</th>
                  <th className="w-24">Def. Pass.</th>
                  <th className="w-24">Resist.</th>
                  <th className="w-24">Penal.</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {protections.map((p) => (
                  <tr key={p.id} className="border-t border-white/6">
                    <td className="py-2">
                      <input type="checkbox" checked={Boolean(p.equipped)} onChange={() => toggleEquipped(p.id, Boolean(p.equipped))} />
                    </td>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.passive_defense ?? 0}</td>
                    <td className="py-2">{p.damage_resistance ?? 0}</td>
                    <td className="py-2">{p.encumbrance_penalty ?? 0}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-500" title="Remover">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 11v6M14 11v6"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Resistances display: normal damages and paranormal damages stacked */}
        <div className="mt-4">
          <div className="text-sm text-gray-400 mb-2">Resistência a danos</div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[
              ['acid', 'Ácido'],
              ['balistico', 'Balístico'],
              ['corte', 'Corte'],
              ['eletricidade', 'Eletricidade'],
              ['fogo', 'Fogo'],
              ['frio', 'Frio'],
              ['impacto', 'Impacto'],
              ['mental', 'Mental'],
              ['perfuracao', 'Perfuração'],
              ['veneno', 'Veneno']
            ].map(([key, label]) => (
              <div key={key} className="bg-white/3 rounded p-2 text-center">
                <div className="text-lg font-bold">{resistances[key] ?? 0}</div>
                <div className="text-xs text-gray-300">{label}</div>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-400 mb-2">Resistência a danos paranormais</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['morte', 'Morte'],
              ['sangue', 'Sangue'],
              ['energia', 'Energia'],
              ['conhecimento', 'Conhecimento']
            ].map(([key, label]) => (
              <div key={key} className="bg-white/3 rounded p-2 text-center">
                <div className="text-lg font-bold">{resistances[key] ?? 0}</div>
                <div className="text-xs text-gray-300">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ProtectionFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreated={handleCreated} characterId={character?.id} />
      <ProtectionTemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onCreateNew={() => { setShowTemplates(false); setShowAddModal(true); }} onUse={async (template) => {
        // call backend to copy template into protections
        try {
          const res = await fetch('http://localhost:3001/protections/from-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
            body: JSON.stringify({ template_id: template.id, character_id: character?.id })
          });
          if (!res.ok) throw new Error('Erro ao adicionar proteção do template');
          const data = await res.json();
          if (data.protection) {
            handleCreated({ ...data.protection, defesa_passiva: data.defesa_passiva });
            if (data.resistances && onResistancesUpdate) onResistancesUpdate(data.resistances);
          }
          setShowTemplates(false);
        } catch (e) {
          alert('Erro ao usar template');
          console.error(e);
        }
      }} />
    </div>
  );
}
