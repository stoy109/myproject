'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { animate, stagger, createScope } from 'animejs';

// Deterministic seeded PRNG (mulberry32) — avoids hydration mismatch
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOT_COUNT = 45;
const DOT_SEED = 42;

interface DotData {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  scatterX: number;
  scatterY: number;
}

function generateDots(): DotData[] {
  const rng = createRng(DOT_SEED);
  return Array.from({ length: DOT_COUNT }, (_, i) => {
    const x = 6 + rng() * 88;
    const y = 6 + rng() * 88;
    const size = 3 + rng() * 5;
    const baseOpacity = 0.25 + rng() * 0.75;
    const dx = (x - 50) / 50;
    const dy = (y - 50) / 50;
    const angle = Math.atan2(dy, dx) + (rng() - 0.5) * 0.8;
    const dist = 160 + rng() * 220;
    return {
      id: i,
      x,
      y,
      size,
      baseOpacity,
      scatterX: Math.cos(angle) * dist,
      scatterY: Math.sin(angle) * dist,
    };
  });
}

const dots = generateDots();

type CardState = 'idle' | 'hovered' | 'zooming';

export function MainPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [cardState, setCardState] = useState<CardState>('idle');
  const cardRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLHeadingElement>(null);
  const cardTextRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);
  const idleAnimsRef = useRef<ReturnType<typeof animate>[]>([]);
  const stateRef = useRef<CardState>('idle');

  useEffect(() => { stateRef.current = cardState; }, [cardState]);

  const startIdle = useCallback(() => {
    idleAnimsRef.current.forEach((a) => a.pause());
    idleAnimsRef.current = [];

    if (!dotsRef.current) return;
    const dotEls = dotsRef.current.querySelectorAll<HTMLElement>('.dot-orb');

    dotEls.forEach((el, i) => {
      const dot = dots[i];
      if (!dot) return;
      const anim = animate(el, {
        translateX: [0, ((i % 7) - 3) * 2 + 'px', 0],
        translateY: [0, ((i % 5) - 2) * 2 + 'px', 0],
        opacity: [dot.baseOpacity, dot.baseOpacity > 0.5 ? dot.baseOpacity * 0.4 : dot.baseOpacity * 1.5, dot.baseOpacity],
        duration: 3000 + (i % 5) * 800,
        ease: 'inOutSine',
        loop: true,
        alternate: true,
        delay: (i % 8) * 200,
      });
      idleAnimsRef.current.push(anim);
    });
  }, []);

  // Entrance animation
  useEffect(() => {
    const scope = createScope();
    scopeRef.current = scope;

    scope.add(() => {
      animate('#mainPageWrapper', {
        opacity: [0, 1],
        duration: 800,
        ease: 'outCubic',
      });

      animate('#welcomeText', {
        opacity: [0, 1],
        translateY: ['22px', '0px'],
        duration: 900,
        ease: 'outCubic',
      });

      animate('.dot-orb', {
        opacity: (_el: Element, i: number) => [0, dots[i]?.baseOpacity ?? 0.5],
        scale: [0, 1],
        duration: 400,
        delay: stagger(20),
        ease: 'outBack(1.7)',
        onComplete: () => {
          startIdle();
        },
      });
    });

    return () => {
      scope.revert();
      idleAnimsRef.current.forEach((a) => a.pause());
    };
  }, [startIdle]);

  const handleHoverStart = useCallback(() => {
    if (stateRef.current !== 'idle') return;
    setCardState('hovered');

    idleAnimsRef.current.forEach((a) => a.pause());
    idleAnimsRef.current = [];

    if (!dotsRef.current) return;
    const dotEls = dotsRef.current.querySelectorAll<HTMLElement>('.dot-orb');

    animate(dotEls, {
      translateX: (_el: Element, i: number) => dots[i]?.scatterX + 'px' ?? '0px',
      translateY: (_el: Element, i: number) => dots[i]?.scatterY + 'px' ?? '0px',
      opacity: 0,
      scale: 0.5,
      duration: 700,
      ease: 'outExpo',
      delay: stagger(15, { from: 'center' }),
    });

    if (welcomeRef.current) {
      animate(welcomeRef.current, {
        opacity: [1, 0],
        translateY: [0, -20],
        scale: [1, 0.85],
        duration: 500,
        ease: 'inCubic',
      });
    }

    if (cardTextRef.current) {
      animate(cardTextRef.current, {
        opacity: [0, 1],
        translateY: ['18px', '0px'],
        duration: 500,
        delay: 300,
        ease: 'outCubic',
      });
    }
  }, []);

  const handleHoverEnd = useCallback(() => {
    if (stateRef.current !== 'hovered') return;
    setCardState('idle');

    if (!dotsRef.current) return;
    const dotEls = dotsRef.current.querySelectorAll<HTMLElement>('.dot-orb');

    animate(dotEls, {
      translateX: '0px',
      translateY: '0px',
      opacity: (_el: Element, i: number) => dots[i]?.baseOpacity ?? 0.5,
      scale: 1,
      duration: 900,
      ease: 'outBack(1.5)',
      delay: stagger(10),
      onComplete: startIdle,
    });

    if (cardTextRef.current) {
      animate(cardTextRef.current, {
        opacity: [1, 0],
        translateY: ['0px', '-12px'],
        duration: 250,
        ease: 'inCubic',
      });
    }

    if (welcomeRef.current) {
      animate(welcomeRef.current, {
        opacity: [0, 1],
        translateY: [-20, 0],
        scale: [0.85, 1],
        duration: 550,
        delay: 150,
        ease: 'outCubic',
      });
    }
  }, [startIdle]);

  const handleCardClick = useCallback(() => {
    if (stateRef.current !== 'hovered') return;
    setCardState('zooming');

    idleAnimsRef.current.forEach((a) => a.pause());
    idleAnimsRef.current = [];

    if (!dotsRef.current) return;
    const dotEls = dotsRef.current.querySelectorAll<HTMLElement>('.dot-orb');

    animate(dotEls, {
      translateX: '0px',
      translateY: '0px',
      opacity: (_el: Element, i: number) => dots[i]?.baseOpacity ?? 0.5,
      scale: 1,
      duration: 800,
      delay: stagger(15, { start: 200 }),
      ease: 'inOutCubic',
    });

    if (welcomeRef.current) {
      animate(welcomeRef.current, { opacity: 0, duration: 300, ease: 'inCubic' });
    }
    if (cardTextRef.current) {
      animate(cardTextRef.current, { opacity: 0, duration: 300, ease: 'inCubic' });
    }
    if (hintRef.current) {
      animate(hintRef.current, { opacity: 0, duration: 300, ease: 'inCubic' });
    }

    if (cardRef.current) {
      animate(cardRef.current, {
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        backgroundColor: '#000000',
        duration: 900,
        ease: 'inOutCubic',
        onComplete: () => onNavigate('project'),
      });
    }
  }, [onNavigate]);

  return (
    <div
      id="mainPageWrapper"
      className="flex flex-col items-center justify-center h-screen relative z-[1]"
      style={{ opacity: 0 }}
    >
      <h1
        ref={welcomeRef}
        id="welcomeText"
        className="font-display font-extrabold text-white tracking-[0.16em] uppercase mb-8 select-none"
        style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', opacity: 0 }}
      >
        Welcome
      </h1>

      <div
        ref={cardRef}
        className="relative cursor-pointer z-[2] rounded-lg overflow-hidden backdrop-blur-xl border border-white/[0.08]"
        style={{
          width: 'clamp(300px, 50vw, 560px)',
          height: 'clamp(190px, 30vh, 340px)',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
        onPointerEnter={handleHoverStart}
        onPointerLeave={handleHoverEnd}
        onClick={handleCardClick}
      >
        <div ref={dotsRef} className="absolute inset-0">
          {dots.map((dot) => (
            <div
              key={dot.id}
              className="dot-orb absolute rounded-full pointer-events-none"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                backgroundColor: 'rgba(255,255,255,0.9)',
                boxShadow: dot.baseOpacity > 0.5 ? `0 0 ${dot.size * 2}px rgba(255,255,255,0.25)` : 'none',
                opacity: 0,
                transform: 'scale(0)',
              }}
            />
          ))}
        </div>

        <div
          ref={cardTextRef}
          className="absolute inset-0 flex items-center justify-center z-[3] pointer-events-none"
          style={{ opacity: 0 }}
        >
          <span className="font-mono font-bold text-white/90 text-[clamp(16px,2.5vw,28px)] tracking-wider">
            Let&apos;s see.
          </span>
        </div>
      </div>

      <p
        ref={hintRef}
        className="fixed bottom-9 font-mono text-[11px] text-white/20 tracking-[0.2em] uppercase z-[1] pointer-events-none select-none"
      >
        hover the card
      </p>
    </div>
  );
}
