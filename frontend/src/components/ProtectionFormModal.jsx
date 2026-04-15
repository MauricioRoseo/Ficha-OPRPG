"use client";

import React, { useState, useEffect } from "react";

export default function ProtectionFormModal({ isOpen, onClose, onCreated, onSaved, characterId, initial }) {
  const [form, setForm] = useState({
    name: '',
    passive_defense: 0,
    damage_resistance: 0,
    encumbrance_penalty: 0,
    equipped: false,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && initial) {
      setForm({
        name: initial.name || '',
        passive_defense: initial.passive_defense ?? 0,
        damage_resistance: initial.damage_resistance ?? 0,
        encumbrance_penalty: initial.encumbrance_penalty ?? 0,
        equipped: Boolean(initial.equipped),
        notes: initial.notes || ''
      });
    }
    if (isOpen && !initial) {
      setForm({ name: '', passive_defense: 0, damage_resistance: 0, encumbrance_penalty: 0, equipped: false, notes: '' });
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, character_id: characterId };

      if (initial && initial.id) {
        // update
        const res = await fetch(`http://localhost:3001/protections/${initial.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Erro ao atualizar proteção');
        const data = await res.json();
        const updated = data.protection ? { ...data.protection, defesa_passiva: data.defesa_passiva } : data;
        if (onSaved) onSaved(updated);
        onClose();
        return;
      }

      // create
      const res = await fetch('http://localhost:3001/protections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Erro ao criar proteção');

      const data = await res.json();
      if (onCreated) {
        const created = data.protection ? { ...data.protection, defesa_passiva: data.defesa_passiva } : data;
        onCreated(created);
      }
      onClose();
    } catch (err) {
      // simple alert for now
      alert(initial && initial.id ? 'Erro ao atualizar proteção' : 'Erro ao criar proteção');
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">{initial && initial.id ? 'Editar Proteção' : 'Adicionar Proteção'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Nome</label>
            <input required className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.name} onChange={(e)=>handleChange('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-400">Defesa Passiva</label>
              <input type="number" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.passive_defense} onChange={(e)=>handleChange('passive_defense', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-gray-400">Resistência</label>
              <input type="number" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.damage_resistance} onChange={(e)=>handleChange('damage_resistance', Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-gray-400">Penalidade</label>
              <input type="number" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.encumbrance_penalty} onChange={(e)=>handleChange('encumbrance_penalty', Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="eq" checked={form.equipped} onChange={(e)=>handleChange('equipped', e.target.checked)} />
              <label htmlFor="eq" className="text-sm text-gray-400">Equipado</label>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Notas</label>
            <textarea className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.notes} onChange={(e)=>handleChange('notes', e.target.value)} />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
            <button type="submit" className="px-3 py-1 bg-white/6 rounded">{initial && initial.id ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
