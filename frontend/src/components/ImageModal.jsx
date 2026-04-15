"use client";

import React, { useState, useEffect } from "react";

export default function ImageModal({ open, title = "Editar imagem", initialUrl = "", onClose, onSave }) {
  const [url, setUrl] = useState(initialUrl || "");

  useEffect(() => {
    setUrl(initialUrl || "");
  }, [initialUrl, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-[#071017] border border-white/6 rounded-lg p-6 z-10">
        <h3 className="text-lg font-bold mb-3">{title}</h3>

        <label className="text-sm text-gray-300 block mb-2">URL da imagem</label>
        <input
          className="w-full p-2 rounded bg-transparent border border-white/6 text-white outline-none"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1 rounded border border-white/10">Cancelar</button>
          <button
            onClick={() => onSave(url)}
            className="px-3 py-1 rounded bg-green-500 text-black font-semibold hover:brightness-90"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
