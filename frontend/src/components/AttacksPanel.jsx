"use client";

import React, { useEffect, useState } from "react";

export default function AttacksPanel({ character, attributes = {} }) {
  const [attacks, setAttacks] = useState([]);
  const [pericias, setPericias] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPericia, setSelectedPericia] = useState('');
  const [otherAttribute, setOtherAttribute] = useState('agilidade');
  const [otherModifier, setOtherModifier] = useState(0);
  const [form, setForm] = useState({ weapon: '', damage_type: '', range_type: 'Adjacente', base_pericia: '', damage: '', crit_margin: 20, crit_multiplier: 2, ammo: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchAttacks = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/characters/${character.id}/attacks`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar ataques');
      const data = await res.json();
      setAttacks(data || []);
    } catch (e) {
      console.error(e);
      setAttacks([]);
    }
  };

  const fetchPericias = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/features/character/${character.id}`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar perícias');
      const data = await res.json();
      setPericias((data && data.pericia) ? data.pericia : []);
    } catch (e) {
      console.error(e);
      setPericias([]);
    }
  };

  useEffect(() => { fetchAttacks(); fetchPericias(); }, [character?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    // build base_pericia value based on selection
    let baseStr = form.base_pericia;
    if (selectedPericia && selectedPericia !== 'other') {
      const p = pericias.find(x => String(x.id) === String(selectedPericia));
      if (p) {
        const attrKey = p.atributo || null;
        const x = attrKey ? (attributes[attrKey] || 0) : 0;
        const y = Number(p.total || 0);
        baseStr = `${x}d20+${y}`;
      }
    } else if (selectedPericia === 'other') {
      const x = attributes[otherAttribute] || 0;
      const y = Number(otherModifier || 0);
      baseStr = `${x}d20+${y}`;
    }

    try {
      const payload = { ...form, base_pericia: baseStr };
      const res = await fetch(`http://localhost:3001/characters/${character.id}/attacks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao criar ataque');
      setShowAdd(false);
      setSelectedPericia(''); setOtherAttribute('agilidade'); setOtherModifier(0);
      setForm({ weapon: '', damage_type: '', range_type: 'Adjacente', base_pericia: '', damage: '', crit_margin: 20, crit_multiplier: 2, ammo: '' });
      await fetchAttacks();
    } catch (e) { alert('Erro'); console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover ataque?')) return;
    try {
      const res = await fetch(`http://localhost:3001/attacks/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao remover');
      await fetchAttacks();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Ataques</div>
      <div className="panel p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Armas e ataques</div>
          <button onClick={() => setShowAdd(s => !s)} className="px-2 py-1 border border-white/10 rounded text-sm">{showAdd ? 'Cancelar' : 'Novo ataque'}</button>
        </div>

        {showAdd ? (
          <form onSubmit={handleCreate} className="space-y-2 mb-3">
            <input required placeholder="Arma" value={form.weapon} onChange={e=>setForm(f=>({...f, weapon: e.target.value}))} className="w-full p-2 bg-[#021018] text-white border border-white/6 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.damage_type} onChange={e=>setForm(f=>({...f, damage_type: e.target.value}))} className="p-2 bg-[#021018] text-white border border-white/6 rounded">
                <option value="">Tipo de Dano</option>
                <option value="acid">Acid</option>
                <option value="balistico">Balístico</option>
                <option value="corte">Corte</option>
                <option value="eletricidade">Eletricidade</option>
                <option value="fogo">Fogo</option>
                <option value="frio">Frio</option>
                <option value="impacto">Impacto</option>
                <option value="mental">Mental</option>
                <option value="perfuracao">Perfuracao</option>
                <option value="veneno">Veneno</option>
                <option value="conhecimento">Conhecimento</option>
                <option value="energia">Energia</option>
                <option value="sangue">Sangue</option>
                <option value="morte">Morte</option>
              </select>
              <select value={form.range_type} onChange={e=>setForm(f=>({...f, range_type: e.target.value}))} className="p-2 bg-[#021018] text-white border border-white/6 rounded">
                <option value="Adjacente">Adjacente</option>
                <option value="Curto">Curto</option>
                <option value="Médio">Médio</option>
                <option value="Longo">Longo</option>
                <option value="Extremo">Extremo</option>
                <option value="Ilimitado">Ilimitado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Base perícia</label>
              <select value={selectedPericia} onChange={e=>setSelectedPericia(e.target.value)} className="w-full p-2 bg-[#021018] text-white border border-white/6 rounded mb-2">
                <option value="">Selecione perícia...</option>
                {pericias.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.atributo || '-'})</option>
                ))}
                <option value="other">Outro Teste</option>
              </select>

              {selectedPericia === 'other' ? (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select value={otherAttribute} onChange={e=>setOtherAttribute(e.target.value)} className="p-2 bg-[#021018] text-white border border-white/6 rounded">
                    <option value="forca">Força</option>
                    <option value="agilidade">Agilidade</option>
                    <option value="intelecto">Intelecto</option>
                    <option value="presenca">Presença</option>
                    <option value="vigor">Vigor</option>
                  </select>
                  <input type="number" value={otherModifier} onChange={e=>setOtherModifier(Number(e.target.value))} className="p-2 bg-[#021018] text-white border border-white/6 rounded" placeholder="Modificador (+y)" />
                </div>
              ) : null}

              <div className="text-sm text-gray-300">Preview: <strong>{(() => {
                if (selectedPericia && selectedPericia !== 'other') {
                  const p = pericias.find(x => String(x.id) === String(selectedPericia));
                  if (p) {
                    const attrKey = p.atributo || null;
                    const x = attrKey ? (attributes[attrKey] || 0) : 0;
                    const y = Number(p.total || 0);
                    return `${x}d20+${y}`;
                  }
                }
                if (selectedPericia === 'other') {
                  const x = attributes[otherAttribute] || 0;
                  const y = Number(otherModifier || 0);
                  return `${x}d20+${y}`;
                }
                return form.base_pericia || '-';
              })()}</strong></div>
            </div>
            <input placeholder="Dano (ex: 1d8+2)" value={form.damage} onChange={e=>setForm(f=>({...f, damage: e.target.value}))} className="w-full p-2 bg-[#021018] text-white border border-white/6 rounded" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Margem crítico" value={form.crit_margin} onChange={e=>setForm(f=>({...f, crit_margin: Number(e.target.value)}))} className="p-2 bg-[#021018] text-white border border-white/6 rounded" />
              <input type="number" placeholder="Multiplicador crítico" value={form.crit_multiplier} onChange={e=>setForm(f=>({...f, crit_multiplier: Number(e.target.value)}))} className="p-2 bg-[#021018] text-white border border-white/6 rounded" />
              <input placeholder="Munição" value={form.ammo} onChange={e=>setForm(f=>({...f, ammo: e.target.value}))} className="p-2 bg-[#021018] text-white border border-white/6 rounded" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setShowAdd(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
              <button className="px-3 py-1 bg-white/6 rounded">Criar</button>
            </div>
          </form>
        ) : null}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th>Arma</th>
                <th>Tipo</th>
                <th>Alcance</th>
                <th>Perícia (base)</th>
                <th>Dano</th>
                <th>Crít</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {attacks.map(a=> (
                <tr key={a.id} className="border-t border-white/6">
                  <td className="py-2">{a.weapon}</td>
                  <td className="py-2">{a.damage_type || '-'}</td>
                  <td className="py-2">{a.range_type}</td>
                  <td className="py-2">{a.base_pericia || '-'}</td>
                  <td className="py-2">{a.damage || '-'}</td>
                  <td className="py-2">{a.crit_margin ? `${a.crit_margin}x${a.crit_multiplier||1}` : '-'}</td>
                  <td className="py-2"><button onClick={()=>handleDelete(a.id)} className="px-2 py-1 border border-white/10 rounded text-sm text-red-400 hover:text-red-500" title="Remover ataque"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 11v6M14 11v6"/></svg></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
