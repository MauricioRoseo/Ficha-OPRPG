"use client";

import React, { useEffect, useState } from "react";
import PericiaTemplatesModal from "./PericiaTemplatesModal";

export default function PericiasPanel({ character, attributes, editable = false }) {
  const data = attributes || character || {};
  const [pericias, setPericias] = useState([]);
  const [showDescFor, setShowDescFor] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingPericia, setEditingPericia] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchCharacterPericias = async () => {
    if (!character?.id) return;
    try {
      const res = await fetch(`http://localhost:3001/features/character/${character.id}`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Erro ao buscar perícias do personagem');
      const grouped = await res.json();
      setPericias(grouped.pericia || []);
    } catch (e) {
      console.error(e);
      setPericias([]);
    }
  };

  useEffect(() => { fetchCharacterPericias(); }, [character?.id, character?.defesa_passiva]);

  const handleUseTemplate = async (template) => {
    try {
      const res = await fetch('http://localhost:3001/features/' + character.id + '/' + template.id, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Erro ao adicionar perícia');
      await fetchCharacterPericias();
      setShowTemplates(false);
    } catch (e) {
      alert('Erro ao adicionar perícia');
      console.error(e);
    }
  };

  return (
    <div>
      <div className="mb-3 stat-label">Perícias</div>

      <div className="panel panel-pericias p-4 rounded">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">Perícias vinculadas ao personagem</div>
          {editable ? (
            <div className="flex gap-2">
              <button onClick={() => setShowTemplates(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Adicionar perícia</button>
              <button onClick={() => setShowAdd(true)} className="border border-white/10 px-2 py-1 text-sm rounded">Criar manual</button>
            </div>
          ) : null}
        </div>

        {(!pericias || pericias.length === 0) ? (
          <div className="text-sm text-gray-400">Ainda não há perícias vinculadas ao personagem.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                    <th>Nome</th>
                    <th>Atributo</th>
                    <th className="w-28">Nível Trein.</th>
                    <th className="w-20">Bônus Extra</th>
                    <th className="w-24">Penal. Carga</th>
                    <th className="w-20">Total</th>
                    <th className="w-12" />
                  </tr>
              </thead>
              <tbody>
                {pericias.map(p => (
                  <tr key={p.id} className="border-t border-white/6">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                        </div>
                      </td>
                    <td className="py-2">{p.atributo || p.metadata?.atributo || '-'}</td>
                    <td className="py-2">{p.training_level}</td>
                    <td className="py-2">{p.extra ?? 0}</td>
                    <td className="py-2">{p.penalidade_carga ? (p.encumbrance_penalty ?? 0) : '-'}</td>
                    <td className="py-2">{p.total ?? ( (p.value||0) + (p.extra||0) )}</td>
                      <td className="py-2 text-right">
                          {p.description ? (
                          <button onClick={() => setShowDescFor(p.id)} title="Descrição" className="text-gray-400 hover:text-white mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
                          </button>
                        ) : null}
                          {editable ? (
                            <>
                              <button onClick={async ()=>{
                                if (!confirm('Remover perícia do personagem?')) return;
                                try {
                                  const res = await fetch(`http://localhost:3001/features/character/${character.id}/${p.id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
                                  if (!res.ok) throw new Error('Erro ao remover');
                                  await fetchCharacterPericias();
                                } catch (e) { console.error(e); alert('Erro ao remover perícia'); }
                              }} className="text-red-400 hover:text-red-500" title="Remover perícia">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 11v6M14 11v6"/></svg>
                              </button>
                              <button onClick={() => { setEditingPericia(p); setShowEdit(true); }} title="Editar perícia" className="text-gray-300 hover:text-white ml-2 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z"/></svg>
                              </button>
                            </>
                          ) : null}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showDescFor ? (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
            <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-lg">
              <h3 className="text-lg font-bold mb-2">Descrição</h3>
              <div className="text-sm mb-4">{(pericias.find(x=>x.id===showDescFor)?.description) || 'Sem descrição.'}</div>
              <div className="flex justify-end">
                <button onClick={()=>setShowDescFor(null)} className="px-3 py-1 border border-white/10 rounded">Fechar</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

  <PericiaTemplatesModal isOpen={showTemplates} onClose={() => setShowTemplates(false)} onUse={handleUseTemplate} />

        {showEdit ? (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
            <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md">
              <h3 className="text-lg font-bold mb-3">Editar Perícia</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.target);
                const payload = {
                  training_level: f.get('training_level'),
                  extra: f.get('extra') ? Number(f.get('extra')) : 0,
                  has_encumbrance_penalty: editingPericia.penalidade_carga ? 1 : 0,
                  encumbrance_penalty: editingPericia.penalidade_carga ? (f.get('encumbrance_penalty') ? Number(f.get('encumbrance_penalty')) : 0) : null
                };
                try {
                  const res = await fetch(`http://localhost:3001/features/character/${character.id}/${editingPericia.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
                  if (!res.ok) {
                    let msg = 'Erro ao atualizar perícia';
                    try{ const body = await res.json(); if (body && body.message) msg = body.message; }catch(e){}
                    throw new Error(msg);
                  }
                  await fetchCharacterPericias();
                  setShowEdit(false);
                  setEditingPericia(null);
                } catch (err) {
                  alert(err.message || 'Erro ao atualizar perícia'); console.error(err);
                }
              }} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Treinamento</label>
                  <select name="training_level" defaultValue={editingPericia?.training_level || 'none'} className="w-full mt-1 p-2 bg-[#021018] text-white border border-white/6 rounded">
                    <option value="none">Nenhum</option>
                    <option value="trained">Treinado</option>
                    <option value="veteran">Veterano</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="extra" type="number" defaultValue={editingPericia?.extra || 0} className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
                  {editingPericia?.penalidade_carga ? (
                    <input name="encumbrance_penalty" type="number" defaultValue={editingPericia?.encumbrance_penalty || 0} className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
                  ) : <div />}
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={()=>{ setShowEdit(false); setEditingPericia(null); }} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                  <button className="px-3 py-1 bg-white/6 rounded">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

      {/* simple manual create: reuse existing feature creation endpoint for type 'pericia' */}
      {showAdd ? (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-card bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-bold mb-3">Criar Perícia Manualmente</h3>
            {/* small form; on submit POST /features then add to character */}
              <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.target);
              const penalidadeFlag = f.get('penalidade_carga');
              const payload = {
                name: f.get('name'),
                type: 'pericia',
                description: f.get('description'),
                // legacy metadata kept for attribute mapping, but encumbrance handled via top-level fields
                metadata: { atributo: f.get('atributo') },
                has_encumbrance_penalty: penalidadeFlag ? 1 : 0,
                encumbrance_penalty: penalidadeFlag ? Number(penalidadeFlag) : null,
                extra: f.get('extra_bonus') ? Number(f.get('extra_bonus')) : 0
              };
              try {
                const r = await fetch('http://localhost:3001/features', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
                if (!r.ok) throw new Error('Erro ao criar pericia');
                // get id
                const created = await r.json();
                // add to character
                const add = await fetch(`http://localhost:3001/features/${character.id}/${created.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({}) });
                if (!add.ok) throw new Error('Erro ao vincular pericia');
                await fetchCharacterPericias();
                setShowAdd(false);
              } catch (err) {
                alert('Erro ao criar e vincular perícia');
                console.error(err);
              }
            }} className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <input name="name" required className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Atributo base</label>
                <select name="atributo" className="w-full mt-1 p-2 bg-[#021018] text-white border border-white/6 rounded focus:outline-none focus:ring-2 focus:ring-white/10">
                  <option value="agilidade">Agilidade</option>
                  <option value="forca">Força</option>
                  <option value="intelecto">Intelecto</option>
                  <option value="presenca">Presença</option>
                  <option value="vigor">Vigor</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Descrição</label>
                <textarea name="description" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="penalidade_carga" type="number" placeholder="Penalidade carga" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
                <input name="extra_bonus" type="number" placeholder="Bônus extra" className="w-full mt-1 p-2 bg-transparent border border-white/6 rounded" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>setShowAdd(false)} className="px-3 py-1 border border-white/10 rounded">Cancelar</button>
                <button className="px-3 py-1 bg-white/6 rounded">Criar e Vincular</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
