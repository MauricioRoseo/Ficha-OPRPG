"use client";

import React, { useEffect, useState, useRef } from "react";

const PATENTES = [
  { min: 0, name: 'Recruta', creditoLabel: 'Baixo', categoryLimits: { I: 2, II: 0, III: 0, IV: 0 } },
  { min: 20, name: 'Operador', creditoLabel: 'Médio', categoryLimits: { I: 3, II: 1, III: 0, IV: 0 } },
  { min: 50, name: 'Agente Especial', creditoLabel: 'Médio', categoryLimits: { I: 3, II: 2, III: 1, IV: 0 } },
  { min: 100, name: 'Oficial de Operações', creditoLabel: 'Alto', categoryLimits: { I: 3, II: 3, III: 2, IV: 1 } },
  { min: 200, name: 'Agente de Elite', creditoLabel: 'Ilimitado', categoryLimits: { I: 3, II: 3, III: 3, IV: 2 } }
];

function getPatenteByPrestigio(p) {
  const prestige = Number(p) || 0;
  let found = PATENTES[0];
  for (const pt of PATENTES) {
    if (prestige >= pt.min) found = pt;
  }
  return found;
}

export default function ProficienciesPanel({ character, onCharacterUpdate }) {
  const [text, setText] = useState('');
  const [prestigio, setPrestigio] = useState(0);
  const [saving, setSaving] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const saveTimer = useRef(null);
  const lastSaved = useRef(0);

  useEffect(() => {
    if (!character) return;
    const raw = character.proficiencias || '';
    // If the proficiencies text starts with a line like "Prestígio: N", parse it out
    const lines = raw.split(/\r?\n/);
    let p = 0;
    if (lines[0] && lines[0].toLowerCase().startsWith('prest') ) {
      const m = lines[0].match(/(\d+)/);
      if (m) p = Number(m[1]);
      lines.shift();
    }
    setPrestigio(p);
    setText(lines.join('\n'));
  }, [character?.proficiencias]);

  const patente = getPatenteByPrestigio(prestigio);

  const handleSave = async () => {
    if (!character?.id) return;
    setSaving(true);
    // Persist by prepending a header line "Prestígio: N" before the proficiencies text
    const payloadText = `Prestígio: ${Number(prestigio || 0)}\n${text}`;
    try {
      const res = await fetch(`http://localhost:3001/characters/${character.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ proficiencias: payloadText })
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setSaving(false);
      lastSaved.current = Date.now();
      // compute patente locally and notify parent to keep character state in sync
      const computedPatente = getPatenteByPrestigio(prestigio).name;
      if (typeof onCharacterUpdate === 'function') {
        try {
          onCharacterUpdate({ ...character, proficiencias: payloadText, prestigio: Number(prestigio || 0), patente: computedPatente });
        } catch (e) {
          // ignore parent update errors
        }
      }
      // dispatch a global event so other views (dashboard) update in real-time (include computed patente)
      try { window.dispatchEvent(new CustomEvent('character:updated', { detail: { ...character, proficiencias: payloadText, prestigio: Number(prestigio || 0), patente: computedPatente } })); } catch(e) {}
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  // autosave with debounce for text and prestigio
  useEffect(() => {
    if (!character?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // avoid saving too frequently
      if (Date.now() - lastSaved.current < 500) return;
      handleSave();
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [text, prestigio]);

  return (
    <div>
      <div className="mb-3 stat-label">Proficiencias & Prestígio</div>
      <div className="panel p-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-2">Proficiencias (texto livre)</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={8} className="w-full p-2 bg-[#021018] text-white border border-white/6 rounded" />
            <div className="flex justify-end mt-2">
              <div className="text-xs text-gray-400">{saving ? 'Salvando...' : `Último salvo: ${lastSaved.current ? new Date(lastSaved.current).toLocaleTimeString() : '—'}`}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm text-gray-400">Prestígio</div>
            <div className="grid grid-cols-1 gap-2">
              <input type="number" value={prestigio} onChange={e=>setPrestigio(Number(e.target.value))} className="p-2 bg-[#021018] text-white border border-white/6 rounded" />

              <div className="p-3 bg-[#081b1d] rounded border border-white/6">
                <div className="text-xs text-gray-400">Patente</div>
                <div className="text-lg">{patente.name}</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <div className="p-2 bg-[#021018] rounded">
                    <div className="text-xs text-gray-400">Limite de Crédito</div>
                    <div className="text-lg">{patente.creditoLabel}</div>
                  </div>
                  <div className="p-2 bg-[#021018] rounded">
                    <div className="text-xs text-gray-400">Limites por Categoria</div>
                    <div className="text-sm">I({patente.categoryLimits.I}), II({patente.categoryLimits.II}), III({patente.categoryLimits.III}), IV({patente.categoryLimits.IV})</div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-400">Observação: o valor de Prestígio é salvo junto com o texto de Proficiencias (linha inicial).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
