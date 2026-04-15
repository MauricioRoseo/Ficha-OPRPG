"use client";

import React, { useState, useEffect } from 'react';

function ModList({ title, items, onChange }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <strong className="text-sm">{title}</strong>
        <button onClick={() => onChange([...items, { label: '', value: 0 }])} className="px-2 py-1 text-xs rounded bg-white/6">Adicionar</button>
      </div>
      <div className="mt-2 space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2">
            <input value={it.label} onChange={e => { const copy = [...items]; copy[idx].label = e.target.value; onChange(copy); }} placeholder="Descrição" className="flex-1 p-2 rounded bg-[#021018] border border-white/6" />
            <input type="number" value={it.value} onChange={e => { const copy = [...items]; copy[idx].value = Number(e.target.value || 0); onChange(copy); }} className="w-28 p-2 rounded bg-[#021018] border border-white/6" />
            <button onClick={() => { const copy = items.filter((_, i) => i !== idx); onChange(copy); }} className="px-2 py-1 bg-red-600/60 rounded text-xs">Remover</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-gray-400">Nenhum modificador.</div>}
      </div>
    </div>
  );
}

export default function StatusFormulaModal({ open, initial = null, onClose, onSave }) {
  const [data, setData] = useState({
    vida: { modifiers_per_level: [], modifiers_flat: [] },
    esforco: { modifiers_per_level: [], modifiers_flat: [] },
    sanidade: { modifiers_per_level: [], modifiers_flat: [] }
  });

  useEffect(() => {
    if (initial) setData(initial);
    else setData({ vida: { modifiers_per_level: [], modifiers_flat: [] }, esforco: { modifiers_per_level: [], modifiers_flat: [] }, sanidade: { modifiers_per_level: [], modifiers_flat: [] } });
  }, [initial, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl mx-4 bg-[#071017] border border-white/6 rounded-lg p-6 z-10">
        <h3 className="text-lg font-bold">Configurar cálculo automático de status</h3>
        <p className="text-sm text-gray-400 mt-2">As fórmulas base usarão valores da classe e atributos (vigor/presença). Adicione modificadores conforme necessário.</p>

        <div className="mt-4">
          <h4 className="font-semibold">Pontos de Vida (vida)</h4>
          <div className="text-xs text-gray-300 mt-2">Fórmula base: (hp_inicial_da_classe + vigor) + ((hp_por_nivel_da_classe + vigor)*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
          <ModList title="Modificadores por nível" items={data.vida.modifiers_per_level} onChange={arr => setData(d => ({ ...d, vida: { ...d.vida, modifiers_per_level: arr } }))} />
          <ModList title="Modificadores finais (flat)" items={data.vida.modifiers_flat} onChange={arr => setData(d => ({ ...d, vida: { ...d.vida, modifiers_flat: arr } }))} />
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Pontos de Esforço (esforco)</h4>
          <div className="text-xs text-gray-300 mt-2">Fórmula base: (effort_inicial_da_classe + presença) + ((effort_por_nivel_da_classe + presença)*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
          <ModList title="Modificadores por nível" items={data.esforco.modifiers_per_level} onChange={arr => setData(d => ({ ...d, esforco: { ...d.esforco, modifiers_per_level: arr } }))} />
          <ModList title="Modificadores finais (flat)" items={data.esforco.modifiers_flat} onChange={arr => setData(d => ({ ...d, esforco: { ...d.esforco, modifiers_flat: arr } }))} />
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Sanidade (sanidade)</h4>
          <div className="text-xs text-gray-300 mt-2">Fórmula base: sanidade_inicial_da_classe + (sanidade_por_nivel_da_classe*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
          <ModList title="Modificadores por nível" items={data.sanidade.modifiers_per_level} onChange={arr => setData(d => ({ ...d, sanidade: { ...d.sanidade, modifiers_per_level: arr } }))} />
          <ModList title="Modificadores finais (flat)" items={data.sanidade.modifiers_flat} onChange={arr => setData(d => ({ ...d, sanidade: { ...d.sanidade, modifiers_flat: arr } }))} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1 rounded border border-white/10">Cancelar</button>
          <button onClick={() => onSave(data)} className="px-3 py-1 rounded bg-green-500 text-black font-semibold">Salvar</button>
        </div>
      </div>
    </div>
  );
}
