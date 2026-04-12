"use client";

import React from "react";

export default function CharacterAttributes({ character, attributes }) {
  const attrs = attributes || character || {};

  return (
    <div>
      <div className="mb-3 stat-label">Atributos</div>

      <div className="atributos-card relative rounded p-4">
        {/* Background image placed via CSS; user can drop image into src/assets/images/attributes */}
        <div className="atributos-overlay p-4 relative">
          {/* Absolute positioned small boxes placed to align with the overlay image.
              Tweak positions in globals.css (.atributo-pos-*) if needed. */}
          <div className="atributo-pos atributo-pos-agi">
            <div className="atributo-value small">{attrs.agilidade ?? attrs.AGI ?? '-'}</div>
          </div>

          <div className="atributo-pos atributo-pos-for">
            <div className="atributo-value small">{attrs.forca ?? attrs.FOR ?? '-'}</div>
          </div>

          <div className="atributo-pos atributo-pos-int">
            <div className="atributo-value small">{attrs.inteleto ?? attrs.INT ?? attrs.intelecto ?? '-'}</div>
          </div>

          <div className="atributo-pos atributo-pos-pre">
            <div className="atributo-value small">{attrs.presenca ?? attrs.PRE ?? '-'}</div>
          </div>

          <div className="atributo-pos atributo-pos-vig">
            <div className="atributo-value small">{attrs.vigor ?? attrs.VIG ?? '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
