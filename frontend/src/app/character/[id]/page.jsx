"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CharacterPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:3001/characters/${id}/full`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      setData(result);
    };

    fetchCharacter();
  }, [id]);

  if (!data) return null;

  const { character, attributes } = data;

  const percent = (atual, max) =>
    max ? Math.min((atual / max) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* VOLTAR */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 text-xs border px-3 py-1"
      >
        ← VOLTAR
      </button>

        {/* ========================= */}
        {/* 🪪 IDENTIDADE (HERO) */}
        {/* ========================= */}

        <div className="h-[60vh] flex items-center">

        <div className="w-full flex rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden">

            {/* FOTO */}
            <div className="flex items-center justify-center border-r border-white/20 px-4">

            <div className="aspect-square h-[60%] bg-black">
                {character.imagem_perfil ? (
                <img
                    src={character.imagem_perfil}
                    className="w-full h-full object-cover"
                />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    SEM IMAGEM
                </div>
                )}
            </div>

            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 px-8 py-6 flex flex-col justify-between">

            {/* NOME */}
            <div>
                <p className="text-sm tracking-[0.4em] text-gray-400 uppercase">
                Agente
                </p>

                <h1 className="text-4xl font-bold tracking-wide mt-2">
                {character.name}
                </h1>
            </div>

            {/* DADOS */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-gray-300 mt-6">

                <p>Idade: {character.idade || "-"}</p>
                <p>Jogador: {character.user_name || "-"}</p>

                <p>Classe: {character.classe || "-"}</p>
                <p>Trilha: {character.trilha || "-"}</p>

                <p>Origem: {character.origem || "-"}</p>
                <p>Patente: {character.patente || "-"}</p>

                <p>Nível: {character.nivel || "-"}</p>
                <p>NEX: {character.nex}%</p>

                <p>Afinidade: {character.afinidade || "-"}</p>

            </div>

            </div>

            {/* TOKEN */}
            <div className="h-full aspect-[2/3] border-l border-white/20 bg-black flex-shrink-0">
            {character.imagem_token ? (
                <img
                src={character.imagem_token}
                className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                TOKEN
                </div>
            )}
            </div>

        </div>

        </div>

      {/* ========================= */}
      {/* 📊 CORPO (3 COLUNAS) */}
      {/* ========================= */}

      <div className="grid grid-cols-3 gap-6 mt-6">

        {/* ================= */}
        {/* COLUNA 1 */}
        {/* ================= */}
        <div className="space-y-4">

          {/* VIDA */}
          <div className="border p-3">
            <p className="text-sm">VIDA</p>
            <p>{character.vida_atual}/{character.vida_max} (+{character.vida_temp})</p>
            <div className="h-2 bg-gray-800 mt-2">
              <div
                className="h-full bg-red-500"
                style={{ width: `${percent(character.vida_atual, character.vida_max)}%` }}
              />
            </div>
          </div>

          {/* PE */}
          <div className="border p-3">
            <p className="text-sm">ESFORÇO</p>
            <p>{character.esforco_atual}/{character.esforco_max} (+{character.esforco_temp})</p>
            <div className="h-2 bg-gray-800 mt-2">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${percent(character.esforco_atual, character.esforco_max)}%` }}
              />
            </div>
          </div>

          {/* SANIDADE */}
          <div className="border p-3">
            <p className="text-sm">SANIDADE</p>
            <p>{character.sanidade_atual}/{character.sanidade_max}</p>
            <div className="h-2 bg-gray-800 mt-2">
              <div
                className="h-full bg-blue-400"
                style={{ width: `${percent(character.sanidade_atual, character.sanidade_max)}%` }}
              />
            </div>
          </div>

        </div>

        {/* ================= */}
        {/* COLUNA 2 */}
        {/* ================= */}
        <div className="space-y-4">

          {/* ESTADOS */}
          <div className="border p-3">
            <p>Morrendo: {character.morrendo}/3</p>
            <p>Enlouquecendo: {character.enlouquecendo}/3</p>
          </div>

          {/* DEFESAS */}
          <div className="border p-3">
            <p>Defesa: {character.defesa || 0}</p>
            <p>Esquiva: {character.esquiva || 0}</p>
            <p>Bloqueio: {character.bloqueio || 0}</p>
          </div>

          {/* OUTROS */}
          <div className="border p-3 flex justify-between">
            <div>
              <p className="text-xs">Limite PE</p>
              <p>{character.limite_pe || 1}</p>
            </div>
            <div>
              <p className="text-xs">Deslocamento</p>
              <p>{character.deslocamento_atual}/{character.deslocamento_max}</p>
            </div>
          </div>

        </div>

        {/* ================= */}
        {/* COLUNA 3 */}
        {/* ================= */}
        <div className="border p-3 flex items-center justify-center">

          <div className="text-center">
            <p className="text-xs mb-2">ATRIBUTOS</p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <p>FOR {attributes.forca}</p>
              <p>AGI {attributes.agilidade}</p>
              <p>INT {attributes.intelecto}</p>
              <p>VIG {attributes.vigor}</p>
              <p>PRE {attributes.presenca}</p>
            </div>

            <p className="text-[10px] text-gray-500 mt-3">
              (pentágono visual depois)
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}