"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PDJPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchChars = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/characters', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          setError('Erro ao carregar personagens');
          setLoading(false);
          return;
        }
        const list = await res.json();
        setCharacters(list || []);
      } catch (e) {
        setError('Erro na requisição');
      } finally {
        setLoading(false);
      }
    };

    fetchChars();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Confirmar exclusão do personagem?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/characters/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        alert('Erro ao excluir personagem');
        return;
      }
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Erro ao excluir personagem');
    }
  };

  if (loading) return <div className="p-6">Carregando personagens...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">PDJ — Personagens de Jogador</h2>
      {characters.length === 0 ? (
        <div>Nenhum personagem encontrado.</div>
      ) : (
        <div className="space-y-3">
          {characters.map(ch => (
            <div key={ch.id} className="p-3 border border-white/10 rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{ch.name}</div>
                <div className="text-xs text-gray-400">Jogador: {ch.user_id}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/character/${ch.id}`} className="px-2 py-1 border rounded text-sm">Visualizar</Link>
                <Link href={`/character/${ch.id}/edit`} className="px-2 py-1 border rounded text-sm">Editar</Link>
                <button onClick={()=>handleDelete(ch.id)} className="px-2 py-1 border rounded text-sm text-red-300">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
