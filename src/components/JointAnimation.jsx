import React from "react";
import { FONT } from "../theme/tokens";

/** Схематичная анимация сустава: проксимальный сегмент неподвижен, дистальный — двигается. */
export function JointAnimation({ animate = true, caption, width = 240 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width={width} height={(width * 116) / 240} viewBox="0 0 240 116" role="img" aria-label="Схема движения в суставе">
        <line x1="20" y1="100" x2="220" y2="100" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
        <path d="M 156 68 A 36 36 0 0 0 148 45" fill="none" stroke="rgba(224,121,90,0.7)" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="120" cy="68" r="36" fill="none" stroke="rgba(255,255,255,0.14)" strokeDasharray="3 3" />
        <line x1="62" y1="68" x2="120" y2="68" stroke="#E1EFEA" strokeWidth="11" strokeLinecap="round" />
        <g className={animate ? "exercise-anim-limb" : ""}>
          <line x1="120" y1="68" x2="182" y2="92" stroke="#8FD0BE" strokeWidth="10" strokeLinecap="round" />
          <circle cx="184" cy="93" r="6" fill="#E1EFEA" />
        </g>
        <circle cx="120" cy="68" r="9" fill="#E0795A" stroke="#fff" strokeWidth="2.5" />
        {caption && (
          <text x="120" y="20" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11" fontFamily={FONT}>
            {caption}
          </text>
        )}
      </svg>
    </div>
  );
}
