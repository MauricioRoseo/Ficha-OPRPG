"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from 'react-dom';
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('player');
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [classesList, setClassesList] = useState([]);
  const [trailsList, setTrailsList] = useState([]);
  const [originsList, setOriginsList] = useState([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorType, setImageEditorType] = useState(null); // 'perfil' | 'token'
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showChooseTrailModal, setShowChooseTrailModal] = useState(false);
  const [trailOptions, setTrailOptions] = useState([]);
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [pendingLevelUpType, setPendingLevelUpType] = useState('level');
  const [showChooseRitualModal, setShowChooseRitualModal] = useState(false);
  const [ritualOptions, setRitualOptions] = useState([]);
  const [selectedRitualId, setSelectedRitualId] = useState(null);
  const [pendingTrailForRitual, setPendingTrailForRitual] = useState(null);
  const [showTranscendModal, setShowTranscendModal] = useState(false);
  const [showChooseFeatureModal, setShowChooseFeatureModal] = useState(false);
  const [featureOptions, setFeatureOptions] = useState([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

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
        setCurrentUserId(payload.id || null);
        setCurrentUserRole(payload.role || payload.roles || 'player');
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

  const applyLevelUp = async (type, extra) => {
    if (!form) return;
    const token = localStorage.getItem('token');
    if (!token) { setStatus('Não autenticado'); return; }
    setStatus('Aplicando upgrade...');
    try {
      const body = { type };
      console.debug('applyLevelUp payload', { type, extra });
      if (extra && extra.selected_trilha_id) body.selected_trilha_id = extra.selected_trilha_id;
      if (extra && extra.selected_ritual_id) body.selected_ritual_id = extra.selected_ritual_id;
      if (extra && extra.selected_feature_id) body.selected_feature_id = extra.selected_feature_id;
      const res = await fetch(`http://localhost:3001/characters/${id}/levelup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>null);
        setStatus((j && j.message) || 'Erro ao aplicar upgrade');
        return;
      }
      const j = await res.json();
      if (j && j.character) {
        setForm(prev => ({ ...(prev||{}), nivel: j.character.nivel, nex: j.character.nex, trilha_id: j.character.trilha_id || prev.trilha_id, trilha: j.character.trilha || prev.trilha }));
        setCharacter(prev => ({ ...(prev||{}), nivel: j.character.nivel, nex: j.character.nex, trilha_id: j.character.trilha_id || prev.trilha_id, trilha: j.character.trilha || prev.trilha }));
      }
      if (j && j.computed) setCharacter(prev => ({ ...(prev||{}), ...(j.computed||{}) }));
      setStatus('Upgrade aplicado');
    } catch (e) {
      console.error(e);
      setStatus('Erro de conexão');
    } finally {
      setShowLevelUpModal(false);
    }
  };

  const openChooseTrailIfNeeded = async (type) => {
    // if applying level and character will reach level 2 and has no trail yet, open selection
    const curLevel = Number(form && form.nivel) || 0;
    const willReach2 = (type === 'level' && curLevel < 2 && (curLevel + 1) >= 2);
    if (!willReach2) {
      // if not reaching level 2, but class is Ocultista, offer ritual choice before applying
      try {
        const clsName = (form && form.classe || '').toLowerCase();
        if (clsName.includes('ocult')) {
          // fetch rituals
          const tkn = localStorage.getItem('token');
          const rres = await fetch(`http://localhost:3001/rituals`, { headers: { Authorization: `Bearer ${tkn}` } });
          if (!rres.ok) return applyLevelUp(type);
          const rituals = await rres.json();
          setRitualOptions(rituals || []);
          setPendingLevelUpType(type);
          setShowChooseRitualModal(true);
          return;
        }
      } catch (e) { /* fallback to direct apply */ }
      return applyLevelUp(type);
    }
    if (form && form.trilha_id) {
      // already has trilha, apply directly
      return applyLevelUp(type);
    }
    // fetch trails for class
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/templates/trails?classId=${form.classe_id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setStatus('Erro ao carregar trilhas'); return; }
      const trails = await res.json();
      // fetch features to enrich ability info
      const fRes = await fetch('http://localhost:3001/features');
      const feats = fRes.ok ? await fRes.json() : [];
      const enriched = (trails || []).map(t => {
        const ability = feats ? feats.find(f => f.id === t.ability_lvl_2_id) : null;
        return { ...t, ability };
      });
        setTrailOptions(enriched);
        setPendingLevelUpType(type);
        setShowChooseTrailModal(true);
    } catch (e) {
      setStatus('Erro ao carregar trilhas');
    }
  };

  function ChooseTrailModal({ open, onClose, options, onConfirm }) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[10001] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-2xl z-[10002] pointer-events-auto">
          <h3 className="text-lg font-bold mb-3">Escolha uma trilha</h3>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {(options || []).map(opt => (
              <div key={opt.id} className={`p-3 border rounded ${selectedTrailId === opt.id ? 'border-green-500 bg-green-900/10' : 'bg-transparent'}`} onClick={() => setSelectedTrailId(opt.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{opt.name}</div>
                    <div className="text-xs text-gray-400">{opt.description}</div>
                  </div>
                  <div className="text-sm text-gray-300">{opt.ability ? opt.ability.name : ''}</div>
                </div>
                {opt.ability && <div className="mt-2 text-sm text-gray-300">{opt.ability.description}</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-1 border rounded" onClick={onClose}>Cancelar</button>
              <button className="px-3 py-2 bg-green-600 rounded" onClick={() => { if (!selectedTrailId) return setStatus('Selecione uma trilha');
                // if character is occultist, after choosing trail allow ritual choice
                const clsName = (form && form.classe || '').toLowerCase();
                if (clsName.includes('ocult')) {
                  // fetch rituals and open ritual modal, keep pending trail id
                  (async () => {
                    try {
                      const tkn = localStorage.getItem('token');
                      const rres = await fetch(`http://localhost:3001/rituals`, { headers: { Authorization: `Bearer ${tkn}` } });
                      if (!rres.ok) { onConfirm(selectedTrailId); return; }
                      const rituals = await rres.json();
                        setShowChooseTrailModal(false);
                        setRitualOptions(rituals || []);
                        setPendingTrailForRitual(selectedTrailId);
                        setShowChooseRitualModal(true);
                    } catch (e) { onConfirm(selectedTrailId); }
                  })();
                } else onConfirm(selectedTrailId);
              }}>Confirmar escolha</button>
            </div>
        </div>
      </div>,
      document.body
    );
  }

  function LevelUpModal({ open, onClose, onApply }) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 z-[9999]" onClick={onClose} />
        <div className="relative bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md z-[10000] pointer-events-auto transition-none">
          <h3 className="text-lg font-bold mb-3">Subir Nível — Escolha uma opção</h3>
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <button onClick={() => openChooseTrailIfNeeded('level')} className="px-3 py-2 bg-green-600 rounded">Aumentar Nível (+1)</button>
              <div className="text-sm text-gray-400">Aumenta o nível em 1.</div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => { setPendingLevelUpType('nex'); setShowTranscendModal(true); }} className="px-3 py-2 bg-blue-600 rounded">Aumentar NEX (+5%)</button>
              <div className="text-sm text-gray-400">Aumenta o NEX atual em 5%.</div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => openChooseTrailIfNeeded('both')} className="px-3 py-2 bg-purple-600 rounded">Aumentar Nível e NEX</button>
              <div className="text-sm text-gray-400">Aplica ambas as opções acima.</div>
            </div>

            <div className="flex justify-end">
              <button onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function ChooseRitualModal({ open, onClose, options, onConfirm }) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[10003] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-2xl z-[10004] pointer-events-auto">
          <h3 className="text-lg font-bold mb-3">Escolha um ritual</h3>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {(options || []).map(opt => (
              <div key={opt.id} className={`p-3 border rounded ${selectedRitualId === opt.id ? 'border-green-500 bg-green-900/10' : 'bg-transparent'}`} onClick={() => setSelectedRitualId(opt.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{opt.name}</div>
                    <div className="text-xs text-gray-400">{opt.description}</div>
                  </div>
                  <div className="text-sm text-gray-300">Círculo: {opt.circle || '-'}</div>
                </div>
                {opt.effect && <div className="mt-2 text-sm text-gray-300">{opt.effect}</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-3 py-1 border rounded" onClick={onClose}>Cancelar</button>
            <button className="px-3 py-2 bg-green-600 rounded" onClick={() => { if (!selectedRitualId) return setStatus('Selecione um ritual'); onConfirm(selectedRitualId); }}>Confirmar escolha</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function ChooseFeatureModal({ open, onClose, options, onConfirm }) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[10005] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-2xl z-[10006] pointer-events-auto">
          <h3 className="text-lg font-bold mb-3">Escolha uma habilidade (Poder Paranormal)</h3>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {(options || []).map(opt => (
              <div key={opt.id} className={`p-3 border rounded ${selectedFeatureId === opt.id ? 'border-green-500 bg-green-900/10' : 'bg-transparent'}`} onClick={() => setSelectedFeatureId(opt.id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{opt.name}</div>
                    <div className="text-xs text-gray-400">{opt.description}</div>
                  </div>
                  <div className="text-sm text-gray-300">Origem: {opt.origin || '-'}</div>
                </div>
                {opt.effect && <div className="mt-2 text-sm text-gray-300">{opt.effect}</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-3 py-1 border rounded" onClick={onClose}>Cancelar</button>
            <button className="px-3 py-2 bg-green-600 rounded" onClick={() => { if (!selectedFeatureId) return setStatus('Selecione uma habilidade'); onConfirm(selectedFeatureId); }}>Confirmar escolha</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function TranscendModal({ open, onClose }) {
    if (!open) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div className="fixed inset-0 z-[10007] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-[#021018] border border-white/6 rounded-lg p-4 w-full max-w-md z-[10008] pointer-events-auto">
          <h3 className="text-lg font-bold mb-3">O personagem transcendeu?</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-gray-700 rounded" onClick={() => { setShowTranscendModal(false); onClose(); applyLevelUp('nex'); }}>Não</button>
              <button className="px-3 py-2 bg-indigo-700 rounded" onClick={async () => {
                // ritual path: open ritual picker
                try {
                  const tkn = localStorage.getItem('token');
                  const rres = await fetch(`http://localhost:3001/rituals`, { headers: { Authorization: `Bearer ${tkn}` } });
                  const rituals = rres.ok ? await rres.json() : [];
                  setRitualOptions(rituals || []);
                  setShowTranscendModal(false);
                  setShowChooseRitualModal(true);
                } catch (e) { setShowTranscendModal(false); applyLevelUp('nex'); }
              }}>Com ritual</button>
              <button className="px-3 py-2 bg-rose-700 rounded" onClick={async () => {
                // paranormal path: fetch features filtered by origin
                try {
                  const tkn = localStorage.getItem('token');
                  const fres = await fetch(`http://localhost:3001/features`, { headers: { Authorization: `Bearer ${tkn}` } });
                  const feats = fres.ok ? await fres.json() : [];
                  const paranormal = (feats || []).filter(f => (f.origin || '').toLowerCase().includes('poder paranormal'));
                  setFeatureOptions(paranormal);
                  setShowTranscendModal(false);
                  setShowChooseFeatureModal(true);
                } catch (e) { setShowTranscendModal(false); applyLevelUp('nex'); }
              }}>Com poder paranormal</button>
            </div>
            <div className="text-sm text-gray-400">Se escolher Ritual ou Poder Paranormal, você deverá selecionar o item correspondente.</div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // notes helpers (edit page)
  const fetchNotes = async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/characters/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data || []);
    } catch (e) {
      // ignore
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleSaveNote = async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = { title: noteTitle, content: noteContent };
    try {
      if (editingNote && editingNote.id) {
        const res = await fetch(`http://localhost:3001/characters/${id}/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) return;
      } else {
        const res = await fetch(`http://localhost:3001/characters/${id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) return;
      }
      await fetchNotes();
      handleNewNote();
    } catch (e) {
      // ignore
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/characters/${id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      await fetchNotes();
    } catch (e) {
      // ignore
    }
  };

  // load notes when Notes tab is activated (edit page)
  useEffect(() => {
    if (!id) return;
    if (activeTab !== 'notas') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch(`http://localhost:3001/characters/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setNotes(data || []);
      } catch (e) {
        // ignore quietly
      }
    };

    fetchNotes();
  }, [id, activeTab]);

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

  // Autosave background + phobias + paranormal encounters (debounced)
  const _skipInitialBackgroundSave = useRef(true);
  const _lastSavedSnapshot = useRef(null);
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // avoid saving immediately after load
    if (_skipInitialBackgroundSave.current) {
      _skipInitialBackgroundSave.current = false;
      _lastSavedSnapshot.current = JSON.stringify({ background, phobias, paranormalEncounters });
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const snapshot = JSON.stringify({ background, phobias, paranormalEncounters });
        if (_lastSavedSnapshot.current === snapshot) return; // nothing changed

        const payload = {
          // background fields (send as-is; backend will upsert)
          historico: (background && background.historico) || null,
          aparencia: (background && background.aparencia) || null,
          personalidade: (background && background.personalidade) || null,
          prato_favorito: (background && background.prato_favorito) || null,
          pessoas_importantes: (background && background.pessoas_importantes) || null,
          pertences_queridos: (background && background.pertences_queridos) || null,
          contatos: (background && background.contatos) || null,
          traumas: (background && background.traumas) || null,
          doencas: (background && background.doencas) || null,
          manias: (background && background.manias) || null,
          objetivo: (background && background.objetivo) || null
        };

        // transform phobias: use phobia_id when present, otherwise custom_* fields
        const phobiasPayload = (phobias || []).map(p => {
          if (p && p.phobia_id) return { phobia_id: p.phobia_id };
          return {
            custom_name: p.custom_name || p.custom_name === '' ? p.custom_name : null,
            custom_short_description: p.custom_short_description || null,
            custom_detailed_description: p.custom_detailed_description || null
          };
        });

        const encountersPayload = (paranormalEncounters || []).map(e => ({ title: e.title || null, description: e.description || null, sanity_loss: Number(e.sanity_loss) || 0 }));

        const body = { ...payload, phobias: phobiasPayload, paranormal_encounters: encountersPayload };

        const res = await fetch(`http://localhost:3001/characters/${id}/background`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          _lastSavedSnapshot.current = snapshot;
        } else {
          try { const j = await res.json(); console.error('Erro ao salvar antecedentes:', j); } catch(e) { console.error('Erro ao salvar antecedentes'); }
        }
      } catch (e) {
        console.error('Erro no autosave de antecedentes', e);
      }
    }, 800);

    return () => clearTimeout(handler);
  }, [background, phobias, paranormalEncounters, id]);

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

  // small helper component to add a custom phobia
  function PhobiaAdder({ onAdd }) {
    const [name, setName] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    return (
      <div className="flex flex-col md:flex-row gap-2">
        <input placeholder="Nome da fobia" value={name} onChange={e=>setName(e.target.value)} className="p-1 rounded bg-[#021018] border border-white/6" />
        <input placeholder="Resumo" value={shortDesc} onChange={e=>setShortDesc(e.target.value)} className="p-1 rounded bg-[#021018] border border-white/6" />
        <button onClick={() => { if (!name) return; onAdd({ custom_name: name, custom_short_description: shortDesc }); setName(''); setShortDesc(''); }} className="px-2 py-1 border rounded">Adicionar</button>
      </div>
    );
  }

  function ParanormalAdder({ onAdd }) {
    const [title, setTitle] = useState('');
    const [sanity, setSanity] = useState(0);
    const [desc, setDesc] = useState('');
    return (
      <div className="flex flex-col gap-2">
        <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} className="p-1 rounded bg-[#021018] border border-white/6" />
        <input placeholder="Perda de sanidade" type="number" value={sanity} onChange={e=>setSanity(Number(e.target.value))} className="p-1 rounded bg-[#021018] border border-white/6 w-40" />
        <textarea placeholder="Descrição" value={desc} onChange={e=>setDesc(e.target.value)} className="p-1 rounded bg-[#021018] border border-white/6" />
        <div>
          <button onClick={() => { if (!title) return; onAdd({ title, description: desc, sanity_loss: Number(sanity) || 0 }); setTitle(''); setSanity(0); setDesc(''); }} className="px-2 py-1 border rounded">Adicionar encontro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="surface-block mb-6">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h2 className="text-lg font-bold">Editar Ficha: {character.name}</h2>
            <p className="text-xs text-gray-400">Jogador: {character.user_name || (character.user_id && character.user_id === currentUserId ? currentUserName : (character.user_email || '-'))}</p>
          </div>

          <div>
            <div className="flex gap-2">
                <button
                onClick={() => router.push(currentUserRole === 'master' || currentUserRole === 'admin' ? '/master/pdj' : `/character/${id}`)}
                className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
              >
                Voltar à visualização
              </button>
              <button
                onClick={() => setShowLevelUpModal(true)}
                title="Subir Nível / NEX"
                className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
              >
                ⬆️ Subir Nível
              </button>
            </div>
          </div>
        </div>
        <LevelUpModal open={showLevelUpModal} onClose={()=>setShowLevelUpModal(false)} onApply={(t)=>openChooseTrailIfNeeded(t)} />
        <ChooseTrailModal open={showChooseTrailModal} onClose={()=>{ setShowChooseTrailModal(false); setSelectedTrailId(null); setPendingLevelUpType('level'); }} options={trailOptions} onConfirm={(trailId)=>{ setShowChooseTrailModal(false); setSelectedTrailId(null); setPendingLevelUpType('level'); applyLevelUp(pendingLevelUpType || 'level', { selected_trilha_id: trailId }); }} />
        <ChooseRitualModal open={showChooseRitualModal} onClose={()=>{ setShowChooseRitualModal(false); setSelectedRitualId(null); setPendingTrailForRitual(null); setPendingLevelUpType('level'); }} options={ritualOptions} onConfirm={(ritualId)=>{
          setShowChooseRitualModal(false);
          const trailId = pendingTrailForRitual;
          setSelectedRitualId(null);
          setPendingTrailForRitual(null);
          // determine type explicitly to avoid stale pendingLevelUpType
          const typeToUse = pendingLevelUpType || (trailId ? 'level' : 'nex');
          console.debug('ChooseRitualModal confirm, typeToUse=', typeToUse, 'trailId=', trailId);
          applyLevelUp(typeToUse, { selected_trilha_id: trailId, selected_ritual_id: ritualId });
        }} />
        <ChooseFeatureModal open={showChooseFeatureModal} onClose={()=>{ setShowChooseFeatureModal(false); setSelectedFeatureId(null); setPendingLevelUpType('level'); }} options={featureOptions} onConfirm={(featureId)=>{
          setShowChooseFeatureModal(false);
          setSelectedFeatureId(null);
          // apply levelUp with feature selection
          applyLevelUp('nex', { selected_feature_id: featureId });
        }} />
        <TranscendModal open={showTranscendModal} onClose={()=>setShowTranscendModal(false)} />
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
                  <div className="p-2 text-sm text-gray-300">{character.user_name || (character.user_id && character.user_id === currentUserId ? currentUserName : (character.user_email || '-'))}</div>
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
                        <p>{character.user_name || (character.user_id && character.user_id === currentUserId ? currentUserName : (character.user_email || '-'))}</p>
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
              <LevelUpModal open={showLevelUpModal} onClose={()=>setShowLevelUpModal(false)} onApply={applyLevelUp} />
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
                <PericiasPanel character={character} attributes={attributes} editable={true} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <AttacksPanel character={character} attributes={attributes} editable={true} />
              </div>
              <div className="md:col-span-3">
                <ProficienciesPanel character={character} onCharacterUpdate={setCharacter} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <InventoryPanel character={character} onCharacterUpdate={setCharacter} editable={true} />
              </div>

              <div className="md:col-span-3">
                <SkillsPanel character={character} editable={true} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-6">
                <RituaisPanel character={character} attributes={attributes} editable={true} />
              </div>
            </div>
          </FichaPaper>
        </>
      ) : (
        <FichaPaper>
          <div className="p-6">
            <h3 className="text-lg font-bold">{(tabs.find(t=>t.tab_key===activeTab)?.title) || (activeTab==='antecedente'?'Antecedente':'Notas')}</h3>

            {/* Editable Antecedentes or Notes depending on tab */}
            {activeTab === 'antecedente' ? (
              <div className="mt-4 space-y-6 text-sm">
                <div>
                  <h4 className="font-semibold">Histórico</h4>
                  <textarea value={background ? (background.historico || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), historico: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-36" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Aparência</h4>
                    <textarea value={background ? (background.aparencia || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), aparencia: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-24" />
                  </div>

                  <div>
                    <h4 className="font-semibold">Personalidade</h4>
                    <textarea value={background ? (background.personalidade || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), personalidade: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-24" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold">Prato favorito</h4>
                    <input value={background ? (background.prato_favorito || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), prato_favorito: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Pessoas importantes</h4>
                    <input value={background ? (background.pessoas_importantes || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), pessoas_importantes: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Pertences queridos</h4>
                    <input value={background ? (background.pertences_queridos || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), pertences_queridos: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold">Contatos</h4>
                    <textarea value={background ? (background.contatos || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), contatos: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-24" />
                  </div>

                  <div>
                    <h4 className="font-semibold">Traumas</h4>
                    <textarea value={background ? (background.traumas || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), traumas: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-24" />
                  </div>

                  <div>
                    <h4 className="font-semibold">Doenças</h4>
                    <textarea value={background ? (background.doencas || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), doencas: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2 h-24" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Manias</h4>
                    <input value={background ? (background.manias || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), manias: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Objetivo</h4>
                    <input value={background ? (background.objetivo || '') : ''} onChange={e=>setBackground(b=>({...(b||{}), objetivo: e.target.value}))} className="w-full p-2 rounded bg-[#021018] border border-white/6 mt-2" />
                  </div>
                </div>

                {/* Fobias CRUD */}
                <div>
                  <h4 className="font-semibold">Fobias</h4>
                  <div className="mt-2 space-y-2">
                    {(phobias || []).map((p, idx) => (
                      <div key={idx} className="p-2 border border-white/6 rounded bg-[#021018]">
                        {p.phobia_id ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{p.phobia_name || '(fobia)'}</strong>
                              {p.phobia_short_description ? <div className="text-xs text-gray-400">{p.phobia_short_description}</div> : null}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => {
                                // remove
                                setPhobias(prev => prev.filter((_, i) => i !== idx));
                              }} className="text-xs px-2 py-1 border rounded">Remover</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input placeholder="Nome" value={p.custom_name || ''} onChange={e=>{
                              const v = e.target.value;
                              setPhobias(prev => prev.map((it,i)=> i===idx ? ({ ...(it||{}), custom_name: v }) : it));
                            }} className="w-full p-1 rounded bg-[#021018] border border-white/6" />
                            <input placeholder="Resumo" value={p.custom_short_description || ''} onChange={e=>{
                              const v = e.target.value;
                              setPhobias(prev => prev.map((it,i)=> i===idx ? ({ ...(it||{}), custom_short_description: v }) : it));
                            }} className="w-full p-1 mt-1 rounded bg-[#021018] border border-white/6" />
                            <div className="mt-2 flex gap-2">
                              <button onClick={()=> setPhobias(prev => prev.filter((_,i)=> i!==idx)) } className="text-xs px-2 py-1 border rounded">Remover</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* add new custom phobia */}
                    <div className="p-2 border border-white/6 rounded bg-transparent">
                      <PhobiaAdder onAdd={(obj) => setPhobias(prev => ([...(prev||[]), obj]))} />
                    </div>
                  </div>
                </div>

                {/* Paranormal encounters CRUD */}
                <div>
                  <h4 className="font-semibold">Encontros Paranormais</h4>
                  <div className="mt-2 space-y-2">
                    {(paranormalEncounters || []).map((e, idx) => (
                      <div key={idx} className="p-2 border border-white/6 rounded bg-[#021018]">
                        <input placeholder="Título" value={e.title || ''} onChange={ev=> setParanormalEncounters(prev => prev.map((it,i)=> i===idx ? ({ ...(it||{}), title: ev.target.value }) : it))} className="w-full p-1 rounded bg-[#021018] border border-white/6" />
                        <input placeholder="Perda de sanidade" type="number" value={e.sanity_loss || 0} onChange={ev=> setParanormalEncounters(prev => prev.map((it,i)=> i===idx ? ({ ...(it||{}), sanity_loss: Number(ev.target.value) || 0 }) : it))} className="w-32 p-1 mt-1 rounded bg-[#021018] border border-white/6" />
                        <textarea placeholder="Descrição" value={e.description || ''} onChange={ev=> setParanormalEncounters(prev => prev.map((it,i)=> i===idx ? ({ ...(it||{}), description: ev.target.value }) : it))} className="w-full p-1 mt-1 rounded bg-[#021018] border border-white/6" />
                        <div className="mt-2">
                          <button onClick={()=> setParanormalEncounters(prev => prev.filter((_,i)=> i!==idx)) } className="text-xs px-2 py-1 border rounded">Remover</button>
                        </div>
                      </div>
                    ))}

                    <ParanormalAdder onAdd={(obj) => setParanormalEncounters(prev => ([...(prev||[]), obj]))} />
                  </div>
                </div>

                <div className="text-xs text-gray-400">Alterações são salvas automaticamente (debounce 800ms).</div>
              </div>
            ) : activeTab === 'notas' ? (
              <div className="mt-4 text-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold">Notas</h4>
                  <div>
                    <button onClick={handleNewNote} className="px-3 py-1 rounded border border-white/10 bg-transparent text-sm">Nova nota</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    {notes && notes.length > 0 ? (
                      <ul className="space-y-2">
                        {notes.map(n => (
                          <li key={n.id} className="p-2 border border-white/6 rounded cursor-pointer hover:bg-white/2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium" onClick={() => handleEditNote(n)}>{n.title || '(sem título)'}</div>
                              <div className="text-xs text-gray-400">
                                <button onClick={() => handleDeleteNote(n.id)} className="px-2 py-1 rounded bg-red-600/30">Apagar</button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{(n.created_at || '').slice(0, 10)}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400">Nenhuma nota.</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <div className="mb-2">
                      <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Título" className="w-full px-3 py-2 bg-[#021018] border border-white/6 rounded" />
                    </div>
                    <div>
                      <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={12} className="w-full p-3 bg-[#021018] border border-white/6 rounded" placeholder="Conteúdo" />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={handleSaveNote} className="px-3 py-1 rounded bg-green-600/80">Salvar</button>
                      <button onClick={handleNewNote} className="px-3 py-1 rounded border border-white/10">Cancelar</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 mt-2">Sem conteúdo por enquanto.</div>
            )}
          </div>
        </FichaPaper>
      )}
    </div>
  );
}
