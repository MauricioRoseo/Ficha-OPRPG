"use client";

import React, { useState } from "react";
import ProtectionFormModal from "./ProtectionFormModal";

export default function ProtectionsPanel({ character, attributes, protections: initialProtections, onCharacterUpdate }) {
  const data = attributes || character || {};
  const [protections, setProtections] = useState(initialProtections || []);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div>
      <div className="mb-3 stat-label">Proteções & Resistências</div>

      <div className="panel panel-protections p-4 rounded">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Lista de proteções vinculadas ao personagem</div>
          <button onClick={() => setShowAddModal(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Adicionar proteção</button>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ProtectionFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreated={handleCreated} characterId={character?.id} />
    </div>
  );
}
