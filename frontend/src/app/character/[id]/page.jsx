"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params || {};

  const [character, setCharacter] = useState(null);
  const [status, setStatus] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

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
        setStatus("");
      } catch (err) {
        setStatus("> erro de conexão");
      }
    };

    fetchCharacter();
  }, [id]);

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
            <button
              onClick={() => router.push("/dashboard")}
              className="border border-white/10 px-3 py-1 rounded text-sm hover:bg-white/5"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      <main>
        <div className="card flex flex-col md:flex-row overflow-hidden bg-white/3 rounded-lg">
          {/* Left: large square photo */}
          <div className="w-full md:w-1/3 flex-shrink-0 bg-[#021018] flex items-center justify-center">
            <div className="w-full max-w-[420px] aspect-square">
              {character.imagem_perfil ? (
                <img src={character.imagem_perfil} alt={character.name} className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">SEM IMAGEM</div>
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
                    <p>{getPatente(character.prestigio)}</p>
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
                    <img src={character.imagem_token} alt="token" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">TOKEN</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}