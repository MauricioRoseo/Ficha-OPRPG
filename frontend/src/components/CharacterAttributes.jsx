"use client";

import React, { useEffect, useRef, useState } from "react";
import overlayImg from "../assets/images/attributes/overlay.png";

export default function CharacterAttributes({ character, attributes, editable = false, onChangeAttribute }) {
  const attrs = attributes || character || {};
  const cardRef = useRef(null);
  const [showImg, setShowImg] = useState(true);

  useEffect(() => {
    if (!cardRef.current) return;
    try {
      const el = cardRef.current;
      const style = window.getComputedStyle(el);
      const bg = style.getPropertyValue("background-image") || style.backgroundImage;
      const beforeBg = window.getComputedStyle(el, "::before").getPropertyValue("background-image");
      const afterBg = window.getComputedStyle(el, "::after").getPropertyValue("background-image");

      const hasBg = (val) => {
        if (!val) return false;
        const v = val.trim();
        if (v === "none" || v === "initial" || v === "unset") return false;
        if (v === "" ) return false;
        // any url(...) or data: or blob: indicates an image
        return /url\(|data:|blob:/.test(v);
      };

      if (hasBg(bg) || hasBg(beforeBg) || hasBg(afterBg)) {
        setShowImg(false);
      }
    } catch (e) {
      // ignore - keep image as fallback
    }
  }, []);

  return (
    <div>
      <div className="mb-3 stat-label">Atributos</div>

      <div className="atributos-card rounded" ref={cardRef}>
        {/* Render the overlay image directly unless the CSS already sets it (avoids duplicate) */}
        <div className="atributos-inner" style={{ position: "relative" }}>
          {showImg && (
            <img src={overlayImg?.src || overlayImg} alt="atributos" className="atributos-bg w-full h-auto block rounded" />
          )}

          {/* semi-transparent overlay to improve contrast for numbers */}
          <div className="atributos-overlay" aria-hidden="true"></div>

          {/* Absolute positioned small boxes placed to align with the overlay image.
              Tweak positions in globals.css (.atributo-pos-*) if needed. */}
          <div className="atributo-pos atributo-pos-agi">
            {editable ? (
              <input
                type="number"
                className="atributo-value small"
                value={attrs.agilidade ?? attrs.AGI ?? ''}
                onChange={e => onChangeAttribute && onChangeAttribute('agilidade', e.target.value)}
              />
            ) : (
              <div className="atributo-value small">{attrs.agilidade ?? attrs.AGI ?? "-"}</div>
            )}
          </div>

          <div className="atributo-pos atributo-pos-for">
            {editable ? (
              <input
                type="number"
                className="atributo-value small"
                value={attrs.forca ?? attrs.FOR ?? ''}
                onChange={e => onChangeAttribute && onChangeAttribute('forca', e.target.value)}
              />
            ) : (
              <div className="atributo-value small">{attrs.forca ?? attrs.FOR ?? "-"}</div>
            )}
          </div>

          <div className="atributo-pos atributo-pos-int">
            {editable ? (
              <input
                type="number"
                className="atributo-value small"
                value={attrs.intelecto ?? attrs.INT ?? attrs.inteleto ?? ''}
                onChange={e => onChangeAttribute && onChangeAttribute('intelecto', e.target.value)}
              />
            ) : (
              <div className="atributo-value small">{attrs.inteleto ?? attrs.INT ?? attrs.intelecto ?? "-"}</div>
            )}
          </div>

          <div className="atributo-pos atributo-pos-pre">
            {editable ? (
              <input
                type="number"
                className="atributo-value small"
                value={attrs.presenca ?? attrs.PRE ?? ''}
                onChange={e => onChangeAttribute && onChangeAttribute('presenca', e.target.value)}
              />
            ) : (
              <div className="atributo-value small">{attrs.presenca ?? attrs.PRE ?? "-"}</div>
            )}
          </div>

          <div className="atributo-pos atributo-pos-vig">
            {editable ? (
              <input
                type="number"
                className="atributo-value small"
                value={attrs.vigor ?? attrs.VIG ?? ''}
                onChange={e => onChangeAttribute && onChangeAttribute('vigor', e.target.value)}
              />
            ) : (
              <div className="atributo-value small">{attrs.vigor ?? attrs.VIG ?? "-"}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
