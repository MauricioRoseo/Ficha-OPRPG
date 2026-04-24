"use client";

import React, { useEffect, useState } from "react";

export default function PericiaTemplatesModal({ isOpen, onClose, onUse }) {
  const [templates, setTemplates] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/features', { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        if (!res.ok) throw new Error('Erro ao buscar features');
        const all = await res.json();
        // filter pericias
        const pericias = (all || []).filter(f => f.type === 'pericia');
        setTemplates(pericias);
      } catch (e) {
        console.error(e);
        setTemplates([]);
      }
    })();
  }, [isOpen]);

  // creation removed: modal now only lists existing pericias and allows selection

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-60 flex items-center justify-center">
      <div className="modal-card relative z-60 bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Perícias cadastradas</h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-2 py-1 border border-white/10 rounded text-sm">Fechar</button>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="text-sm text-gray-400">Nenhuma perícia cadastrada.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {templates.map(t => (
              <TemplateRow key={t.id} t={t} onUse={onUse} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateRow({ t, onUse }){
  const [showDesc, setShowDesc] = React.useState(false);

  return (
    <div className="p-3 border border-white/6 rounded flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="font-semibold">{t.name}</div>
        <button title="Descrição" onClick={() => setShowDesc(true)} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
        </button>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm">Atributo: {t.metadata?.atributo || '-'}</div>
        <button onClick={() => onUse && onUse(t)} className="px-2 py-1 bg-white/6 rounded text-sm">Usar</button>
      </div>

      {showDesc ? (
        <div className="modal-overlay fixed inset-0 z-60 flex items-center justify-center">
          <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-2">Descrição</h3>
            <div className="text-sm mb-4">{t.description || 'Sem descrição.'}</div>
            <div className="flex justify-end">
              <button onClick={() => setShowDesc(false)} className="px-3 py-1 border border-white/10 rounded">Fechar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
