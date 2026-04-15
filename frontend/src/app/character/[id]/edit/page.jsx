"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FichaPaper from "../../../../components/FichaPaper";
import ImageModal from "../../../../components/ImageModal";
import StatusFormulaModal from "../../../../components/StatusFormulaModal";
import StatusSection from "../../../../components/StatusSection";
import CharacterStates from "../../../../components/CharacterStates";
import CharacterAttributes from "../../../../components/CharacterAttributes";
import ProtectionsPanel from "../../../../components/ProtectionsPanel";
import PericiasPanel from "../../../../components/PericiasPanel";
import AttacksPanel from "../../../../components/AttacksPanel";
import ProficienciesPanel from "../../../../components/ProficienciesPanel";
import InventoryPanel from "../../../../components/InventoryPanel";
import SkillsPanel from "../../../../components/SkillsPanel";
import RituaisPanel from "../../../../components/RituaisPanel";

export default function CharacterEditPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};

  const [character, setCharacter] = useState(null);
  const [form, setForm] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [protections, setProtections] = useState([]);
  const [resistances, setResistances] = useState({});
  const [background, setBackground] = useState(null);
  const [phobias, setPhobias] = useState([]);
  const [paranormalEncounters, setParanormalEncounters] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('ficha');
  const [status, setStatus] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [trailsList, setTrailsList] = useState([]);
  const [originsList, setOriginsList] = useState([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorType, setImageEditorType] = useState(null); // 'perfil' | 'token'
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        setCurrentUserName(payload.name || payload.email || "");
      }
    } catch (e) {}

    const fetchCharacter = async () => {
      setStatus("> carregando ficha...");
      try {
        const res = await fetch(`http://localhost:3001/characters/${id}/full`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setStatus("> erro ao carregar ficha");
          return;
        }
        const data = await res.json();
        setCharacter(data.character || data);
        // initialize editable form from character (include *_id fields)
        setForm({
          name: (data.character && data.character.name) || '',
          idade: (data.character && data.character.idade) || '',
          origem: (data.character && data.character.origem) || '',
          origem_id: (data.character && data.character.origem_id) || null,
          classe: (data.character && data.character.classe) || '',
          classe_id: (data.character && data.character.classe_id) || null,
          trilha: (data.character && data.character.trilha) || '',
          trilha_id: (data.character && data.character.trilha_id) || null,
          nivel: (data.character && data.character.nivel) || '',
          nex: (data.character && data.character.nex) || '',
          prestigio: (data.character && data.character.prestigio) || '',
          patente: (data.character && data.character.patente) || '',
          afinidade: (data.character && data.character.afinidade) || '',
          imagem_perfil: (data.character && data.character.imagem_perfil) || '',
          imagem_token: (data.character && data.character.imagem_token) || ''
          ,
          status_formula: (data.character && data.character.status_formula) ? (typeof data.character.status_formula === 'string' ? JSON.parse(data.character.status_formula) : data.character.status_formula) : null,
          defense_formula: (data.character && data.character.defense_formula) ? (typeof data.character.defense_formula === 'string' ? JSON.parse(data.character.defense_formula) : data.character.defense_formula) : null
        });
        setAttributes(data.attributes || {});
        setProtections(data.protections || []);
        setResistances(data.resistances || {});
        setBackground(data.background || null);
        setPhobias(data.phobias || []);
        setParanormalEncounters(data.paranormal_encounters || []);

        try {
          const t = await fetch(`http://localhost:3001/characters/${id}/tabs`, { headers: { Authorization: `Bearer ${token}` } });
          if (t.ok) {
            const tabsJson = await t.json();
            setTabs(tabsJson || []);
            if (tabsJson && tabsJson.length > 0) setActiveTab(tabsJson[0].tab_key || 'ficha');
          }
        } catch (e) {}

        setStatus("");
      } catch (err) {
        setStatus("> erro de conexão");
      }
    };

    fetchCharacter();

    // fetch template lists (classes, origins)
    (async () => {
      try {
        const tkn = localStorage.getItem('token');
        const resC = await fetch('http://localhost:3001/templates/classes', { headers: { Authorization: `Bearer ${tkn}` } });
        if (resC.ok) setClassesList(await resC.json());
        const resO = await fetch('http://localhost:3001/templates/origins', { headers: { Authorization: `Bearer ${tkn}` } });
        if (resO.ok) setOriginsList(await resO.json());
      } catch (e) {}
    })();
  }, [id]);

  // autosave form changes to backend (debounced)
  useEffect(() => {
    if (!form || !id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const handler = setTimeout(async () => {
      try {
        // prepare payload (send raw strings or numbers as-is)
        const payload = {
          name: form.name,
          idade: form.idade === '' ? null : (isNaN(Number(form.idade)) ? form.idade : Number(form.idade)),
          origem: form.origem,
          origem_id: form.origem_id || null,
          classe: form.classe,
          classe_id: form.classe_id || null,
          trilha: form.trilha,
          trilha_id: form.trilha_id || null,
          nivel: form.nivel === '' ? null : (isNaN(Number(form.nivel)) ? form.nivel : Number(form.nivel)),
          nex: form.nex === '' ? null : (isNaN(Number(form.nex)) ? form.nex : Number(form.nex)),
          prestigio: form.prestigio === '' ? null : (isNaN(Number(form.prestigio)) ? form.prestigio : Number(form.prestigio)),
          afinidade: form.afinidade,
          imagem_perfil: form.imagem_perfil,
          imagem_token: form.imagem_token,
          status_formula: form.status_formula || null,
          defense_formula: form.defense_formula || null
        };

        const res = await fetch(`http://localhost:3001/characters/${id}/details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          // parse returned json: controller may return computed max stats in `computed`
          try {
            const j = await res.json();
            const computed = j && j.computed ? j.computed : {};
            // apply payload and any computed fields returned by server
            setCharacter(prev => ({ ...prev, ...payload, ...(computed || {}) }));
          } catch (e) {
            // fallback: at least apply payload
            setCharacter(prev => ({ ...prev, ...payload }));
          }
        } else {
          // you may want to handle server errors (for now just log)
          try { const j = await res.json(); console.error('Erro ao salvar detalhes:', j); } catch (e) { console.error('Erro ao salvar detalhes'); }
        }
      } catch (e) {
        console.error('Erro no autosave de detalhes', e);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [form]);

  // autosave attributes to backend (debounced)
  useEffect(() => {
    if (!attributes || !id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const handler = setTimeout(async () => {
      try {
        const payload = {
          forca: attributes.forca === '' ? null : (isNaN(Number(attributes.forca)) ? attributes.forca : Number(attributes.forca)),
          agilidade: attributes.agilidade === '' ? null : (isNaN(Number(attributes.agilidade)) ? attributes.agilidade : Number(attributes.agilidade)),
          intelecto: attributes.intelecto === '' ? null : (isNaN(Number(attributes.intelecto)) ? attributes.intelecto : Number(attributes.intelecto)),
          vigor: attributes.vigor === '' ? null : (isNaN(Number(attributes.vigor)) ? attributes.vigor : Number(attributes.vigor)),
          presenca: attributes.presenca === '' ? null : (isNaN(Number(attributes.presenca)) ? attributes.presenca : Number(attributes.presenca))
        };

        const res = await fetch(`http://localhost:3001/attributes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          try { const j = await res.json(); console.error('Erro ao salvar atributos:', j); } catch(e) { console.error('Erro ao salvar atributos'); }
        }
      } catch (e) {
        console.error('Erro no autosave de atributos', e);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [attributes]);

  if (status) {
    return (
      <div className="p-6">
        <p className="font-mono text-green-400">{status}</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="p-6">
        <p>Nenhuma ficha encontrada.</p>
      </div>
    );
  }

  const getPatente = (prestigio = 0) => {
    if (prestigio >= 200) return "Agente de Elite";
    if (prestigio >= 100) return "Oficial de Operações";
    if (prestigio >= 50) return "Agente Especial";
    if (prestigio >= 20) return "Operador";
    return "Recruta";
  };

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Editar Ficha: {character.name}</h2>
            <p className="text-xs text-gray-400">Jogador: {currentUserName || character.user_name || "-"}</p>
          </div>

          <div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/character/${id}`)}
                className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
              >
                Voltar à visualização
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* For now the edit page is a copy of the view page; later we will convert fields to editable forms */}
      <main>
        <div className="card flex flex-col md:flex-row overflow-hidden bg-white/3 rounded-lg">
          <div className="w-full md:w-1/3 flex-shrink-0 bg-[#021018] flex items-center justify-center">
              <div className="w-full max-w-[420px] aspect-square">
                <div onClick={()=>{ setImageEditorType('perfil'); setShowImageEditor(true); }} className="w-full h-full cursor-pointer">
                  {form && form.imagem_perfil ? (
                    <img src={form.imagem_perfil} alt={form.name || character.name} className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">SEM IMAGEM</div>
                  )}
                </div>
              </div>
          </div>

          <div className="flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center mb-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400">Nome do Agente</label>
                  <input value={form ? form.name : ''} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs text-gray-400">Jogador</label>
                  <div className="p-2 text-sm text-gray-300">{currentUserName || character.user_name || '-'}</div>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-transparent">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs">Idade</label>
                    <input type="number" value={form ? form.idade : ''} onChange={e=>setForm(f=>({...f, idade: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Origem</label>
                    <select value={form ? (form.origem_id || '') : ''} onChange={e=>{
                      const val = e.target.value || null;
                      const originObj = originsList.find(o=>String(o.id)===String(val));
                      setForm(f=>({...f, origem_id: val, origem: originObj ? originObj.name : ''}));
                    }} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                      <option value="">-- selecione --</option>
                      {originsList.map(o=> <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Classe</label>
                    <select value={form ? (form.classe_id || '') : ''} onChange={async e=>{
                      const val = e.target.value || null;
                      const classObj = classesList.find(c=>String(c.id)===String(val));
                      setForm(f=>({...f, classe_id: val, classe: classObj ? classObj.name : '' , trilha_id: null, trilha: ''}));
                      // fetch trails for class
                      try {
                        const tkn = localStorage.getItem('token');
                        const res = await fetch(`http://localhost:3001/templates/trails/${val}`, { headers: { Authorization: `Bearer ${tkn}` } });
                        if (res.ok) {
                          const json = await res.json();
                          setTrailsList(json || []);
                        } else setTrailsList([]);
                      } catch (e) { setTrailsList([]); }
                    }} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                      <option value="">-- selecione --</option>
                      {classesList.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Trilha</label>
                    <select value={form ? (form.trilha_id || '') : ''} onChange={e=>{
                      const val = e.target.value || null;
                      const tObj = trailsList.find(t=>String(t.id)===String(val));
                      setForm(f=>({...f, trilha_id: val, trilha: tObj ? tObj.name : ''}));
                    }} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                      <option value="">-- selecione --</option>
                      {trailsList.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Nível</label>
                    <input type="number" value={form ? form.nivel : ''} onChange={e=>setForm(f=>({...f, nivel: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">NEX</label>
                    <input type="number" value={form ? form.nex : ''} onChange={e=>setForm(f=>({...f, nex: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Prestígio</label>
                    <input type="number" value={form ? form.prestigio : ''} onChange={e=>setForm(f=>({...f, prestigio: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6" />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs">Patente</label>
                    <input readOnly value={getPatente(form ? (Number(form.prestigio) || 0) : 0)} className="w-full p-2 rounded bg-[#021018] border border-white/6 bg-opacity-40" />
                  </div>

                  <div className="col-span-2">
                    <label className="text-gray-400 text-xs">Afinidade</label>
                    <select value={form ? (form.afinidade || '') : ''} onChange={e=>setForm(f=>({...f, afinidade: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6">
                      <option value="">-- selecione --</option>
                      <option value="Sangue">Sangue</option>
                      <option value="Morte">Morte</option>
                      <option value="Conhecimento">Conhecimento</option>
                      <option value="Energia">Energia</option>
                    </select>
                  </div>

                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">Jogador</p>
                        <p>{currentUserName || character.user_name || "-"}</p>
                      </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-full max-w-[220px] aspect-[2/3] border border-white/10 bg-[#021018] cursor-pointer" onClick={()=>{ setImageEditorType('token'); setShowImageEditor(true); }}>
                  {form && form.imagem_token ? (
                    <img src={form.imagem_token} alt="token" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">TOKEN</div>
                  )}
                </div>
              
              <ImageModal
                open={showImageEditor}
                title={imageEditorType === 'perfil' ? 'Editar imagem de perfil' : 'Editar token'}
                initialUrl={imageEditorType === 'perfil' ? (form ? form.imagem_perfil : '') : (form ? form.imagem_token : '')}
                onClose={() => setShowImageEditor(false)}
                onSave={(url) => {
                  if (imageEditorType === 'perfil') {
                    setForm(f=>({...f, imagem_perfil: url}));
                  } else if (imageEditorType === 'token') {
                    setForm(f=>({...f, imagem_token: url}));
                  }
                  setShowImageEditor(false);
                }}
              />
              <StatusFormulaModal
                open={showFormulaModal}
                initial={form ? ({ ...(form.status_formula || {}), defense: (form.defense_formula || null), nivel: form.nivel }) : null}
                onClose={() => setShowFormulaModal(false)}
                onSave={(obj) => {
                  // obj contains status fields and nested obj.defense
                  const statusOnly = { vida: obj.vida, esforco: obj.esforco, sanidade: obj.sanidade };
                  setForm(f => ({ ...(f || {}), status_formula: statusOnly, defense_formula: obj.defense || (obj.defesa || null) }));
                  setShowFormulaModal(false);
                }}
              />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tabs: reuse same layout */}
      <div className="mt-6">
        <div className="flex gap-2">
          {(tabs && tabs.length > 0 ? tabs : [
            { tab_key: 'ficha', title: 'Ficha' },
            { tab_key: 'antecedente', title: 'Antecedente' },
            { tab_key: 'notas', title: 'Notas' }
          ]).map(t => (
            <button key={t.tab_key} onClick={() => setActiveTab(t.tab_key)} className={`px-3 py-1 rounded ${activeTab===t.tab_key ? 'bg-white/8' : 'bg-transparent'} border border-white/10`}>{t.title}</button>
          ))}
        </div>
      </div>

      {activeTab === 'ficha' ? (
        <>
          <FichaPaper>
            <div className="flex items-center justify-end px-4 -mt-2">
              <button
                onClick={() => setShowFormulaModal(true)}
                title="Configurar cálculo automático de status"
                className="border border-white/10 px-2 py-1 rounded text-sm hover:bg-white/5"
              >
                ⚙️ Fórmulas
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-2 pr-4 md:pr-8 md:border-r md:border-white/6">
                <StatusSection character={character} />
              </div>

              <div className="md:col-span-2">
                <CharacterStates character={character} />
              </div>

                <div className="md:col-span-2">
                <CharacterAttributes character={character} attributes={attributes} editable={true} onChangeAttribute={(key, value) => {
                  setAttributes(prev => ({ ...(prev || {}), [key]: value }));
                }} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <ProtectionsPanel character={character} attributes={attributes} protections={protections} resistances={resistances} onCharacterUpdate={setCharacter} onResistancesUpdate={setResistances} editable={true} />
              </div>

              <div className="md:col-span-3">
                <PericiasPanel character={character} attributes={attributes} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <AttacksPanel character={character} attributes={attributes} />
              </div>
              <div className="md:col-span-3">
                <ProficienciesPanel character={character} onCharacterUpdate={setCharacter} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <InventoryPanel character={character} onCharacterUpdate={setCharacter} />
              </div>

              <div className="md:col-span-3">
                <SkillsPanel character={character} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-6">
                <RituaisPanel character={character} attributes={attributes} />
              </div>
            </div>
          </FichaPaper>
        </>
      ) : (
        <FichaPaper>
          <div className="p-6">
            <h3 className="text-lg font-bold">{(tabs.find(t=>t.tab_key===activeTab)?.title) || (activeTab==='antecedente'?'Antecedente':'Notas')}</h3>

            {/* reuse the antecedente/notes rendering from view page for now */}
            <div className="mt-4 space-y-6 text-sm">
              <div>
                <h4 className="font-semibold">Histórico</h4>
                {background && background.historico ? (
                  <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: background.historico }} />
                ) : (
                  <div className="text-gray-400 mt-2">Sem histórico.</div>
                )}
              </div>
              {/* minimal copy to keep page consistent; editable version will be implemented later */}
            </div>
          </div>
        </FichaPaper>
      )}
    </div>
  );
}
