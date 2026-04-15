"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import FichaPaper from "../../../components/FichaPaper";
import StatusSection from "../../../components/StatusSection";
import CharacterStates from "../../../components/CharacterStates";
import CharacterAttributes from "../../../components/CharacterAttributes";
import ProtectionsPanel from "../../../components/ProtectionsPanel";
import PericiasPanel from "../../../components/PericiasPanel";
import AttacksPanel from "../../../components/AttacksPanel";
import ProficienciesPanel from "../../../components/ProficienciesPanel";
import InventoryPanel from "../../../components/InventoryPanel";
import SkillsPanel from "../../../components/SkillsPanel";
import RituaisPanel from "../../../components/RituaisPanel";
// Image modal removed from view page — editing handled on the edit route

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};

  const [character, setCharacter] = useState(null);
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
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  // modal state removed from view page; edit page handles image editing

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    // set current logged user name from token for 'Jogador' field
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        setCurrentUserName(payload.name || payload.email || "");
      }
    } catch (e) {
      // ignore
    }

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
        // backend returns { character, attributes, features }
        setCharacter(data.character || data);
        setAttributes(data.attributes || {});
  setProtections(data.protections || []);
  setResistances(data.resistances || {});
  setBackground(data.background || null);
  setPhobias(data.phobias || []);
  setParanormalEncounters(data.paranormal_encounters || []);
        // fetch tabs for this character
        try {
          const t = await fetch(`http://localhost:3001/characters/${id}/tabs`, { headers: { Authorization: `Bearer ${token}` } });
          if (t.ok) {
            const tabsJson = await t.json();
            setTabs(tabsJson || []);
            if (tabsJson && tabsJson.length > 0) setActiveTab(tabsJson[0].tab_key || 'ficha');
          }
        } catch (e) {
          // ignore
        }
        setStatus("");
      } catch (err) {
        setStatus("> erro de conexão");
      }
    };

    fetchCharacter();
  }, [id]);

  // load notes when Notes tab is activated
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

  // notes helpers
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
            <h2 className="text-lg font-bold">{character.name}</h2>
            <p className="text-xs text-gray-400">Jogador: {currentUserName || character.user_name || "-"}</p>
          </div>

          <div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
              >
                Voltar
              </button>
              <button
                onClick={() => router.push(`/character/${id}/edit`)}
                className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <main>
        <div className="card flex flex-col md:flex-row overflow-hidden bg-white/3 rounded-lg">
          {/* Left: large square photo */}
          <div className="w-full md:w-1/3 flex-shrink-0 bg-[#021018] flex items-center justify-center">
            <div className="w-full max-w-[420px] aspect-square">
              {character.imagem_perfil ? (
                <img
                  src={character.imagem_perfil}
                  alt={character.name}
                  className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg cursor-pointer"
                  onClick={() => router.push(`/character/${id}/edit`)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs text-gray-500 cursor-pointer"
                  onClick={() => router.push(`/character/${id}/edit`)}
                >
                  SEM IMAGEM
                </div>
              )}
            </div>
          </div>

          {/* Right: name title and two-block layout (info | token) */}
          <div className="flex-1 p-6">
            <h3 className="text-2xl font-bold mb-4">Nome do Agente: {character.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left block: other info (spans 2 columns on md) */}
              <div className="md:col-span-2 bg-transparent">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs">Idade</p>
                    <p>{character.idade || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Origem</p>
                    <p>{character.origem || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Classe</p>
                    <p>{character.classe || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Trilha</p>
                    <p>{character.trilha || "-"}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Nível</p>
                    <p>{character.nivel || 0}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">NEX</p>
                    <p>{character.nex || 0}%</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Prestígio</p>
                    <p>{character.prestigio || 0}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs">Patente</p>
                    <p>{character.patente || getPatente(character.prestigio)}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs">Afinidade</p>
                    <p>{character.afinidade || "-"}</p>
                  </div>

                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">Jogador</p>
                        <p>{currentUserName || character.user_name || "-"}</p>
                      </div>
                </div>
              </div>

              {/* Right block: token image */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-[220px] aspect-[2/3] border border-white/10 bg-[#021018]">
                  {character.imagem_token ? (
                    <img
                      src={character.imagem_token}
                      alt="token"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => router.push(`/character/${id}/edit`)}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs text-gray-500 cursor-pointer"
                      onClick={() => router.push(`/character/${id}/edit`)}
                    >
                      TOKEN
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === 'ficha' ? (
        <>
          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-2 pr-4 md:pr-8 md:border-r md:border-white/6">
                <StatusSection character={character} />
              </div>

              <div className="md:col-span-2">
                <CharacterStates character={character} />
              </div>

                <div className="md:col-span-2">
                <CharacterAttributes character={character} attributes={attributes} />
              </div>
            </div>
          </FichaPaper>

          <FichaPaper>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
              <div className="md:col-span-3">
                <ProtectionsPanel character={character} attributes={attributes} protections={protections} resistances={resistances} onCharacterUpdate={setCharacter} onResistancesUpdate={setResistances} />
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

            {/* Antecedentes content */}
            {activeTab === 'antecedente' ? (
              <div className="mt-4 space-y-6 text-sm">
                <div>
                  <h4 className="font-semibold">Histórico</h4>
                  {background && background.historico ? (
                    <div className="prose max-w-none mt-2" dangerouslySetInnerHTML={{ __html: background.historico }} />
                  ) : (
                    <div className="text-gray-400 mt-2">Sem histórico.</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold">Aparência</h4>
                    <div className="mt-2">{background && background.aparencia ? background.aparencia : <span className="text-gray-400">—</span>}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Personalidade</h4>
                    <div className="mt-2">{background && background.personalidade ? background.personalidade : <span className="text-gray-400">—</span>}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold">Prato favorito</h4>
                    <div className="mt-2">{background && background.prato_favorito ? background.prato_favorito : <span className="text-gray-400">—</span>}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Pessoas importantes</h4>
                    <div className="mt-2">{background && background.pessoas_importantes ? background.pessoas_importantes : <span className="text-gray-400">—</span>}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Pertences queridos</h4>
                    <div className="mt-2">{background && background.pertences_queridos ? background.pertences_queridos : <span className="text-gray-400">—</span>}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Contatos</h4>
                  <div className="mt-2">{background && background.contatos ? background.contatos : <span className="text-gray-400">—</span>}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold">Traumas</h4>
                    <div className="mt-2">{background && background.traumas ? background.traumas : <span className="text-gray-400">—</span>}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Doenças</h4>
                    <div className="mt-2">{background && background.doencas ? background.doencas : <span className="text-gray-400">—</span>}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Manias</h4>
                    <div className="mt-2">{background && background.manias ? background.manias : <span className="text-gray-400">—</span>}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Objetivo</h4>
                  <div className="mt-2">{background && background.objetivo ? background.objetivo : <span className="text-gray-400">—</span>}</div>
                </div>

                <div>
                  <h4 className="font-semibold">Fobias</h4>
                  {phobias && phobias.length > 0 ? (
                    <ul className="list-disc ml-6 mt-2">
                      {phobias.map(p => (
                        <li key={p.id}>
                          <strong>{p.phobia_name || p.custom_name || '(sem nome)'}</strong>
                          {p.phobia_short_description || p.custom_short_description ? (
                            <div className="text-xs text-gray-400">{p.phobia_short_description || p.custom_short_description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 mt-2">Sem fobias registradas.</div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold">Encontros paranormais</h4>
                  {paranormalEncounters && paranormalEncounters.length > 0 ? (
                    <div className="mt-2 space-y-3">
                      {paranormalEncounters.map(enc => (
                        <div key={enc.id} className="p-3 border border-white/6 rounded">
                          <div className="flex items-baseline justify-between">
                            <strong>{enc.title || 'Sem título'}</strong>
                            <span className="text-xs text-gray-400">Sanidade perdida: {enc.sanity_loss || 0}</span>
                          </div>
                          <div className="text-sm mt-1">{enc.description || ''}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 mt-2">Nenhum encontro paranormal registrado.</div>
                  )}
                </div>
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
                        <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Título" className="w-full px-3 py-2 bg-transparent border border-white/6 rounded" />
                      </div>
                      <div>
                        <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={12} className="w-full p-3 bg-transparent border border-white/6 rounded" placeholder="Conteúdo" />
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

      {/* As sections da ficha agora são renderizadas dentro da aba ativa (veja abaixo). */}

      {/* ImageModal removed from view page; editing happens on the edit route */}

    </div>
  );
}

// Modal render placed outside to keep main return tidy