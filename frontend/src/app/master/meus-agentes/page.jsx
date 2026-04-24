"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterCard from "../../../components/CharacterCard";

export default function MeusAgentes() {
  const [characters, setCharacters] = useState([]);
  const [status, setStatus] = useState("");
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const decodeTokenName = () => {
    const token = localStorage.getItem("token");
    if (!token) return "";

    try {
      const parts = token.split('.');
      if (parts.length < 2) return "";
      const payload = JSON.parse(atob(parts[1]));
      return payload.name || payload.email || "Usuário";
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    // fetch current user and then fetch characters created by that user
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push('/');

      try {
        const res = await fetch("http://localhost:3001/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name || data.email || decodeTokenName());
        } else setUserName(decodeTokenName());
      } catch (e) {
        setUserName(decodeTokenName());
      }

      // fetch characters: backend's /characters returns ALL characters for master/admin
      setStatus("> carregando fichas...");
      try {
        const res2 = await fetch("http://localhost:3001/characters", { headers: { Authorization: `Bearer ${token}` } });
        const data2 = await res2.json();
        if (!res2.ok) {
          setStatus("> erro ao carregar personagens");
          return;
        }
        // filter characters to only those created by this master/admin
        let myId = null;
        try{ const parts = token.split('.'); myId = JSON.parse(atob(parts[1])).id; }catch(e){}
        const filtered = (data2 || []).filter(c => String(c.user_id) === String(myId));
        setCharacters(filtered);
        setStatus("");
      } catch (err) {
        setStatus("> erro de conexão");
      }
    })();
  }, []);

  return (
    <div className="p-6 min-h-0 depth-glow">
      <main>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg">Meus Agentes</h2>
          <div>
            <button
              onClick={() => router.push('/character/new')}
              className="border border-green-500 text-green-500 text-sm px-3 py-1 rounded flex items-center gap-2 hover:bg-green-500/10 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova ficha</span>
            </button>
          </div>
        </div>

        {status && <p className="text-green-400 font-mono mb-4">{status}</p>}

        {characters.length === 0 ? (
          <div className="p-6 border border-white/10 rounded bg-white/3 text-center">
            <p className="mb-2">Nenhum agente encontrado.</p>
            <button
              onClick={() => router.push('/character/new')}
              className="mt-2 border border-green-500 text-green-500 px-3 py-1 text-sm rounded hover:bg-green-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Criar primeira ficha
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((char) => (
              <CharacterCard key={char.id} character={char} currentUserName={userName} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
