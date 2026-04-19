'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger, createScope } from 'animejs';

// Deterministic seeded PRNG for consistent chart rendering
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ChartNote {
  id: number;
  lane: number;       // 0-3 (4 lanes)
  y: number;          // position on chart (0-100)
  type: 'tap' | 'hold' | 'arc';
  holdLength?: number; // for hold notes
  color: string;
}

function generateChart(): ChartNote[] {
  const rng = createRng(777); // Fixed seed for consistent chart
  const notes: ChartNote[] = [];
  const laneColors = ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399'];
  let id = 0;

  // Generate a pattern that looks like a real Arcaea chart
  // Dense section → break → sparse → dense again
  const sections = [
    { start: 0, end: 15, density: 0.35 },
    { start: 15, end: 25, density: 0.12 },
    { start: 25, end: 50, density: 0.5 },
    { start: 50, end: 60, density: 0.15 },
    { start: 60, end: 85, density: 0.65 },
    { start: 85, end: 100, density: 0.3 },
  ];

  for (const section of sections) {
    for (let y = section.start; y < section.end; y += 1.5) {
      if (rng() < section.density) {
        const lane = Math.floor(rng() * 4);
        const typeRoll = rng();
        const type: ChartNote['type'] = typeRoll < 0.6 ? 'tap' : typeRoll < 0.85 ? 'hold' : 'arc';

        notes.push({
          id: id++,
          lane,
          y,
          type,
          holdLength: type === 'hold' ? 3 + rng() * 6 : undefined,
          color: laneColors[lane] ?? '#ffffff',
        });
      }
      // Sometimes add simultaneous notes (chords)
      if (rng() < section.density * 0.3) {
        const lane = Math.floor(rng() * 4);
        notes.push({
          id: id++,
          lane,
          y,
          type: 'tap',
          color: laneColors[lane] ?? '#ffffff',
        });
      }
    }
  }

  return notes.sort((a, b) => a.y - b.y);
}

const chartNotes = generateChart();

const LANE_COLORS = ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399'];
const LANE_LABELS = ['D', 'F', 'J', 'K'];

export function GoldenHourChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = createScope();
    scopeRef.current = scope;

    scope.add(() => {
      // Animate notes appearing
      animate('.chart-note', {
        opacity: [0, 1],
        scale: [0.5, 1],
        duration: 400,
        delay: stagger(8, { start: 200 }),
        ease: 'outBack(1.5)',
      });

      // Slow auto-scroll
      if (scrollRef.current) {
        animate(scrollRef.current, {
          scrollTop: [0, scrollRef.current.scrollHeight - scrollRef.current.clientHeight],
          duration: 25000,
          ease: 'linear',
          loop: true,
        });
      }
    });

    return () => scope.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div>
          <h3 className="font-display font-bold text-sm text-white">Golden Hour (Xplosn Remix)</h3>
          <p className="font-mono text-[10px] text-white/30 mt-0.5">JVKE, Xplosn · Future 9 · Arcaea Fanmade</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            FUTURE 9
          </span>
          <a
            href="/charts/goldenhourxplosn.arcpkg"
            download
            className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-white/60 hover:text-white border border-white/[0.08] transition-colors"
          >
            .arcpkg
          </a>
        </div>
      </div>

      {/* Chart display */}
      <div
        ref={scrollRef}
        className="relative overflow-hidden"
        style={{ height: '320px' }}
      >
        {/* Lane lines */}
        <div className="absolute inset-0 flex">
          {[0, 1, 2, 3].map((lane) => (
            <div
              key={lane}
              className="flex-1 border-r border-white/[0.03] relative"
            >
              {/* Lane label at bottom */}
              <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] text-white/10"
              >
                {LANE_LABELS[lane]}
              </div>
              {/* Lane highlight bar at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-8 opacity-10"
                style={{ backgroundColor: LANE_COLORS[lane] }}
              />
            </div>
          ))}
        </div>

        {/* Beat lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-white/[0.03]"
              style={{ top: `${(i / 20) * 100}%` }}
            />
          ))}
        </div>

        {/* Notes */}
        <div className="absolute inset-0" style={{ padding: '0 4px' }}>
          {chartNotes.map((note) => (
            <div
              key={note.id}
              className="chart-note absolute"
              style={{
                left: `${note.lane * 25}%`,
                width: '25%',
                top: `${note.y}%`,
                opacity: 0,
              }}
            >
              {/* Note marker */}
              {note.type === 'tap' && (
                <div
                  className="mx-1 h-[6px] rounded-sm"
                  style={{
                    backgroundColor: note.color,
                    boxShadow: `0 0 6px ${note.color}40`,
                  }}
                />
              )}
              {note.type === 'hold' && (
                <div
                  className="mx-1.5 rounded-sm"
                  style={{
                    height: `${(note.holdLength ?? 4) * 2}px`,
                    backgroundColor: `${note.color}30`,
                    borderLeft: `3px solid ${note.color}`,
                    borderRight: `3px solid ${note.color}`,
                  }}
                />
              )}
              {note.type === 'arc' && (
                <div
                  className="mx-2 h-[3px] rounded-full"
                  style={{
                    backgroundColor: note.color,
                    boxShadow: `0 0 10px ${note.color}60, 0 0 3px ${note.color}`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[6px] rounded-sm bg-[#ff6b9d]" />
          <span className="font-mono text-[9px] text-white/30">Tap</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#c084fc]/30 border-l-2 border-r-2 border-[#c084fc]" />
          <span className="font-mono text-[9px] text-white/30">Hold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[3px] rounded-full bg-[#60a5fa] shadow-[0_0_4px_#60a5fa]" />
          <span className="font-mono text-[9px] text-white/30">Arc</span>
        </div>
        <div className="ml-auto font-mono text-[9px] text-white/15">
          Auto-scrolling preview
        </div>
      </div>
    </div>
  );
}
