import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ModuleId } from '../types';
import { MODULE_CONTENT, NAV_NODES } from '../data';

interface OverlayUIProps {
  activeModule: ModuleId | null;
  focusedModule: ModuleId;
  setActiveModule: (id: ModuleId | null) => void;
  setFocusedModule: (id: ModuleId) => void;
}

const ARCHIVE_META: Record<ModuleId, { type: string }> = {
  profile: {
    type: 'PERSONNEL RECORD',
  },
  projects: {
    type: 'MISSION ARCHIVE',
  },
  skills: {
    type: 'CAPABILITY DIAGNOSTICS',
  },
  contact: {
    type: 'TRANSMISSION CHANNEL',
  },
};

const LOCATOR_LABELS: Record<ModuleId, string> = {
  profile: 'PROFILE',
  projects: 'WORKS',
  skills: 'SKILL',
  contact: 'CONTACT',
};

const TERMINAL_LOGS = [
  '[00.000] WAKE / ARCHIVE KERNEL',
  '[00.041] MOUNT / EPHEMERIS TABLE',
  '[00.086] SYNC / ORBITAL CLOCK',
  '[00.133] READ / CELESTIAL REGISTRY',
  '[00.181] CHECK / GRID DEFORMATION',
  '[00.227] LOAD / OBJECT TELEMETRY',
  '[00.284] TRACE / SIGNAL VECTOR',
  '[00.346] RESOLVE / CAMERA SOLUTION',
  '[00.411] VERIFY / ARCHIVE INDEX',
  '[00.493] CALIBRATE / DEPTH FIELD',
  '[00.588] ALIGN / VIEWPORT TARGET',
  '[00.672] HANDSHAKE / DATA NODE',
] as const;

const DECODE_GLYPHS = ['#', '0', '1', 'X', '/', '\\', '[', ']', '+', '-'] as const;

function formatLocalTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function decodeFrame(target: string, progress: number, tick: number) {
  if (progress >= 1) return target;
  if (progress <= 0) return '#';

  const visibleLength = Math.min(
    target.length,
    Math.max(1, Math.ceil(progress * target.length * 2.2)),
  );
  const lockedLength = Math.min(
    visibleLength,
    Math.floor((progress ** 1.65) * target.length),
  );

  return Array.from({ length: visibleLength }, (_, index) => {
    if (index < lockedLength) return target[index];
    return DECODE_GLYPHS[(tick + index * 3) % DECODE_GLYPHS.length];
  }).join('');
}

function ArchiveLocator({ index, label }: { index: string; label: string }) {
  const initialFrame = { index: '#', label: '#' };
  const [decoded, setDecoded] = useState(initialFrame);
  const renderedRef = useRef(initialFrame);
  const targetRef = useRef<{ index: string; label: string } | null>(null);

  useEffect(() => {
    const nextTarget = { index, label };
    const previousTarget = targetRef.current;
    const isSwitch = previousTarget !== null
      && (previousTarget.index !== index || previousTarget.label !== label);
    targetRef.current = nextTarget;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      renderedRef.current = nextTarget;
      setDecoded(nextTarget);
      return undefined;
    }

    let cancelled = false;
    let animationFrame = 0;

    const setFrame = (frame: { index: string; label: string }) => {
      renderedRef.current = frame;
      setDecoded(frame);
    };

    const animate = (
      duration: number,
      onFrame: (progress: number, tick: number) => void,
    ) => new Promise<void>((resolve) => {
      const startedAt = window.performance.now();

      const update = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        onFrame(progress, Math.floor(progress * 8));
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(update);
        } else {
          resolve();
        }
      };

      animationFrame = window.requestAnimationFrame(update);
    });

    const runDecode = async () => {
      if (isSwitch) {
        const outgoing = renderedRef.current;
        await animate(95, (progress, tick) => {
          const reverseProgress = 1 - progress;
          setFrame({
            index: decodeFrame(outgoing.index, reverseProgress, tick + 5),
            label: decodeFrame(outgoing.label, reverseProgress, tick + 11),
          });
        });
      }

      if (cancelled) return;
      await animate(215, (progress, tick) => {
        setFrame({
          index: decodeFrame(nextTarget.index, progress, tick),
          label: decodeFrame(nextTarget.label, progress, tick + 4),
        });
      });
    };

    void runDecode();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [index, label]);

  return (
    <div className="archive-terminal__locator" aria-hidden="true">
      <span className="archive-terminal__index">{decoded.index}</span>
      <span className="archive-terminal__locator-word">{decoded.label}</span>
    </div>
  );
}

export default function OverlayUI({
  activeModule,
  focusedModule,
  setActiveModule,
  setFocusedModule,
}: OverlayUIProps) {
  const activeData = activeModule ? MODULE_CONTENT[activeModule] : null;
  const activeNode = NAV_NODES.find((node) => node.id === activeModule);
  const activeMeta = activeModule ? ARCHIVE_META[activeModule] : null;
  const terminalRef = useRef<HTMLElement>(null);
  const previousActiveModuleRef = useRef<ModuleId | null>(null);
  const [localTime, setLocalTime] = useState(() => formatLocalTime(new Date()));
  const isArchiveOpen = activeModule !== null;
  const isArchiveSwitch = activeModule !== null
    && previousActiveModuleRef.current !== null
    && previousActiveModuleRef.current !== activeModule;

  const openModule = (id: ModuleId) => {
    setFocusedModule(id);
    setActiveModule(id);
  };

  useEffect(() => {
    previousActiveModuleRef.current = activeModule;
  }, [activeModule]);

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setLocalTime(formatLocalTime(new Date()));
    }, 1000);

    return () => window.clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!isArchiveOpen) return undefined;

    const focusTimer = window.setTimeout(() => terminalRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [isArchiveOpen]);

  useEffect(() => {
    if (!activeModule) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModule(null);
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const activeIndex = NAV_NODES.findIndex((node) => node.id === activeModule);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextNode = NAV_NODES[
        (activeIndex + direction + NAV_NODES.length) % NAV_NODES.length
      ];
      setFocusedModule(nextNode.id);
      setActiveModule(nextNode.id);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModule, setActiveModule, setFocusedModule]);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-4 border border-[#4A4842] transition-opacity duration-500 md:inset-8 ${activeModule ? 'opacity-20' : 'opacity-100'}`}
      />

      <header
        className={`absolute left-8 top-8 z-10 transition-all duration-500 md:left-16 md:top-16 ${activeModule ? '-translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}
        aria-hidden={Boolean(activeModule)}
      >
        <h1 className="text-5xl font-black uppercase tracking-[-0.07em] leading-[0.78] text-[#DED8C4] md:text-7xl lg:text-[104px]">
          主系统<br />
          <span className="text-[#BE2E21]">CORE</span>
        </h1>
        <div className="mt-5 h-1.5 w-20 bg-[#BE2E21] md:w-28" />
        <p className="mt-4 hidden max-w-xs text-[10px] font-bold uppercase leading-relaxed tracking-[0.22em] text-[#DED8C4]/55 md:block">
          Visual engineer / spatial designer<br />
          Inner rock / belt / outer giants
        </p>
      </header>

      <nav
        aria-label="Portfolio modules"
        aria-hidden={Boolean(activeModule)}
        className={`absolute right-7 top-7 z-20 flex flex-col items-end gap-1.5 transition-all duration-500 md:right-16 md:top-16 ${activeModule ? 'pointer-events-none translate-x-3 opacity-0' : 'pointer-events-auto translate-x-0 opacity-100'}`}
      >
        <p className="mb-1 hidden text-[9px] font-bold uppercase tracking-[0.3em] text-[#DED8C4]/45 md:block">
          Archive ref. 2026-C
        </p>
        {NAV_NODES.map((node) => {
          const isFocused = focusedModule === node.id;
          const isActive = activeModule === node.id;

          return (
            <button
              key={node.id}
              type="button"
              tabIndex={activeModule ? -1 : 0}
              aria-label={`打开${node.title}模块`}
              aria-pressed={isActive}
              onMouseEnter={() => setFocusedModule(node.id)}
              onFocus={() => setFocusedModule(node.id)}
              onClick={() => openModule(node.id)}
              className={`module-nav-button group relative isolate flex h-9 min-w-36 items-center justify-between gap-4 overflow-hidden border px-3 text-left text-[10px] font-black uppercase tracking-[0.16em] md:min-w-44 ${isFocused ? 'is-focused' : ''}`}
            >
              <span className="relative z-10 text-xs">{node.index}</span>
              <span className="relative z-10">{node.subtitle}</span>
              <span className={`module-nav-button__status relative z-10 hidden h-1.5 w-1.5 rounded-full md:block ${isActive ? 'is-active' : ''}`} />
            </button>
          );
        })}
      </nav>

      <div
        className={`absolute bottom-24 left-1/2 hidden -translate-x-1/2 items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#DED8C4]/50 transition-opacity duration-500 md:flex ${activeModule ? 'opacity-0' : 'opacity-100'}`}
      >
        <span>Drag — orbit</span>
        <span className="h-px w-8 bg-[#DED8C4]/25" />
        <span>Wheel — scale</span>
        <span className="h-px w-8 bg-[#DED8C4]/25" />
        <span>Hover — focus</span>
      </div>

      <footer
        className={`absolute bottom-8 left-8 right-8 z-10 flex items-end justify-between transition-all duration-500 md:bottom-16 md:left-16 md:right-16 ${activeModule ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}
        aria-hidden={Boolean(activeModule)}
      >
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#BE2E21] md:text-[10px]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#BE2E21]" />
            System active
          </div>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#DED8C4]/40">100% stability</p>
        </div>
        <div className="text-right">
          <time
            className="text-2xl font-black italic leading-none text-[#DED8C4] md:text-4xl"
            dateTime={localTime}
          >
            {localTime}
          </time>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.24em] text-[#DED8C4]/40">Orbital timestamp</p>
        </div>
      </footer>

      <AnimatePresence mode="wait">
        {activeModule && activeData && activeNode && activeMeta && (
          <motion.section
            ref={terminalRef}
            key="archive-terminal-shell"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="archive-terminal pointer-events-auto absolute inset-0 z-40 text-[#DED8C4]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-terminal-title"
          >
            <div className="archive-terminal__shade" />
            <div className="archive-terminal__grid" aria-hidden="true" />
            <div className="archive-terminal__scanbar" aria-hidden="true" />
            <div className="archive-terminal__frame" aria-hidden="true" />

            <header className="archive-terminal__header">
              <div className={`archive-terminal__stream ${isArchiveSwitch ? 'is-switching' : ''}`}>
                <div className="archive-terminal__log-history" aria-hidden="true">
                  {TERMINAL_LOGS.map((log) => <span key={log}>{log}</span>)}
                  <span>[00.744] SELECT / OBJECT {activeNode.index}</span>
                  <span>[00.819] MATCH / {activeData.subtitle}</span>
                  <span>[00.901] LOCK / COMPLETE</span>
                </div>
                <div
                  key={`archive-boot-${activeModule}`}
                  className={`archive-terminal__boot ${isArchiveSwitch ? 'is-switching' : ''}`}
                  aria-label="终端连接状态"
                >
                  <span>&gt; ACQUIRING OBJECT {activeNode.index}</span>
                  <span>&gt; ORBIT LOCKED / SIGNAL 100%</span>
                  <span>&gt; ARCHIVE NODE / {activeData.subtitle} / OPEN<span className="terminal-cursor" /></span>
                </div>
              </div>
            </header>

            <ArchiveLocator index={activeNode.index} label={LOCATOR_LABELS[activeModule]} />

            <AnimatePresence mode="wait">
              <motion.main
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="archive-terminal__record"
              >
                <div className="archive-terminal__eyebrow">
                  <span>SYS.ARCHIVE / NODE {activeNode.index}</span>
                  <span>{activeMeta.type}</span>
                </div>
                <div className="archive-terminal__title-row">
                  <h2 id="archive-terminal-title">{activeData.title}</h2>
                  <span>{activeData.subtitle}</span>
                </div>
                <div className="archive-terminal__body">{activeData.body}</div>
              </motion.main>
            </AnimatePresence>

            <footer className="archive-terminal__footer">
              <div className="archive-terminal__footer-status">
                <span className="archive-terminal__pulse animate-pulse" />
                SESSION ACTIVE
                <span className="hidden sm:inline">/ ← → SWITCH NODE</span>
              </div>
              <div className="archive-terminal__controls">
                <nav aria-label="切换档案节点" className="archive-terminal__nav">
                  {NAV_NODES.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => openModule(node.id)}
                      aria-label={`切换到${node.title}档案`}
                      aria-pressed={activeModule === node.id}
                      className={activeModule === node.id ? 'is-active' : ''}
                    >
                      <span>{node.index}</span>
                      <small>{node.subtitle}</small>
                    </button>
                  ))}
                </nav>
                  <button
                    type="button"
                    onClick={() => setActiveModule(null)}
                    className="archive-terminal__close"
                    aria-label="关闭档案终端"
                  >
                    <span aria-hidden="true">×</span>
                    <small>ESC / CLOSE</small>
                  </button>
              </div>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
