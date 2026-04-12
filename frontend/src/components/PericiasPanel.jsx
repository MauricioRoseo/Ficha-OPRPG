"use client";

import React from "react";

export default function PericiasPanel({ character, attributes }) {
  const data = attributes || character || {};

  return (
    <div>
      <div className="mb-3 stat-label">Perícias</div>

      <div className="panel panel-pericias p-4 rounded">
        <div className="text-sm text-gray-400 mb-2">Lista de perícias (espaço reservado)</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-box">Acrobacia<br/><strong>{data.pericia_acrobacia ?? '-'}</strong></div>
          <div className="stat-box">Atletismo<br/><strong>{data.pericia_atletismo ?? '-'}</strong></div>
          <div className="stat-box">Enganação<br/><strong>{data.pericia_engancao ?? '-'}</strong></div>
          <div className="stat-box">Investigação<br/><strong>{data.pericia_investigacao ?? '-'}</strong></div>
        </div>
      </div>
    </div>
  );
}
