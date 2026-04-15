"use client";

import React, { useEffect, useState } from "react";

export default function CharacterStates({ character }) {
  const [morrendo, setMorrendo] = useState(0);
  const [enlouquecendo, setEnlouquecendo] = useState(0);
  const [morrendoEnabled, setMorrendoEnabled] = useState(false);
  const [enlouquecendoEnabled, setEnlouquecendoEnabled] = useState(false);
  const saveTimer = React.useRef(null);

  useEffect(() => {
    setMorrendo(Number(character.morrendo) || 0);
    setEnlouquecendo(Number(character.enlouquecendo) || 0);
    setMorrendoEnabled(Boolean(Number(character.morrendo)));
    setEnlouquecendoEnabled(Boolean(Number(character.enlouquecendo)));
  }, [character]);

  // salva morrendo/enlouquecendo com debounce
  useEffect(() => {
    if (!character || !character.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = {
          morrendo: morrendoEnabled ? Number(morrendo) : 0,
          enlouquecendo: enlouquecendoEnabled ? Number(enlouquecendo) : 0
        };

        await fetch(`http://localhost:3001/characters/${character.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // ignore
      }
    }, 600);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [morrendo, enlouquecendo, morrendoEnabled, enlouquecendoEnabled, character]);

  const clamp = (v) => {
    let n = Number(v) || 0; if (n < 0) n = 0; if (n > 3) n = 3; return n;
  };

  return (
    <div>
      <div className="mb-3 stat-label">Estados</div>

      <div className="bg-white/3 rounded p-4">
        {/* Primeiro bloco: Morrendo / Enlouquecendo em área com borda arredondada */}
        <div className="rounded-md border border-white/6 p-3">
          <div className="flex gap-4 items-stretch">
            {/* Morrendo */}
            <div className="flex-1 flex flex-col">
              <h4 className="text-sm font-semibold mb-2 text-center">Morrendo</h4>
              <div className="flex items-center justify-center gap-4 mt-auto">
                <label className="flex items-center">
                  <input type="checkbox" checked={morrendoEnabled} onChange={(e) => { setMorrendoEnabled(e.target.checked); if (!e.target.checked) setMorrendo(0); }} />
                </label>

                <div className="flex items-center gap-2">
                  <input className="stat-input" type="number" value={morrendo} min={0} max={3} onChange={(e) => setMorrendo(clamp(e.target.value))} style={{ width: '44px' }} />
                  <div className="text-sm">/ 3</div>
                </div>
              </div>
            </div>

            <div className="w-px bg-white/12 rounded mx-2" />

            {/* Enlouquecendo */}
            <div className="flex-1 flex flex-col">
              <h4 className="text-sm font-semibold mb-2 text-center">Enlouquecendo</h4>
              <div className="flex items-center justify-center gap-4 mt-auto">
                <label className="flex items-center">
                  <input type="checkbox" checked={enlouquecendoEnabled} onChange={(e) => { setEnlouquecendoEnabled(e.target.checked); if (!e.target.checked) setEnlouquecendo(0); }} />
                </label>

                <div className="flex items-center gap-2">
                  <input className="stat-input" type="number" value={enlouquecendo} min={0} max={3} onChange={(e) => setEnlouquecendo(clamp(e.target.value))} style={{ width: '44px' }} />
                  <div className="text-sm">/ 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segundo bloco: Defesas (Passiva | Esquiva | Bloqueio) */}
        <div className="mt-4 rounded-md border border-white/6 p-3">
          <h4 className="text-sm font-semibold text-center mb-3">Defesas</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/2 rounded p-3 text-center">
              <div className="text-xs text-gray-400">Passiva</div>
              <div className="text-lg font-bold">{character?.defesa_passiva ?? character?.defesa ?? '-'}</div>
            </div>

            <div className="bg-white/2 rounded p-3 text-center">
              <div className="text-xs text-gray-400">Esquiva</div>
              <div className="text-lg font-bold">{character?.esquiva ?? '-'}</div>
            </div>

            <div className="bg-white/2 rounded p-3 text-center">
              <div className="text-xs text-gray-400">Bloqueio</div>
              <div className="text-lg font-bold">{character?.bloqueio ?? '-'}</div>
            </div>
          </div>
        </div>

        {/* Terceiro bloco: Limite de gasto de PE | Deslocamento */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-white/2 rounded p-3 text-center">
            <div className="text-sm text-gray-400">Limite de gasto de PE</div>
            <div className="text-3xl font-extrabold mt-2">
              {
                // prefer server-calculated value if present
                (character && (character.pe_limit || character.peLimit || character.computed?.pe_limit))
                || (() => {
                  const lvl = Number(character?.nivel ?? character?.level ?? 0) || 0;
                  try {
                    const def = character && character.defense_formula ? (typeof character.defense_formula === 'string' ? JSON.parse(character.defense_formula) : character.defense_formula) : (character && character.defesa ? (typeof character.defesa === 'string' ? JSON.parse(character.defesa) : character.defesa) : null);
                    const mods = def && def.pe_limit && Array.isArray(def.pe_limit.modifiers) ? def.pe_limit.modifiers : [];
                    const sum = (mods || []).reduce((acc, m) => acc + (Number(m && m.value) || 0), 0);
                    return (lvl + sum) || '-';
                  } catch (e) {
                    return lvl || '-';
                  }
                })()
              }
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-400 text-center">Deslocamento</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-white/2 rounded p-3 text-center">
                <div className="text-xs text-gray-400">Atual</div>
                <div className="text-lg font-bold mt-1">{character?.deslocamento_atual ?? '-'}</div>
              </div>

              <div className="bg-white/2 rounded p-3 text-center">
                <div className="text-xs text-gray-400">Máximo</div>
                <div className="text-lg font-bold mt-1">{character?.deslocamento_max ?? '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
