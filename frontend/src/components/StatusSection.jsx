"use client";

import React, { useState, useEffect } from "react";

function StatRow({ label, current, max, temp, onChange, colorClass, bgClass, disableMax, hideTemp }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;

  return (
    <div className="stats-row">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300 w-20 flex-shrink-0">{label}</div>
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

          {!hideTemp && (
            <div className="stat-box">
              <div className="text-[10px] text-gray-400 mb-1">Temp</div>
              <input
                className="stat-input"
                type="number"
                value={temp}
                onChange={(e) => onChange('temp', Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`bar-bg ${bgClass || ''}`}>
        <div className={`bar-fill ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StatusSection({ character }) {
  const [vida, setVida] = useState({ current: character.vida_atual || character.vida || 0, max: character.vida_max || 0, temp: character.vida_temp || 0 });
  const [esforco, setEsforco] = useState({ current: character.esforco_atual || character.esforco || 0, max: character.esforco_max || 0, temp: character.esforco_temp || 0 });
  const [sanidade, setSanidade] = useState({ current: character.sanidade_atual || 0, max: character.sanidade_max || 0 });
  const saveTimer = React.useRef(null);

  useEffect(() => {
    setVida({ current: character.vida_atual || character.vida || 0, max: character.vida_max || 0, temp: character.vida_temp || 0 });
    setEsforco({ current: character.esforco_atual || character.esforco || 0, max: character.esforco_max || 0, temp: character.esforco_temp || 0 });
    setSanidade({ current: character.sanidade_atual || 0, max: character.sanidade_max || 0 });
  }, [character]);

  useEffect(() => {
    if (!character || !character.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = {
          vida_atual: Number(vida.current) || 0,
          vida_temp: Number(vida.temp) || 0,
          esforco_atual: Number(esforco.current) || 0,
          esforco_temp: Number(esforco.temp) || 0,
          sanidade_atual: Number(sanidade.current) || 0
        };

        await fetch(`http://localhost:3001/characters/${character.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // ignore
      }
    }, 700);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [vida, esforco, sanidade, character]);

  const change = (setter) => (field, value) => {
    setter(prev => ({ ...prev, [field]: isNaN(value) ? 0 : value }));
  };

  return (
    <div>
      <div className="mb-3 stat-label">Status</div>
      <div className="bg-white/3 rounded p-4">
        <StatRow label="Vida" current={vida.current} max={vida.max} temp={vida.temp} onChange={change(setVida)} colorClass="bar-red" bgClass="bar-bg-red" disableMax={true} />
        <StatRow label="Esforço" current={esforco.current} max={esforco.max} temp={esforco.temp} onChange={change(setEsforco)} colorClass="bar-yellow" bgClass="bar-bg-yellow" disableMax={true} />
        <StatRow label="Sanidade" current={sanidade.current} max={sanidade.max} temp={0} onChange={change(setSanidade)} colorClass="bar-blue" bgClass="bar-bg-blue" disableMax={true} hideTemp={true} />
      </div>
    </div>
  );
}
