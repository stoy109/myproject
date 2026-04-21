"use client";

import { useEffect, useState } from "react";

/**
 * Shows a fullscreen "Rotate your device" overlay when a mobile or tablet
 * (viewport width ≤ 1024 px) is in portrait orientation.
 * Completely invisible on desktop.
 */
export default function OrientationGuard() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const check = () => {
      const isMobileOrTablet = window.innerWidth <= 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowOverlay(isMobileOrTablet && isPortrait);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "oklch(0.07 0 0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        fontFamily: "var(--font-display), sans-serif",
      }}
      aria-live="assertive"
      aria-label="Please rotate your device"
    >
      {/* Animated phone-rotate icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: "rotate-hint 2s ease-in-out infinite" }}
        aria-hidden="true"
      >
        {/* Phone body — portrait orientation */}
        <rect x="8.5" y="3" width="7" height="12" rx="1.5" />
        {/* Camera dot */}
        <circle cx="12" cy="4.2" r="0.4" fill="rgba(255,255,255,0.85)" stroke="none" />
        {/* Home bar */}
        <line x1="10.8" y1="14" x2="13.2" y2="14" strokeWidth="1.2" />

        {/* Circular rotation arc — CW bottom-left sweep */}
        <path
          d="M5.5 16 A8 8 0 0 0 18.5 16"
          fill="none"
          strokeWidth="1.4"
        />
        {/* Arrowhead at end of arc (right side, pointing right-down) */}
        <polyline points="16.8,14.2 18.5,16 16.5,17.2" fill="none" strokeWidth="1.4" transform="translate(1.5, -1) rotate(-70 17.5 15.7)" />
      </svg>

      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.9)" }}>
        <p
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Rotate Your Device
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.45)",
            marginTop: "0.5rem",
            letterSpacing: "0.02em",
          }}
        >
          This app is best experienced in landscape mode.
        </p>
      </div>

      <style>{`
        @keyframes rotate-hint {
          0%   { transform: rotate(0deg);   opacity: 1; }
          40%  { transform: rotate(-90deg); opacity: 1; }
          55%  { transform: rotate(-90deg); opacity: 0.6; }
          70%  { transform: rotate(0deg);   opacity: 1; }
          100% { transform: rotate(0deg);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
