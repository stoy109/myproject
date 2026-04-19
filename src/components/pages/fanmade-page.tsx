'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { animate, stagger, createScope } from 'animejs';
import { ArrowLeft, Download, ExternalLink, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { chartLevels, GAME_FILTERS, type ChartLevel, type GameFilter } from '@/lib/data';

export function FanmadePage({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<GameFilter>('ALL');
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [displayLevels, setDisplayLevels] = useState<ChartLevel[]>(chartLevels);
  const listRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const isTransitioning = useRef(false);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);
  const embedRef = useRef<HTMLDivElement>(null);

  const updateCarousel = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const cards = list.querySelectorAll<HTMLDivElement>('[data-song-card]');
    const panelRect = list.getBoundingClientRect();
    const centerY = panelRect.top + panelRect.height * 0.38;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const distance = cardCenterY - centerY;
      const absDist = Math.min(Math.abs(distance / (panelRect.height / 2)), 1);
      card.style.transform = `translateX(${absDist * 120}px) translateY(${-distance * 0.08}px) scale(${1 - absDist * 0.08})`;
      if (!isTransitioning.current) {
        card.style.opacity = String(Math.max(0.12, 1 - absDist * 0.85));
      }
    });
  }, []);

  // Entrance
  useEffect(() => {
    const scope = createScope();
    scopeRef.current = scope;

    scope.add(() => {
      animate('#fanmadePage', {
        opacity: [0, 1],
        duration: 800,
        ease: 'outCubic',
      });
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateCarousel();
      });
    });

    const handleResize = () => updateCarousel();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      scope.revert();
    };
  }, [updateCarousel]);

  // Update carousel when displayed levels change
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = 0;
        updateCarousel();
      });
    });
  }, [displayLevels, updateCarousel]);

  // Animate YouTube embed on active level change
  useEffect(() => {
    if (embedRef.current && activeTitle) {
      animate(embedRef.current, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 500,
        ease: 'outCubic',
      });
    }
  }, [activeTitle]);

  const changeFilter = useCallback(
    (g: GameFilter) => {
      if (g === filter || isTransitioning.current) return;
      isTransitioning.current = true;

      const list = listRef.current;
      if (list) {
        const cards = list.querySelectorAll('[data-song-card]');
        animate(cards, {
          opacity: 0,
          duration: 200,
          ease: 'inCubic',
          onComplete: () => {
            setFilter(g);
            const filtered = g === 'ALL' ? chartLevels : chartLevels.filter((l) => l.game === g);
            setDisplayLevels(filtered);
            setActiveTitle(null);
            setTimeout(() => {
              isTransitioning.current = false;
            }, 500);
          },
        });
      } else {
        setFilter(g);
        const filtered = g === 'ALL' ? chartLevels : chartLevels.filter((l) => l.game === g);
        setDisplayLevels(filtered);
        setActiveTitle(null);
        isTransitioning.current = false;
      }
    },
    [filter, updateCarousel]
  );

  // Drag-to-scroll
  const startDrag = useCallback((y: number) => {
    isDragging.current = true;
    hasMoved.current = false;
    startY.current = y;
    scrollTop.current = listRef.current?.scrollTop ?? 0;
    listRef.current?.classList.add('dragging');
  }, []);

  const moveDrag = useCallback((y: number) => {
    if (!isDragging.current || !listRef.current) return;
    const walk = (y - startY.current) * 1.5;
    if (Math.abs(walk) > 5) hasMoved.current = true;
    listRef.current.scrollTop = scrollTop.current - walk;
  }, []);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    listRef.current?.classList.remove('dragging');
  }, []);

  const selectCard = useCallback((level: ChartLevel) => {
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    setActiveTitle(level.title);
    const card = listRef.current?.querySelector(`[data-title="${level.title}"]`);
    if (card && listRef.current) {
      const panelRect = listRef.current.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const offset = cardRect.top + cardRect.height / 2 - (panelRect.top + panelRect.height * 0.38);
      listRef.current.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const list = listRef.current;
        if (!list) return;
        const cards = Array.from(list.querySelectorAll<HTMLDivElement>('[data-song-card]'));
        if (cards.length === 0) return;

        let activeIndex = cards.findIndex((c) => c.dataset.active === 'true');
        if (activeIndex === -1) {
          const panelRect = list.getBoundingClientRect();
          const centerY = panelRect.top + panelRect.height * 0.38;
          let minDist = Infinity;
          let closest = 0;
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const d = Math.abs(r.top + r.height / 2 - centerY);
            if (d < minDist) { minDist = d; closest = i; }
          });
          activeIndex = closest;
        } else {
          activeIndex = e.key === 'ArrowRight' ? Math.min(cards.length - 1, activeIndex + 1) : Math.max(0, activeIndex - 1);
        }
        cards[activeIndex].click();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, []);

  const activeLevel = displayLevels.find((l) => l.title === activeTitle);

  const handleCopyId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = id;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    }
  }, []);

  return (
    <div
      id="fanmadePage"
      className="flex flex-col h-screen relative z-[5]"
      style={{ opacity: 0 }}
    >
      {/* Tab navigation */}
      <nav className="relative z-10 flex gap-2 px-8 py-5 border-b border-white/[0.04]">
        {GAME_FILTERS.map((g) => (
          <button
            key={g}
            onClick={() => changeFilter(g)}
            className={`px-5 py-2 rounded-md font-mono text-[13px] font-bold tracking-wide transition-all duration-300 cursor-pointer ${
              filter === g
                ? 'bg-white text-black border border-white'
                : 'bg-transparent text-white/40 border border-white/[0.08] hover:text-white/60 hover:border-white/20'
            }`}
          >
            {g}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[42%] min-w-[280px] p-6 flex flex-col gap-4">
          {/* YouTube Embed */}
          <div
            ref={embedRef}
            className="w-full aspect-video bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden relative"
            style={{ opacity: activeLevel ? 1 : 0.4 }}
          >
            {activeLevel?.youtubeId ? (
              <iframe
                key={activeLevel.youtubeId}
                src={`https://www.youtube.com/embed/${activeLevel.youtubeId}?rel=0&modestbranding=1`}
                title={activeLevel.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-sm text-white/20">
                Select a level to preview
              </div>
            )}
          </div>

          {/* Action buttons */}
          {activeLevel && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Copy ID button (Pulsus only) */}
              {activeLevel.copyId && (
                <button
                  onClick={() => handleCopyId(activeLevel.copyId!)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs tracking-wide border transition-all duration-300 cursor-pointer ${
                    copiedId === activeLevel.copyId
                      ? 'bg-white/[0.12] border-white/20 text-white'
                      : 'bg-white/[0.06] border-white/[0.08] text-white/70 hover:bg-white/[0.10] hover:text-white'
                  }`}
                >
                  {copiedId === activeLevel.copyId ? (
                    <><Check size={14} strokeWidth={2} /> Copied!</>
                  ) : (
                    <><Copy size={14} strokeWidth={1.5} /> ID: {activeLevel.copyId}</>
                  )}
                </button>
              )}
              {activeLevel.chartUrl && activeLevel.available ? (
                <a
                  href={activeLevel.chartUrl}
                  target={activeLevel.chartUrl.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs tracking-wide bg-white/[0.06] border border-white/[0.08] text-white/80 hover:bg-white/[0.10] hover:text-white transition-all duration-300 cursor-pointer"
                >
                  <Download size={14} strokeWidth={1.5} />
                  Download Chart
                </a>
              ) : null}
              <a
                href={activeLevel.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs tracking-wide bg-transparent border border-white/[0.06] text-white/40 hover:text-white/70 hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
                YouTube
              </a>
              {!activeLevel.available && (
                <span className="font-mono text-[10px] text-white/25 ml-1">Unavailable</span>
              )}
            </div>
          )}

          {/* Active level info */}
          {activeLevel && (
            <div className="flex flex-col gap-2 mt-1">
              <h3 className="font-display font-bold text-lg text-white leading-tight">{activeLevel.title}</h3>
              <p className="font-mono text-xs text-white/40">
                {activeLevel.artist} · {activeLevel.game}
              </p>
              <span className="inline-block font-mono text-[11px] font-bold px-3 py-1 rounded bg-white text-black self-start">
                {activeLevel.diff}
              </span>
            </div>
          )}
        </div>

        {/* Right panel - scrollable level list */}
        <div
          ref={listRef}
          className="w-[58%] border-l border-white/[0.04] overflow-y-auto overflow-x-hidden relative cursor-grab select-none custom-scrollbar"
          style={{ padding: '36vh 0 55vh 10px' }}
          onScroll={() => requestAnimationFrame(updateCarousel)}
          onMouseDown={(e) => startDrag(e.pageY)}
          onMouseMove={(e) => moveDrag(e.pageY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => startDrag(e.touches[0].pageY)}
          onTouchMove={(e) => moveDrag(e.touches[0].pageY)}
          onTouchEnd={endDrag}
        >
          {displayLevels.map((level, i) => (
            <div
              key={level.title}
              data-song-card
              data-title={level.title}
              data-active={activeTitle === level.title}
              className={`mb-2.5 rounded-l-md px-6 py-4 cursor-pointer flex justify-between items-center transition-all duration-300 origin-left ${
                activeTitle === level.title
                  ? 'bg-transparent border border-white/80 border-r-0 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
                  : 'bg-white border border-transparent border-r-0 hover:bg-white/90'
              }`}
              style={{ opacity: 0 }}
              ref={(el) => {
                if (el) {
                  animate(el, {
                    opacity: [0, 1],
                    translateX: [40, 0],
                    duration: 350,
                    delay: i * 30,
                    ease: 'outCubic',
                  });
                }
              }}
              onClick={() => selectCard(level)}
            >
              <div className="min-w-0">
                <h3
                  className={`font-display font-bold text-[15px] mb-1 truncate transition-colors duration-300 ${
                    activeTitle === level.title ? 'text-white' : 'text-black'
                  }`}
                >
                  {level.title}
                  {!level.available && (
                    <span className={`ml-2 font-mono text-[9px] align-middle ${activeTitle === level.title ? 'text-white/30' : 'text-black/30'}`}>UNAVAILABLE</span>
                  )}
                </h3>
                <p
                  className={`font-mono text-[11px] truncate transition-colors duration-300 ${
                    activeTitle === level.title ? 'text-white/50' : 'text-black/40'
                  }`}
                >
                  {level.artist} · {level.game}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {/* Copy ID chip (Pulsus only) */}
                {level.copyId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyId(level.copyId!);
                    }}
                    className={`font-mono text-[9px] px-2 py-1 rounded border transition-all duration-200 cursor-pointer ${
                      copiedId === level.copyId
                        ? 'bg-white/20 border-white/30 text-white'
                        : activeTitle === level.title
                          ? 'bg-white/10 border-white/20 text-white/60 hover:text-white hover:bg-white/20'
                          : 'bg-black/5 border-black/10 text-black/30 hover:text-black/60 hover:bg-black/10'
                    }`}
                    title={`Copy ID: ${level.copyId}`}
                  >
                    {copiedId === level.copyId ? '✓' : `#${level.copyId}`}
                  </button>
                )}
                <span
                  className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded transition-all duration-300 ${
                    activeTitle === level.title ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  {level.diff}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className="shrink-0 flex items-center justify-between px-8 py-4 border-t border-white/[0.04] bg-black/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="text-white/40 font-mono text-[13px] flex items-center gap-2 hover:text-white transition-colors duration-200 cursor-pointer bg-transparent border-none"
        >
          <ArrowLeft size={16} strokeWidth={1.5} /> BACK
        </button>

        <div className="flex items-center gap-2.5 text-white/25 font-mono text-[11px]">
          <div className="border border-white/15 rounded px-2.5 py-1 text-sm bg-white/[0.02]">
            <ChevronLeft size={14} />
          </div>
          <div className="border border-white/15 rounded px-2.5 py-1 text-sm bg-white/[0.02]">
            <ChevronRight size={14} />
          </div>
          <span>NAVIGATE</span>
        </div>
      </div>
    </div>
  );
}
