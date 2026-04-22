"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getPatente(prestigio = 0) {
  if (prestigio >= 200) return 'Agente de Elite';
  if (prestigio >= 100) return 'Oficial de Operações';
  if (prestigio >= 50) return 'Agente Especial';
  if (prestigio >= 20) return 'Operador';
  return 'Recruta';
}

export default function CharacterCard({ character, onClick, compact = false, currentUserName = '' }) {
  const router = useRouter();
  const click = onClick || (() => router.push(`/character/${character.id}`));
  const [local, setLocal] = useState(character || {});

  useEffect(() => setLocal(character || {}), [character]);

  useEffect(() => {
    const handler = (e) => {
      try {
        const updated = e.detail;
        if (updated && updated.id === (character && character.id)) setLocal(updated);
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('character:updated', handler);
    return () => window.removeEventListener('character:updated', handler);
  }, [character]);

  const c = local;

  return (
    <div onClick={click} className={`card cursor-pointer border border-white/8 rounded-lg overflow-hidden bg-white/3 transition duration-150 ${compact ? 'p-2' : ''}`}>

      <div className="flex items-center">
        <div className="w-36 h-36 flex-shrink-0 border-r border-white/10 bg-[#021018] flex items-center justify-center">
          {c.imagem_perfil ? (
            <img src={c.imagem_perfil} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-xs text-gray-500">SEM IMAGEM</div>
          )}
        </div>

        <div className="flex-1 p-4">
          <h3 className="text-lg font-bold">{c.name}</h3>
          <p className="text-xs text-gray-400">Origem: {c.origem || '-'}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400 text-xs">NEX</p>
              <p className="text-red-400">{character.nex}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Nível</p>
              <p>{character.nivel || 0}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Prestígio</p>
              <p>{c.prestigio || 0}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Patente</p>
              <p>{c.patente || getPatente(c.prestigio)}</p>
            </div>
          </div>

          <div className="mt-3 text-sm grid grid-cols-2 gap-2 text-gray-300">
            <div>
              <p className="text-gray-400 text-xs">Classe</p>
              <p>{character.classe || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Trilha</p>
              <p>{character.trilha || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Idade</p>
              <p>{character.idade || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Jogador</p>
              <p>{c.user_name || currentUserName || c.user_email || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400 text-xs">Afinidade</p>
              <p>{character.afinidade || '-'}</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
