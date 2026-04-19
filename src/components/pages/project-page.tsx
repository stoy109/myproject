'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger, createScope } from 'animejs';
import { BarChart3, Music } from 'lucide-react';

interface ProjectPageProps {
  onNavigate: (page: string) => void;
}

const projects = [
  { id: 'fanmade', label: 'FANMADE LEVEL', icon: BarChart3, description: 'Community-crafted rhythm game levels' },
  { id: 'music', label: 'MUSIC', icon: Music, description: 'Listen to the soundtrack' },
];

export function ProjectPage({ onNavigate }: ProjectPageProps) {
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null);

  useEffect(() => {
    const scope = createScope();
    scopeRef.current = scope;

    scope.add(() => {
      animate('#projectPage', {
        opacity: [0, 1],
        duration: 800,
        ease: 'outCubic',
      });

      animate('#projectTitle', {
        opacity: [0, 1],
        translateY: ['20px', '0px'],
        scale: [0.9, 1],
        duration: 800,
        ease: 'outCubic',
      });

      animate('.project-btn', {
        opacity: [0, 1],
        translateY: ['30px', '0px'],
        scale: [0.95, 1],
        duration: 600,
        delay: stagger(150, { start: 200 }),
        ease: 'outCubic',
      });
    });

    return () => scope.revert();
  }, []);

  return (
    <div
      id="projectPage"
      className="flex flex-col items-center justify-center h-screen relative z-[5]"
      style={{ opacity: 0 }}
    >
      <h1
        id="projectTitle"
        className="font-display font-extrabold text-white tracking-[0.2em] uppercase mb-14 select-none"
        style={{ fontSize: 'clamp(44px, 9vw, 100px)', textIndent: '0.2em', opacity: 0 }}
      >
        Project
      </h1>

      <div className="flex gap-6 flex-wrap justify-center px-6">
        {projects.map((project) => {
          const Icon = project.icon;
          return (
            <button
              key={project.id}
              className="project-btn group relative cursor-pointer bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.08)] hover:-translate-y-1.5"
              style={{
                width: 'clamp(130px, 18vw, 180px)',
                height: 'clamp(130px, 18vw, 180px)',
                opacity: 0,
              }}
              onClick={() => onNavigate(project.id)}
            >
              <Icon
                className="text-white/70 group-hover:text-white transition-colors duration-300"
                size={32}
                strokeWidth={1.5}
              />
              <span className="font-mono font-bold text-[clamp(9px,1.1vw,12px)] tracking-[0.08em] text-white/60 group-hover:text-white/90 transition-colors duration-300 uppercase">
                {project.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
