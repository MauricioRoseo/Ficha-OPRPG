"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [characters, setCharacters] = useState([]);
  const [status, setStatus] = useState("> carregando dados...");
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch("http://localhost:3001/characters", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("> erro ao carregar personagens");
          return;
        }

        setCharacters(data);
        setStatus("");
      } catch (err) {
        setStatus("> erro de conexão");
      }
    };

    fetchCharacters();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">

        <div>
          <h1 className="text-2xl tracking-[0.3em]">FICHA OPRPG</h1>
          <p className="text-red-500 text-sm">ARQUIVOS CONFIDENCIAIS</p>
        </div>

        {/* CONTA */}
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-2">AGENTE LOGADO</p>
          <button
            onClick={handleLogout}
            className="border border-red-500 px-3 py-1 text-xs hover:bg-red-500 hover:text-black transition"
          >
            ENCERRAR SESSÃO
          </button>
        </div>

      </div>

      {/* STATUS */}
      {status && (
        <p className="text-green-400 font-mono mb-6">{status}</p>
      )}

      {/* LISTA */}
      <div className="flex flex-col items-left gap-6">

        {characters.map((char) => (
          <div
            key={char.id}
            onClick={() => router.push(`/character/${char.id}`)}
            className="cursor-pointer flex w-full max-w-xl border border-white/20 bg-white/5 hover:border-red-500 hover:scale-[1.01] transition-all duration-200 shadow-[0_0_20px_rgba(255,0,0,0.1)]"
          >

            {/* FOTO */}
            <div className="w-40 h-40 bg-black border-r border-white/10">
              {char.imagem_perfil ? (
                <img
                  src={char.imagem_perfil}
                  alt="personagem"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  SEM IMAGEM
                </div>
              )}
            </div>

            {/* DADOS */}
            <div className="flex-1 p-4 flex flex-col justify-between">

              {/* topo */}
              <div>
                <h2 className="text-lg tracking-wide">{char.name}</h2>

                <p className="text-sm text-gray-400">
                  {char.classe || "Classe desconhecida"}
                </p>

                <p className="text-xs text-gray-500">
                  Origem: {char.origem || "-"}
                </p>
              </div>

              {/* meio */}
              <div className="flex gap-6 text-xs mt-3">

                <div>
                  <p className="text-gray-500">NEX</p>
                  <p className="text-red-400">{char.nex}%</p>
                </div>

                <div>
                  <p className="text-gray-500">VIDA</p>
                  <p>{char.vida_atual}/{char.vida_max}</p>
                </div>

                <div>
                  <p className="text-gray-500">SAN</p>
                  <p>{char.sanidade_atual}/{char.sanidade_max}</p>
                </div>

                <div>
                  <p className="text-gray-500">PE</p>
                  <p>{char.esforco_atual}/{char.esforco_max}</p>
                </div>

              </div>

              {/* rodapé */}
              <div className="text-[10px] text-gray-500 mt-2">
                Clique para acessar ficha completa
              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}