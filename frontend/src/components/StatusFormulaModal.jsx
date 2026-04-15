"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const emptyStatus = { vida: { modifiers_per_level: [], modifiers_flat: [] }, esforco: { modifiers_per_level: [], modifiers_flat: [] }, sanidade: { modifiers_per_level: [], modifiers_flat: [] } };
  const emptyDefense = { passive: { attribute: 'agilidade', modifiers: [] }, dodge: { skill: '', modifiers: [] }, block: { skill: '', modifiers: [] }, pe_limit: { modifiers: [] } };

  const [data, setData] = useState({ ...emptyStatus, defense: { ...emptyDefense } });
  const [previewLevel, setPreviewLevel] = useState(0);
  const [periciaOptions, setPericiaOptions] = useState([]);

  useEffect(() => {
    // initialize data from initial which may contain status keys and/or defense
    if (initial) {
      const copy = { ...emptyStatus, ...initial };
      // ensure defense sub-keys are present by merging with emptyDefense
      const incomingDef = initial.defense || initial.defesa || {};
      copy.defense = { ...copy.defense, ...emptyDefense, ...incomingDef };
      setData(copy);
      // initialize preview level from initial.nivel if provided
      const lvl = (initial && (initial.nivel || initial.level || initial.NIVEL)) || 0;
      setPreviewLevel(Number(lvl || 0));
    } else {
      setData({ ...emptyStatus, defense: { ...emptyDefense } });
    }
  }, [initial, open]);

  // fetch pericia templates to populate dropdowns
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/features', { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        if (!res.ok) return;
        const all = await res.json();
        if (!mounted) return;
        const pericias = (all || []).filter(f => f.type === 'pericia');
        setPericiaOptions(pericias);
      } catch (e) {}
    };
    load();
    return () => { mounted = false; };
  }, []);
  // create a portal container to render modal at document.body so it's not affected by parent stacking contexts
  const [portalEl, setPortalEl] = useState(null);

  useEffect(() => {
    if (!open) return;
    const el = document.createElement('div');
    document.body.appendChild(el);
    setPortalEl(el);
    // disable body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      if (el && el.parentNode) el.parentNode.removeChild(el);
      setPortalEl(null);
    };
  }, [open]);

  if (!open) return null;
  if (!portalEl) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 modal-overlay" />

      <div
        className="relative w-full max-w-2xl mx-4 bg-[#071017] border border-white/6 rounded-lg p-6 z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 className="text-lg font-bold">Configurar cálculo automático de status</h3>
        <p className="text-sm text-gray-400 mt-2">As fórmulas base usarão valores da classe e atributos (vigor/presença). Adicione modificadores conforme necessário.</p>

        <div className="mt-4 status-section">
          <h3 className="text-sm font-semibold mb-3">Status</h3>

          <div className="status-card">
            <h4 className="font-semibold">Pontos de Vida (vida)</h4>
            <div className="text-xs text-gray-300 mt-2">Fórmula base: (hp_inicial_da_classe + vigor) + ((hp_por_nivel_da_classe + vigor)*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
            <ModList title="Modificadores por nível" items={data.vida.modifiers_per_level} onChange={arr => setData(d => ({ ...d, vida: { ...d.vida, modifiers_per_level: arr } }))} />
            <ModList title="Modificadores finais (flat)" items={data.vida.modifiers_flat} onChange={arr => setData(d => ({ ...d, vida: { ...d.vida, modifiers_flat: arr } }))} />
          </div>

          <div className="status-card">
            <h4 className="font-semibold">Pontos de Esforço (esforco)</h4>
            <div className="text-xs text-gray-300 mt-2">Fórmula base: (effort_inicial_da_classe + presença) + ((effort_por_nivel_da_classe + presença)*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
            <ModList title="Modificadores por nível" items={data.esforco.modifiers_per_level} onChange={arr => setData(d => ({ ...d, esforco: { ...d.esforco, modifiers_per_level: arr } }))} />
            <ModList title="Modificadores finais (flat)" items={data.esforco.modifiers_flat} onChange={arr => setData(d => ({ ...d, esforco: { ...d.esforco, modifiers_flat: arr } }))} />
          </div>

          <div className="status-card">
            <h4 className="font-semibold">Sanidade (sanidade)</h4>
            <div className="text-xs text-gray-300 mt-2">Fórmula base: sanidade_inicial_da_classe + (sanidade_por_nivel_da_classe*(nivel-1)) + (modificador_por_nivel * nivel) + (modificador_final)</div>
            <ModList title="Modificadores por nível" items={data.sanidade.modifiers_per_level} onChange={arr => setData(d => ({ ...d, sanidade: { ...d.sanidade, modifiers_per_level: arr } }))} />
            <ModList title="Modificadores finais (flat)" items={data.sanidade.modifiers_flat} onChange={arr => setData(d => ({ ...d, sanidade: { ...d.sanidade, modifiers_flat: arr } }))} />
          </div>
        </div>

        <div className="mt-6 status-section">
          <h3 className="text-sm font-semibold mb-3">Defesas</h3>

          <div className="status-card">
            <h4 className="font-semibold">Defesa Passiva</h4>
            <div className="text-xs text-gray-300 mt-2">Cálculo: 10 + Atributo (padrão: Agilidade) + modificadores finais</div>
            <div className="mt-2">
              <label className="text-xs text-gray-300">Atributo base</label>
              <select value={data.defense.passive.attribute} onChange={e => setData(d => ({ ...d, defense: { ...d.defense, passive: { ...d.defense.passive, attribute: e.target.value } } }))} className="w-full mt-1 p-2 bg-[#011415] border border-white/6 rounded">
                <option value="agilidade">Agilidade</option>
                <option value="forca">Força</option>
                <option value="intelecto">Intelecto</option>
                <option value="vigor">Vigor</option>
                <option value="presenca">Presença</option>
              </select>
            </div>
            <ModList title="Modificadores finais (flat)" items={data.defense.passive.modifiers} onChange={arr => setData(d => ({ ...d, defense: { ...d.defense, passive: { ...d.defense.passive, modifiers: arr } } }))} />
          </div>

          <div className="status-card">
            <h4 className="font-semibold">Esquiva</h4>
            <div className="text-xs text-gray-300 mt-2">Cálculo: Defesa passiva + bônus da perícia (apenas se: treinado/veterano/expert)</div>
            <div className="mt-2">
              <label className="text-xs text-gray-300">Perícia</label>
              <select value={data.defense.dodge.skill} onChange={e => setData(d => ({ ...d, defense: { ...d.defense, dodge: { ...d.defense.dodge, skill: e.target.value } } }))} className="w-full mt-1 p-2 bg-[#011415] border border-white/6 rounded">
                <option value="">-- selecione perícia --</option>
                {periciaOptions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <ModList title="Modificadores finais (flat)" items={data.defense.dodge.modifiers} onChange={arr => setData(d => ({ ...d, defense: { ...d.defense, dodge: { ...d.defense.dodge, modifiers: arr } } }))} />
          </div>

          <div className="status-card">
            <h4 className="font-semibold">Bloqueio</h4>
            <div className="text-xs text-gray-300 mt-2">Cálculo: bônus total da perícia selecionada + modificadores</div>
            <div className="mt-2">
              <label className="text-xs text-gray-300">Perícia</label>
              <select value={data.defense.block.skill} onChange={e => setData(d => ({ ...d, defense: { ...d.defense, block: { ...d.defense.block, skill: e.target.value } } }))} className="w-full mt-1 p-2 bg-[#011415] border border-white/6 rounded">
                <option value="">-- selecione perícia --</option>
                {periciaOptions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <ModList title="Modificadores finais (flat)" items={data.defense.block.modifiers} onChange={arr => setData(d => ({ ...d, defense: { ...d.defense, block: { ...d.defense.block, modifiers: arr } } }))} />
          </div>

          <div className="status-card">
            <h4 className="font-semibold">Limite de gasto de PE</h4>
            <div className="text-xs text-gray-300 mt-2">Cálculo: Nível + modificadores. Adicione modificadores que serão somados ao nível do personagem para determinar o limite de gasto de PE.</div>
            <div className="mt-2">
              <label className="text-xs text-gray-300">Nível base para pré-visualização (padrão: nível do personagem)</label>
              <div className="flex gap-2 items-center mt-1">
                <input type="number" value={previewLevel} onChange={e=>setPreviewLevel(Number(e.target.value||0))} className="w-28 p-2 rounded bg-[#011415] border border-white/6" />
                <div className="text-xs text-gray-400">Preview: </div>
                <div className="font-bold ml-1">{
                  // calculate preview value: previewLevel + sum of modifiers
                  (Number(previewLevel || 0) + (Array.isArray(data.defense.pe_limit?.modifiers) ? data.defense.pe_limit.modifiers.reduce((acc,m)=>acc + Number(m.value||0),0) : 0))
                }</div>
              </div>
              <div className="text-xs text-gray-400 mt-2">O valor final persistido será calculado no servidor como: nivel + soma(dos modificadores).</div>
            </div>
            <ModList title="Modificadores (flat)" items={data.defense.pe_limit.modifiers} onChange={arr => setData(d => ({ ...d, defense: { ...d.defense, pe_limit: { ...d.defense.pe_limit, modifiers: arr } } }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1 rounded border border-white/10">Cancelar</button>
          <button onClick={() => onSave(data)} className="px-3 py-1 rounded bg-green-500 text-black font-semibold">Salvar</button>
        </div>
      </div>
    </div>,
    portalEl
  );
}
