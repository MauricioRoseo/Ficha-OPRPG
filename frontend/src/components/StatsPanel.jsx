"use client";

import React, { useState, useEffect } from "react";

function StatRow({ label, current, max, temp, onChange, colorClass, bgClass, disableMax }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;

  return (
    <div className="stats-row">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">{label}</div>
        <div className="values">
          <div className="stat-box">
            <div className="text-[10px] text-gray-400 mb-1">Atual</div>
            <input
              className="stat-input"
              type="number"
              value={current}
              onChange={(e) => onChange('current', Number(e.target.value))}
            />
          </div>

          <div className="text-xs text-gray-400"> </div>

          <div className="stat-box">
            <div className="text-[10px] text-gray-400 mb-1">Máx</div>
            <input
              className="stat-input"
              type="number"
              value={max}
              onChange={(e) => {
                if (disableMax) return;
                onChange('max', Number(e.target.value));
              }}
              readOnly={disableMax}
              aria-readonly={disableMax}
              style={disableMax ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="text-xs text-gray-400"> </div>

          <div className="stat-box">
            <div className="text-[10px] text-gray-400 mb-1">Temp</div>
            <input
              className="stat-input"
              type="number"
              value={temp}
              onChange={(e) => onChange('temp', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className={`bar-bg ${bgClass || ''}`}>
        <div className={`bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StatsPanel({ character }) {
  const [vida, setVida] = useState({ current: character.vida_atual || character.vida || 0, max: character.vida_max || 0, temp: character.vida_temp || 0 });
  const [esforco, setEsforco] = useState({ current: character.esforco_atual || character.esforco || 0, max: character.esforco_max || 0, temp: character.esforco_temp || 0 });
  const [sanidade, setSanidade] = useState({ current: character.sanidade_atual || 0, max: character.sanidade_max || 0, temp: 0 });

  useEffect(() => {
    setVida({ current: character.vida_atual || character.vida || 0, max: character.vida_max || 0, temp: character.vida_temp || 0 });
    setEsforco({ current: character.esforco_atual || character.esforco || 0, max: character.esforco_max || 0, temp: character.esforco_temp || 0 });
    setSanidade({ current: character.sanidade_atual || 0, max: character.sanidade_max || 0, temp: 0 });
  }, [character]);

  const change = (setter) => (field, value) => {
    setter(prev => ({ ...prev, [field]: isNaN(value) ? 0 : value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
      {/* Left: estatísticas principais (coluna 1) */}
      <div className="md:col-span-2 pr-4 md:pr-8 md:border-r md:border-white/6">
        <div className="mb-3 stat-label">Status</div>
        <StatRow label="Vida" current={vida.current} max={vida.max} temp={vida.temp} onChange={change(setVida)} colorClass="bar-red" bgClass="bar-bg-red" disableMax={true} />
        <StatRow label="Esforço" current={esforco.current} max={esforco.max} temp={esforco.temp} onChange={change(setEsforco)} colorClass="bar-yellow" bgClass="bar-bg-yellow" disableMax={true} />
        <StatRow label="Sanidade" current={sanidade.current} max={sanidade.max} temp={sanidade.temp} onChange={change(setSanidade)} colorClass="bar-blue" bgClass="bar-bg-blue" disableMax={true} />
      </div>

      {/* Middle: área principal de conteúdo (coluna 2) */}
      <div className="md:col-span-2">
        <div className="mb-3 stat-label">Dados</div>
        <div className="bg-white/3 rounded p-4 text-sm text-gray-200">Informações complementares e cálculos rápidos.</div>
      </div>

      {/* Right: espaço para notas/itens (coluna 3) */}
      <div className="md:col-span-2">
        <div className="mb-3 stat-label">Extras</div>
        <div className="bg-white/4 rounded p-4 text-sm text-gray-200">Notas, inventário ou atalhos rápidos.</div>
      </div>
    </div>
  );
}
