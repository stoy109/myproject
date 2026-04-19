'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { animate, createScope } from 'animejs';
import { Background } from '@/components/background';
import { MainPage } from '@/components/pages/main-page';
import { ProjectPage } from '@/components/pages/project-page';
import { FanmadePage } from '@/components/pages/fanmade-page';
import { MusicPage } from '@/components/pages/music-page';

type PageType = 'home' | 'project' | 'fanmade' | 'music';

export default function Home() {
  const [page, setPage] = useState<PageType>('home');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  const navigateTo = useCallback((target: string) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setPage(target as PageType);
      return;
    }

    animate(wrapper, {
      opacity: [1, 0],
      duration: 400,
      ease: 'inCubic',
      onComplete: () => {
        setPage(target as PageType);
      },
    });
  }, []);

  // Fade in new page after React re-renders
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const frame = requestAnimationFrame(() => {
      animate(wrapper, {
        opacity: [0, 1],
        duration: 500,
        ease: 'outCubic',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [page]);

  // Cleanup scope on unmount
  useEffect(() => {
    return () => {
      scopeRef.current?.revert();
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-black text-white overflow-hidden relative">
      <Background />

      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div ref={wrapperRef} className="flex-1" style={{ opacity: 1 }}>
        {page === 'home' && <MainPage onNavigate={navigateTo} />}
        {page === 'project' && <ProjectPage onNavigate={navigateTo} />}
        {page === 'fanmade' && <FanmadePage onBack={() => navigateTo('project')} />}
        {page === 'music' && <MusicPage onBack={() => navigateTo('project')} />}
      </div>
    </main>
  );
}
