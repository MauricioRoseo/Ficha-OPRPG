"use client";

import React from "react";

export default function FichaPaper({ children }) {
  return (
    <div className="ficha-paper">
      <div className="ficha-inner">
        <div className="ficha-sidebar" aria-hidden="true" />
        <div className="ficha-sheet">{children}</div>
      </div>
    </div>
  );
}
