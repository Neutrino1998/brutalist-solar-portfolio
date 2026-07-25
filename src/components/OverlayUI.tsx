import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { ModuleId } from '../types';
import { MODULE_CONTENT, NAV_NODES } from '../data';

interface OverlayUIProps {
  activeModule: ModuleId | null;
  focusedModule: ModuleId;
  setActiveModule: (id: ModuleId | null) => void;
  setFocusedModule: (id: ModuleId) => void;
}

const ARCHIVE_META: Record<ModuleId, { type: string; channel: string; status: string }> = {
  profile: {
    type: 'PERSONNEL RECORD',
    channel: 'IDENTITY / BIOGRAPHIC',
    status: 'VERIFIED / ACTIVE',
  },
  projects: {
    type: 'MISSION ARCHIVE',
    channel: 'SELECTED OPERATIONS',
    status: '02 RECORDS / READY',
  },
  skills: {
    type: 'CAPABILITY DIAGNOSTICS',
    channel: 'SYSTEM PROFICIENCY',
    status: 'NOMINAL / ONLINE',
  },
  contact: {
    type: 'TRANSMISSION CHANNEL',
    channel: 'EXTERNAL COMMS',
    status: 'LISTENING / OPEN',
  },
};

export default function OverlayUI({
  activeModule,
  focusedModule,
  setActiveModule,
  setFocusedModule,
}: OverlayUIProps) {
  const activeData = activeModule ? MODULE_CONTENT[activeModule] : null;
  const activeNode = NAV_NODES.find((node) => node.id === activeModule);
  const activeMeta = activeModule ? ARCHIVE_META[activeModule] : null;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openModule = (id: ModuleId) => {
    setFocusedModule(id);
    setActiveModule(id);
  };

  useEffect(() => {
    if (!activeModule) return undefined;

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);
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
      window.clearTimeout(focusTimer);
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
        className={`absolute right-7 top-7 z-20 grid grid-cols-2 gap-1.5 transition-all duration-500 md:right-16 md:top-16 md:flex md:flex-col md:items-end ${activeModule ? 'pointer-events-none translate-x-3 opacity-0' : 'pointer-events-auto translate-x-0 opacity-100'}`}
      >
        <p className="col-span-2 mb-1 hidden text-[9px] font-bold uppercase tracking-[0.3em] text-[#DED8C4]/45 md:block">
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
              className={`module-nav-button group relative isolate flex h-9 min-w-10 items-center justify-between gap-4 overflow-hidden border px-2 text-left text-[10px] font-black uppercase tracking-[0.16em] md:min-w-44 md:px-3 ${isFocused ? 'is-focused' : ''}`}
            >
              <span className="relative z-10 text-xs">{node.index}</span>
              <span className="relative z-10 hidden md:inline">{node.subtitle}</span>
              <span className={`module-nav-button__status relative z-10 h-1.5 w-1.5 rounded-full ${isActive ? 'is-active' : ''}`} />
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
          <p className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.2em] text-[#DED8C4]/40 md:block">100% stability</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black italic leading-none text-[#DED8C4] md:text-4xl">19.04</p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.24em] text-[#DED8C4]/40">Orbital timestamp</p>
        </div>
      </footer>

      <AnimatePresence mode="wait">
        {activeModule && activeData && activeNode && activeMeta && (
          <motion.section
            key={activeModule}
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
              <div className="archive-terminal__boot" aria-label="终端连接状态">
                <span>&gt; ACQUIRING OBJECT {activeNode.index}</span>
                <span>&gt; ORBIT LOCKED / SIGNAL 100%</span>
                <span>&gt; ARCHIVE NODE / {activeData.subtitle} / OPEN<span className="terminal-cursor" /></span>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setActiveModule(null)}
                className="archive-terminal__close"
                aria-label="关闭档案终端"
              >
                <span aria-hidden="true">×</span>
                <small>ESC / CLOSE</small>
              </button>
            </header>

            <div className="archive-terminal__locator" aria-hidden="true">
              <span className="archive-terminal__index">{activeNode.index}</span>
              <span className="archive-terminal__locator-line" />
              <span className="archive-terminal__locator-copy">
                OBJECT LOCKED<br />
                {activeNode.systemLabel}<br />
                COORD / LIVE
              </span>
            </div>

            <main className="archive-terminal__record">
              <div className="archive-terminal__eyebrow">
                <span>SYS.ARCHIVE / NODE {activeNode.index}</span>
                <span>{activeMeta.status}</span>
              </div>
              <div className="archive-terminal__title-row">
                <div>
                  <p>{activeMeta.type}</p>
                  <h2 id="archive-terminal-title">{activeData.title}</h2>
                </div>
                <span>{activeData.subtitle}</span>
              </div>
              <p className="archive-terminal__channel">
                CHANNEL / {activeMeta.channel}
              </p>
              <div className="archive-terminal__body">{activeData.body}</div>
            </main>

            <footer className="archive-terminal__footer">
              <div className="archive-terminal__footer-status">
                <span className="archive-terminal__pulse" />
                SESSION ACTIVE
                <span className="hidden sm:inline">/ ← → SWITCH NODE</span>
              </div>
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
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
