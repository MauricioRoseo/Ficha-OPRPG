"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

async function fetchLayout(slug){
  const res = await fetch(`http://localhost:3001/layouts/public/${slug}`);
  if (!res.ok) throw new Error('Não encontrado');
  return res.json();
}

export default function LayoutPublicClient(){
  const params = useParams();
  const slug = params?.slug || '';
  const [data, setData] = useState(null);
  const lastFetchedRef = useRef(null);

  useEffect(()=>{
    let mounted = true;
    let intervalId = null;

    const fetchAndUpdate = async () => {
      try {
        const d = await fetchLayout(slug);
        if (!mounted) return;

        const payload = JSON.stringify(d);
        if (lastFetchedRef.current !== payload) {
          lastFetchedRef.current = payload;
          setData(d);
        }
      } catch (err) {
        if (!mounted) return;
        // keep existing data if present, otherwise mark error
        if (!lastFetchedRef.current) setData({ error: true });
      }
    };

    // initial fetch
    fetchAndUpdate();

    // poll every 5 seconds
    intervalId = setInterval(fetchAndUpdate, 5000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      lastFetchedRef.current = null;
    };
  }, [slug]);

  if (!data) return <div className="w-full h-screen flex items-center justify-center">Carregando...</div>;
  if (data.error) return <div className="w-full h-screen flex items-center justify-center">Layout não encontrado</div>;

  const layout = data.layout;
  const chars = data.characters || [];

  // We want two rows; compute number of columns = ceil(N/2)
  const cols = Math.max(1, Math.ceil(chars.length / 2));

  // split into two rows so we can center incomplete rows easily
  const firstRow = chars.slice(0, cols);
  const secondRow = chars.slice(cols);

  const rowStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    alignItems: 'stretch',
    width: '100%'
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
    <div className="p-4 w-full max-w-[1100px]">
      <h2 className="text-xl mb-3 text-center">{layout.title}</h2>
        <div>
          <div style={rowStyle}>
            {firstRow.map(c => {
            const vidaPct = Math.max(0, Math.min(100, ((c.vida_atual||0) / Math.max(1, (c.vida_max||1))) * 100));
            const sanPct = Math.max(0, Math.min(100, ((c.sanidade_atual||0) / Math.max(1, (c.sanidade_max||1))) * 100));
            return (
              <div key={c.id} className="rounded-lg p-2 bg-[#021018] overflow-hidden" style={{ boxShadow: '0 8px 20px rgba(255,255,255,0.03)', aspectRatio: '3/4', maxWidth: 260, maxHeight: 360, width: '100%', flex: '0 0 260px' }}>
                  <div className="font-semibold text-base mb-1 text-center truncate">{c.name}</div>

                  <div className="mb-1 rounded overflow-hidden bg-black/20 h-[46%] flex items-center justify-center">
                  {c.imagem_token ? <img src={c.imagem_token} alt={c.name} className="object-cover w-full h-full" /> : <div className="text-sm text-gray-400">Sem imagem</div>}
                </div>
                  <div className="mt-2 flex items-center gap-3">
                  {/* Effort circle on the left */}
                    <div style={{ minWidth: 40 }} className="flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: '#010e12', border: '2px solid rgba(250,204,21,0.95)', boxShadow: '0 0 8px rgba(250,204,21,0.12)' }}>
                      {c.esforco_atual || 0}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2">
                        <div className="text-xs text-gray-400 mb-1 text-center">Vida</div>
                        <div className="relative w-full bg-white/6 h-5 rounded overflow-hidden">
                          <div style={{ width: `${vidaPct}%` }} className="absolute left-0 top-0 bottom-0 bg-red-500 h-full flex items-center justify-center">
                            <span className="text-xs text-white">{(c.vida_atual||0)}/{(c.vida_max||0)}</span>
                          </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-gray-400 mb-1 text-center">Sanidade</div>
                        <div className="relative w-full bg-white/6 h-5 rounded overflow-hidden">
                          <div style={{ width: `${sanPct}%` }} className="absolute left-0 top-0 bottom-0 bg-blue-500 h-full flex items-center justify-center">
                            <span className="text-xs text-white">{(c.sanidade_atual||0)}/{(c.sanidade_max||0)}</span>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {secondRow.length > 0 && (
            <div style={{ ...rowStyle, marginTop: 12 }}>
              {secondRow.map(c => {
                const vidaPct = Math.max(0, Math.min(100, ((c.vida_atual||0) / Math.max(1, (c.vida_max||1))) * 100));
                const sanPct = Math.max(0, Math.min(100, ((c.sanidade_atual||0) / Math.max(1, (c.sanidade_max||1))) * 100));
                return (
                  <div key={c.id} className="rounded-lg p-2 bg-[#021018] overflow-hidden" style={{ boxShadow: '0 8px 20px rgba(255,255,255,0.03)', aspectRatio: '3/4', maxWidth: 260, maxHeight: 360, width: '100%', flex: '0 0 260px' }}>
                    <div className="font-semibold text-base mb-1 text-center truncate">{c.name}</div>

                    <div className="mb-1 rounded overflow-hidden bg-black/20 h-[46%] flex items-center justify-center">
                      {c.imagem_token ? <img src={c.imagem_token} alt={c.name} className="object-cover w-full h-full" /> : <div className="text-sm text-gray-400">Sem imagem</div>}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div style={{ minWidth: 40 }} className="flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white" style={{ background: '#010e12', border: '2px solid rgba(250,204,21,0.95)', boxShadow: '0 0 8px rgba(250,204,21,0.12)' }}>
                          {c.esforco_atual || 0}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="mb-2">
                          <div className="text-xs text-gray-400 mb-1 text-center">Vida</div>
                          <div className="relative w-full bg-white/6 h-5 rounded overflow-hidden">
                            <div style={{ width: `${vidaPct}%` }} className="absolute left-0 top-0 bottom-0 bg-red-500 h-full flex items-center justify-center">
                              <span className="text-xs text-white">{(c.vida_atual||0)}/{(c.vida_max||0)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1 text-center">Sanidade</div>
                          <div className="relative w-full bg-white/6 h-5 rounded overflow-hidden">
                            <div style={{ width: `${sanPct}%` }} className="absolute left-0 top-0 bottom-0 bg-blue-500 h-full flex items-center justify-center">
                              <span className="text-xs text-white">{(c.sanidade_atual||0)}/{(c.sanidade_max||0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
