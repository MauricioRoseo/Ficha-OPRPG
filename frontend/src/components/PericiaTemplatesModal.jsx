"use client";

import React, { useEffect, useState } from "react";

export default function PericiaTemplatesModal({ isOpen, onClose, onUse, onCreateNew }) {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', atributo: 'agilidade', description: '', penalidade_carga: 0, extra_bonus: 0 });
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        type: 'pericia',
        description: form.description,
        metadata: { atributo: form.atributo, penalidade_carga: form.penalidade_carga, extra_bonus: form.extra_bonus }
      };
      const res = await fetch('http://localhost:3001/features', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro ao criar perícia');
      // refresh list
      setShowCreate(false);
      setForm({ name: '', atributo: '', description: '', penalidade_carga: 0, extra_bonus: 0 });
      const r2 = await fetch('http://localhost:3001/features', { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      const all = await r2.json();
      setTemplates((all || []).filter(f => f.type === 'pericia'));
    } catch (e) {
      alert('Erro ao criar perícia');
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Perícias cadastradas</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(s => !s)} className="px-2 py-1 border border-white/10 rounded text-sm">{showCreate ? 'Cancelar' : 'Cadastrar perícia'}</button>
            <button onClick={onClose} className="px-2 py-1 border border-white/10 rounded text-sm">Fechar</button>
          </div>
        </div>

        {showCreate ? (
          <form onSubmit={handleCreate} className="space-y-2 mb-4">
            <div>
              <label className="text-sm text-gray-400">Nome</label>
              <input required className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.name} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm text-gray-400">Atributo base</label>
              <select className="w-full mt-1 p-2 bg-[#021018] text-white border border-white/6 rounded focus:outline-none focus:ring-2 focus:ring-white/10" value={form.atributo} onChange={(e)=>setForm(f=>({...f, atributo: e.target.value}))}>
                <option value="agilidade">Agilidade</option>
                <option value="forca">Força</option>
                <option value="intelecto">Intelecto</option>
                <option value="presenca">Presença</option>
                <option value="vigor">Vigor</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Descrição</label>
              <textarea className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.description} onChange={(e)=>setForm(f=>({...f, description: e.target.value}))} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm text-gray-400">Penalidade carga</label>
                <input type="number" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.penalidade_carga} onChange={(e)=>setForm(f=>({...f, penalidade_carga: Number(e.target.value)}))} />
              </div>
              <div>
                <label className="text-sm text-gray-400">Bônus extra</label>
                <input type="number" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" value={form.extra_bonus} onChange={(e)=>setForm(f=>({...f, extra_bonus: Number(e.target.value)}))} />
              </div>
              <div className="flex items-end">
                <button className="px-3 py-1 bg-white/6 rounded">Criar</button>
              </div>
            </div>
          </form>
        ) : null}

        {templates.length === 0 ? (
          <div className="text-sm text-gray-400">Nenhuma perícia cadastrada.</div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-auto">
            {templates.map(t => (
              <div key={t.id} className="p-3 border border-white/6 rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.description}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm">Atributo: {t.metadata?.atributo || '-'}</div>
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
