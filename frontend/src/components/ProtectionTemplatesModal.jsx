"use client";

import React, { useEffect, useState } from "react";

export default function ProtectionTemplatesModal({ isOpen, onClose, onUse, onCreateNew }) {
  const [templates, setTemplates] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/protections/templates', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Erro ao buscar templates');
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e) {
        console.error(e);
        setTemplates([]);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Selecionar Proteção (Templates)</h3>
          <div className="flex gap-2">
            <button onClick={onCreateNew} className="px-2 py-1 border border-white/10 rounded text-sm">Cadastrar nova</button>
            <button onClick={onClose} className="px-2 py-1 border border-white/10 rounded text-sm">Fechar</button>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-sm text-gray-400">Nenhum template cadastrado.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {templates.map(t => (
              <div key={t.id} className="p-3 border border-white/6 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.description}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm">Def. {t.passive_defense ?? 0} • Res {t.damage_resistance ?? 0}</div>
                  <button onClick={() => onUse && onUse(t)} className="px-2 py-1 bg-white/6 rounded text-sm">Usar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
