"use client";

import React from "react";
import overlayImg from "../assets/images/attributes/overlay.png";

export default function CharacterAttributes({ character, attributes }) {
  const attrs = attributes || character || {};

  return (
    <div>
      <div className="mb-3 stat-label">Atributos</div>

      <div className="atributos-card rounded">
        {/* Render the overlay image directly so it loads consistently across machines */}
        <div className="atributos-inner" style={{ position: 'relative' }}>
          <img src={overlayImg?.src || overlayImg} alt="atributos" className="atributos-bg w-full h-auto block rounded" />

          {/* semi-transparent overlay to improve contrast for numbers */}
          <div className="atributos-overlay" aria-hidden="true"></div>

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
