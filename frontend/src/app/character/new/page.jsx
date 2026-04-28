"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterAttributes from "../../../components/CharacterAttributes";

export default function CharacterNewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", idade: "", origem_id: null, classe_id: null });
  const [attributes, setAttributes] = useState({ forca: 1, agilidade: 1, intelecto: 1, vigor: 1, presenca: 1 });
  const [origins, setOrigins] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [features, setFeatures] = useState([]);
  const [allFeatures, setAllFeatures] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [selectedRituals, setSelectedRituals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [combatChoiceWeapon, setCombatChoiceWeapon] = useState(null);
  const [combatChoiceSave, setCombatChoiceSave] = useState(null);
  const [status, setStatus] = useState("");
  const [createdId, setCreatedId] = useState(null);
  const [originGranted, setOriginGranted] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [ownedTemplateIds, setOwnedTemplateIds] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push('/'); return; }
    // fetch templates
    (async () => {
      try {
        const resO = await fetch('http://localhost:3001/templates/origins', { headers: { Authorization: `Bearer ${t}` } });
        if (resO.ok) setOrigins(await resO.json());
        const resC = await fetch('http://localhost:3001/templates/classes', { headers: { Authorization: `Bearer ${t}` } });
        if (resC.ok) setClassesList(await resC.json());
        // fetch pericias list
        const resP = await fetch('http://localhost:3001/features/search?type=pericia', { headers: { Authorization: `Bearer ${t}` } });
        if (resP.ok) setFeatures(await resP.json());
        // fetch all features (for mapping abilities and names)
        const resAll = await fetch('http://localhost:3001/features', { headers: { Authorization: `Bearer ${t}` } });
        if (resAll.ok) setAllFeatures(await resAll.json());
        // fetch rituals catalog for occultist selection
        const resR = await fetch('http://localhost:3001/rituals', { headers: { Authorization: `Bearer ${t}` } });
        if (resR.ok) setRituals(await resR.json());
      } catch (e) { console.error(e); }
    })();
  }, []);

  const attrSum = Object.values(attributes).reduce((s,v)=>s + (Number(v)||0), 0);
  const attrValid = Object.values(attributes).every(v => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 3) && attrSum === 9;

  const handleChangeAttr = (k, v) => {
    const n = v === '' ? '' : Number(v);
    setAttributes(prev => ({ ...prev, [k]: n }));
  };

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }

    if (!form.name) return setStatus('Preencha o nome');
    if (!attrValid) return setStatus('Atributos inválidos — cada um 0..3 e soma = 9');

    setStatus('Criando personagem...');
    try {
      const payload = {
        name: form.name,
        idade: form.idade === '' ? null : Number(form.idade),
        origem_id: form.origem_id || null,
        origem: form.origem_id ? (origins.find(o=>String(o.id)===String(form.origem_id)) || {}).name : null,
        classe_id: form.classe_id || null,
        classe: form.classe_id ? (classesList.find(c=>String(c.id)===String(form.classe_id)) || {}).name : null,
        attributes
      };

      const res = await fetch('http://localhost:3001/characters', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>null);
        setStatus((j && j.message) || 'Erro ao criar personagem');
        return;
      }
      const j = await res.json();
      setCreatedId(j.id);
      setStatus('Personagem criado. Agora escolha perícias adicionais.');
      setShowModal(true);

      // fetch origin snapshot to show granted features
      if (payload.origem_id) {
        const org = origins.find(o => String(o.id) === String(payload.origem_id));
        if (org) {
          const granted = [];
          if (org.pericia_1_id) granted.push(org.pericia_1_id);
          if (org.pericia_2_id) granted.push(org.pericia_2_id);
          if (org.habilidade_id) granted.push(org.habilidade_id);

          // map ids to feature names using allFeatures
          const mapping = granted.map(id => {
            const f = allFeatures.find(ff => String(ff.id) === String(id));
            return f ? f.name : `#${id}`;
          });
          setOriginGranted(mapping);
        }
      }

      // fetch character's existing features to filter selections
      try {
        const resOwned = await fetch(`http://localhost:3001/features/character/${j.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (resOwned.ok) {
          const owned = await resOwned.json();
          let arr = [];
          if (Array.isArray(owned)) arr = owned;
          else if (owned && typeof owned === 'object') {
            // grouped object (pericia/habilidade keys) -> flatten values
            arr = Object.values(owned).flat();
          }
          const ownedTemplates = (arr || []).map(o => o.template_id || o.templateId || o.template).filter(Boolean).map(id => Number(id));
          setOwnedTemplateIds(ownedTemplates);
        }
      } catch (e) { console.error('Erro fetch owned features', e); }

    } catch (e) {
      console.error(e);
      setStatus('Erro de conexão');
    }
  };

  

  const toggleSkill = (id) => {
    setSelectedSkills(prev => {
      if (prev.find(p => String(p) === String(id))) return prev.filter(p => String(p) !== String(id));
      // enforce limit
      if (prev.length >= allowedSelections()) return prev;
      return [...prev, id];
    });
  };

  const findFeatureByNames = (names = [], type = null) => {
    for (const n of names) {
      const f = allFeatures.find(ff => (type ? ff.type === type : true) && String((ff.name||'').toLowerCase()) === String(n.toLowerCase()));
      if (f) return f;
    }
    return null;
  };

  const getClassById = (id) => classesList.find(c => String(c.id) === String(id));

  const allowedSelections = () => {
    if (!form.classe_id) return 0;
    const cls = getClassById(form.classe_id);
    if (!cls) return 0;
    let base = 0;
    // Combatente: always grants 1 base choice (weapon/save choices do not count here)
    if ((cls.name||'').toLowerCase() === 'combatente') {
      base = 1;
    } else if (typeof cls.choice_skills_count !== 'undefined' && cls.choice_skills_count !== null) base = Number(cls.choice_skills_count || 0);
    else if (cls.metadata) {
      try {
        const m = typeof cls.metadata === 'string' ? JSON.parse(cls.metadata) : cls.metadata;
        if (m && (m.choice_skills_count || m.choice_sk_count)) base = Number(m.choice_sk_count || m.choice_skills_count || 0);
      } catch (e) { /* ignore */ }
    }
    const intel = Number(attributes.intelecto || 0);
    return Math.max(0, base + intel);
  };

  const allowedSelectionsRemaining = () => {
    const cls = getClassById(form.classe_id);
    const isCombatente = cls && String((cls.name||'').toLowerCase()) === 'combatente';
    // combatente has two forced radio choices (weapon/save) handled separately;
    // do not subtract them here — this function returns how many checkboxes
    // the user may still pick from the generic pericias list.
    return Math.max(0, allowedSelections());
  };

  const filteredFeatures = features.filter(f => !ownedTemplateIds.includes(Number(f.id)));
  // for ocultista we must hide the auto-granted Ocultismo (pericia) and Vontade (habilidade)
  const ocultismoFeature = findFeatureByNames(['Ocultismo','Ocultism'], 'pericia');
  const vontadeFeature = findFeatureByNames(['Vontade','Will'], 'habilidade');
  const filteredFeaturesForClass = (() => {
    const cls = getClassById(form.classe_id);
    const name = cls && (cls.name||'').toLowerCase();
    if (name === 'ocultista') {
      return filteredFeatures.filter(f => {
        if (ocultismoFeature && String(f.id) === String(ocultismoFeature.id)) return false;
        if (vontadeFeature && String(f.id) === String(vontadeFeature.id)) return false;
        return true;
      });
    }
    return filteredFeatures;
  })();

  // ritual selection: only show rituals of circle 1 that the character doesn't already own
  const filteredRituals = rituals.filter(r => Number(r.circle) === 1 && !ownedTemplateIds.includes(Number(r.id)));

  const handleApplyChoices = async () => {
    if (!createdId) return;
    const token = localStorage.getItem('token');
    try {
      const cls = getClassById(form.classe_id);
      const isCombatente = cls && String((cls.name||'').toLowerCase()) === 'combatente';
      const isEspecialista = cls && String((cls.name||'').toLowerCase()) === 'especialista';
      const isOcultista = cls && String((cls.name||'').toLowerCase()) === 'ocultista';
      if (isOcultista) {
        if (selectedRituals.length !== 3) {
          setStatus('Ocultista precisa selecionar exatamente 3 rituais');
          return;
        }
      }

      const toSend = [];

      // include combat forced choices
      if (isCombatente) {
        if (combatChoiceWeapon) toSend.push(combatChoiceWeapon);
        if (combatChoiceSave) toSend.push(combatChoiceSave);
      }

      // include occultist auto grants
      if (isOcultista) {
        const ocult = findFeatureByNames(['Ocultismo','Ocultism'], 'pericia');
        const vontade = findFeatureByNames(['Vontade','Will'], 'habilidade');
        if (ocult) toSend.push(ocult.id);
        if (vontade) toSend.push(vontade.id);
      }

      // include user-selected skills (the remainder)
      for (const s of selectedSkills) {
        if (!toSend.find(x => String(x) === String(s))) toSend.push(s);
      }

      const res = await fetch(`http://localhost:3001/characters/${createdId}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ selected_feature_ids: toSend, selected_ritual_ids: selectedRituals })
      });
      if (!res.ok) { const j = await res.json().catch(()=>null); setStatus((j && j.message) || 'Erro ao aplicar escolhas'); return; }
      const j = await res.json();
      setStatus('Escolhas aplicadas. Personagem pronto.');
      setShowModal(false);
      // redirect to character sheet
      router.push(`/character/${createdId}`);
    } catch (e) { console.error(e); setStatus('Erro de conexão'); }
  };

  return (
    <div className="p-6">
      <div className="surface-block p-4 mb-4">
        <h2 className="text-lg font-bold">Criar Personagem</h2>
        <p className="text-sm text-gray-400">Preencha os dados básicos e distribua 9 pontos entre os 5 atributos (cada um 0..3).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="surface-block p-4">
          <div className="mb-2">Nome</div>
          <input className="w-full p-2 bg-[#021018] rounded border border-white/6" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
          <div className="mt-2">Idade</div>
          <input className="w-full p-2 bg-[#021018] rounded border border-white/6" value={form.idade} onChange={e=>setForm(f=>({...f, idade: e.target.value}))} />

          <div className="mt-2">Origem</div>
          <select className="w-full p-2 bg-[#021018] rounded border border-white/6" value={form.origem_id || ''} onChange={e=>setForm(f=>({...f, origem_id: e.target.value || null}))}>
            <option value="">-- nenhuma --</option>
            {origins.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>

          <div className="mt-2">Classe</div>
          <select className="w-full p-2 bg-[#021018] rounded border border-white/6" value={form.classe_id || ''} onChange={e=>setForm(f=>({...f, classe_id: e.target.value || null}))}>
            <option value="">-- nenhuma --</option>
            {classesList.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="mt-4">
            <button onClick={handleCreate} className="px-4 py-2 bg-green-600 rounded">Criar personagem</button>
            <span className="ml-3 text-sm text-gray-400">{status}</span>
          </div>
        </div>

        <div className="surface-block p-4">
          <CharacterAttributes attributes={attributes} editable={true} onChangeAttribute={handleChangeAttr} />
          <div className="mt-2 text-sm">Soma: {attrSum} — {attrValid ? 'válido' : 'inválido'}</div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowModal(false)} />
          <div className="relative w-full max-w-3xl bg-[#06121a] rounded shadow-lg p-6 z-10">
            <h3 className="font-bold text-xl">Passo 2 — Perícias e Habilidades</h3>
            <div className="mt-2 text-sm text-gray-300">Perícias/habilidade da origem adicionadas automaticamente:</div>
            <ul className="list-disc ml-6 mt-2">
              {originGranted.length === 0 ? <li>— nenhuma</li> : originGranted.map((n, i)=> <li key={i}>{n}</li>)}
            </ul>

            <div className="mt-3">
              {/* show class abilities */}
              <div className="text-sm">Habilidades de classe:</div>
              <ul className="ml-6 mt-2">
                {(() => {
                  const cls = getClassById(form.classe_id);
                  if (!cls) return <li>— nenhuma</li>;
                  const names = [];
                  if (cls.primary_ability_id) {
                    const f = allFeatures.find(ff => String(ff.id) === String(cls.primary_ability_id));
                    if (f) names.push(f.name);
                  }
                  if (cls.secondary_ability_id) {
                    const f2 = allFeatures.find(ff => String(ff.id) === String(cls.secondary_ability_id));
                    if (f2) names.push(f2.name);
                  }
                  if (names.length === 0) return <li>— nenhuma</li>;
                  return names.map((n,i) => <li key={i}>{n}</li>);
                })()}
              </ul>

              <div className="mt-3 text-sm">Escolhas disponíveis:</div>
              {(() => {
                const cls = getClassById(form.classe_id);
                if (!cls) return <div className="mt-2">Selecione uma classe antes.</div>;
                const name = (cls.name||'').toLowerCase();
                if (name === 'combatente') {
                  // combatente: choose weapon pericia and save pericia, then allowedSelectionsRemaining extra pericias
                  const luta = findFeatureByNames(['Luta'], 'pericia');
                  const pontaria = findFeatureByNames(['Pontaria','Tiro'], 'pericia');
                  const reflexos = findFeatureByNames(['Reflexos','Esquiva'], 'pericia');
                  const fortitude = findFeatureByNames(['Fortitude'], 'pericia');
                  const owned = ownedTemplateIds || [];
                  return (
                    <div className="mt-2">
                      <div className="mb-2">Escolha entre Luta e Pontaria (arma):</div>
                      <div className="flex gap-4">
                        {luta && !owned.includes(Number(luta.id)) && <label className="flex items-center gap-2"><input type="radio" name="weapon" checked={String(combatChoiceWeapon)===String(luta && luta.id)} onChange={()=>setCombatChoiceWeapon(luta && luta.id)} /> {luta.name}</label>}
                        {pontaria && !owned.includes(Number(pontaria.id)) && <label className="flex items-center gap-2"><input type="radio" name="weapon" checked={String(combatChoiceWeapon)===String(pontaria && pontaria.id)} onChange={()=>setCombatChoiceWeapon(pontaria && pontaria.id)} /> {pontaria.name}</label>}
                      </div>

                      <div className="mt-3 mb-2">Escolha entre Reflexos e Fortitude (defesa):</div>
                      <div className="flex gap-4">
                        {reflexos && !owned.includes(Number(reflexos.id)) && <label className="flex items-center gap-2"><input type="radio" name="save" checked={String(combatChoiceSave)===String(reflexos && reflexos.id)} onChange={()=>setCombatChoiceSave(reflexos && reflexos.id)} /> {reflexos.name}</label>}
                        {fortitude && !owned.includes(Number(fortitude.id)) && <label className="flex items-center gap-2"><input type="radio" name="save" checked={String(combatChoiceSave)===String(fortitude && fortitude.id)} onChange={()=>setCombatChoiceSave(fortitude && fortitude.id)} /> {fortitude.name}</label>}
                      </div>

                      <div className="mt-4 text-sm">Agora escolha mais {allowedSelectionsRemaining()} perícias (classe + intelecto)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {filteredFeaturesForClass.map(f => (
                          <label key={f.id} className={`p-2 border rounded cursor-pointer ${selectedSkills.find(s=>String(s)===String(f.id)) ? 'bg-green-600/30' : ''}`}>
                            <input type="checkbox" checked={!!selectedSkills.find(s=>String(s)===String(f.id))} onChange={()=>{
                              const already = selectedSkills.find(s=>String(s)===String(f.id));
                              if (already) toggleSkill(f.id);
                              else if (selectedSkills.length < allowedSelectionsRemaining()) toggleSkill(f.id);
                            }} className="mr-2" />
                            <strong>{f.name}</strong>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (name === 'especialista') {
                  return (
                    <div className="mt-2">
                      <div className="text-sm mb-2">Escolha {allowedSelections()} perícias (classe + intelecto):</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {filteredFeaturesForClass.map(f => (
                          <label key={f.id} className={`p-2 border rounded cursor-pointer ${selectedSkills.find(s=>String(s)===String(f.id)) ? 'bg-green-600/30' : ''}`}>
                            <input type="checkbox" checked={!!selectedSkills.find(s=>String(s)===String(f.id))} onChange={()=>{
                              const already = selectedSkills.find(s=>String(s)===String(f.id));
                              if (already) toggleSkill(f.id);
                              else if (selectedSkills.length < allowedSelections()) toggleSkill(f.id);
                            }} className="mr-2" />
                            <strong>{f.name}</strong>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (name === 'ocultista') {
                  // show auto-grants and allow choices
                  const ocult = findFeatureByNames(['Ocultismo','Ocultism'], 'pericia');
                  const vontade = findFeatureByNames(['Vontade','Will'], 'habilidade');
                  return (
                    <div className="mt-2">
                      <div className="mb-2">Ocultista: ganha automaticamente:</div>
                      <ul className="ml-6">
                        <li>{ocult ? ocult.name : 'Ocultismo (não disponível)'}</li>
                        <li>{vontade ? vontade.name : 'Vontade (não disponível)'}</li>
                      </ul>
                        <div className="mt-3 text-sm">Além disso, escolha {allowedSelections()} perícias (classe + intelecto):</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {filteredFeaturesForClass.map(f => (
                            <label key={f.id} className={`p-2 border rounded cursor-pointer ${selectedSkills.find(s=>String(s)===String(f.id)) ? 'bg-green-600/30' : ''}`}>
                              <input type="checkbox" checked={!!selectedSkills.find(s=>String(s)===String(f.id))} onChange={()=>{
                                const already = selectedSkills.find(s=>String(s)===String(f.id));
                                if (already) toggleSkill(f.id);
                                else if (selectedSkills.length < allowedSelections()) toggleSkill(f.id);
                              }} className="mr-2" />
                              <strong>{f.name}</strong>
                            </label>
                          ))}
                        </div>

                        <div className="mt-4">
                          <div className="text-sm mb-2">Escolha 3 rituais para adicionar à ficha:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {filteredRituals.map(r => (
                              <label key={r.id} className={`p-2 border rounded cursor-pointer ${selectedRituals.find(s=>String(s)===String(r.id)) ? 'bg-purple-600/30' : ''}`}>
                                <input type="checkbox" checked={!!selectedRituals.find(s=>String(s)===String(r.id))} onChange={()=>{
                                  const already = selectedRituals.find(s=>String(s)===String(r.id));
                                  if (already) setSelectedRituals(prev => prev.filter(x=>String(x)!==String(r.id)));
                                  else if (selectedRituals.length < 3) setSelectedRituals(prev => [...prev, r.id]);
                                }} className="mr-2" />
                                <strong>{r.name} <span className="text-xs text-gray-300">• Círculo {r.circle}</span></strong>
                              </label>
                            ))}
                          </div>
                          <div className="mt-2 text-sm text-gray-300">Selecionados: {selectedRituals.length}/3</div>
                        </div>
                    </div>
                  );
                }

                // default fallback: allow allowedSelections
                return (
                  <div className="mt-2">
                    <div className="text-sm mb-2">Escolha {allowedSelections()} perícias (classe + intelecto):</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {filteredFeaturesForClass.map(f => (
                        <label key={f.id} className={`p-2 border rounded cursor-pointer ${selectedSkills.find(s=>String(s)===String(f.id)) ? 'bg-green-600/30' : ''}`}>
                          <input type="checkbox" checked={!!selectedSkills.find(s=>String(s)===String(f.id))} onChange={()=>{
                            const already = selectedSkills.find(s=>String(s)===String(f.id));
                            if (already) toggleSkill(f.id);
                            else if (selectedSkills.length < allowedSelections()) toggleSkill(f.id);
                          }} className="mr-2" />
                          <strong>{f.name}</strong>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-4 flex gap-3">
                <button onClick={handleApplyChoices} className="px-4 py-2 bg-blue-600 rounded">Aplicar escolhas</button>
                <button onClick={()=>setShowModal(false)} className="px-4 py-2 bg-gray-600 rounded">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
