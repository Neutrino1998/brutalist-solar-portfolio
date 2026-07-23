import { AnimatePresence, motion } from 'motion/react';
import { ModuleId } from '../types';
import { MODULE_CONTENT, NAV_NODES } from '../data';

interface OverlayUIProps {
  activeModule: ModuleId | null;
  focusedModule: ModuleId;
  setActiveModule: (id: ModuleId | null) => void;
  setFocusedModule: (id: ModuleId) => void;
}

export default function OverlayUI({
  activeModule,
  focusedModule,
  setActiveModule,
  setFocusedModule,
}: OverlayUIProps) {
  const activeData = activeModule ? MODULE_CONTENT[activeModule] : null;
  const activeIndex = NAV_NODES.find((node) => node.id === activeModule)?.index;

  const openModule = (id: ModuleId) => {
    setFocusedModule(id);
    setActiveModule(id);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="absolute inset-4 md:inset-8 border border-[#4A4842] pointer-events-none" />
      <div className="absolute left-1/4 top-0 h-full w-px bg-[#DED8C4]/[0.07]" />
      <div className="absolute right-1/4 top-0 h-full w-px bg-[#DED8C4]/[0.07]" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-[#DED8C4]/[0.07]" />

      <header className="absolute left-8 top-8 z-10 md:left-16 md:top-16">
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
        className="pointer-events-auto absolute right-7 top-7 z-20 grid grid-cols-2 gap-1.5 md:right-16 md:top-16 md:flex md:flex-col md:items-end"
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
              aria-label={`打开${node.title}模块`}
              aria-pressed={isActive}
              onMouseEnter={() => setFocusedModule(node.id)}
              onFocus={() => setFocusedModule(node.id)}
              onClick={() => openModule(node.id)}
              className={`group flex h-9 min-w-10 items-center justify-between gap-4 border px-2 text-left text-[10px] font-black uppercase tracking-[0.16em] transition-colors md:min-w-44 md:px-3 ${
                isFocused
                  ? 'border-[#DED8C4] bg-[#DED8C4] text-[#121212]'
                  : 'border-[#5A5750] bg-[#121212]/70 text-[#DED8C4] hover:border-[#DED8C4]'
              }`}
            >
              <span className="text-xs">{node.index}</span>
              <span className="hidden md:inline">{node.subtitle}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#BE2E21]' : isFocused ? 'bg-[#121212]' : 'bg-[#5A5750]'}`} />
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-24 left-1/2 hidden -translate-x-1/2 items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#DED8C4]/50 md:flex">
        <span>Drag — orbit</span>
        <span className="h-px w-8 bg-[#DED8C4]/25" />
        <span>Wheel — scale</span>
        <span className="h-px w-8 bg-[#DED8C4]/25" />
        <span>Hover — focus</span>
      </div>

      <footer className="absolute bottom-8 left-8 right-8 z-10 flex items-end justify-between md:bottom-16 md:left-16 md:right-16">
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

      <AnimatePresence>
        {activeModule && activeData && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 150 }}
            className="pointer-events-auto absolute right-0 top-0 z-40 h-full w-full overflow-y-auto border-l border-[#4A4842] bg-[#151513] p-8 text-[#DED8C4] shadow-2xl md:w-[460px] md:p-12 lg:w-[520px]"
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-[#BE2E21]" />
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="absolute right-8 top-8 grid h-10 w-10 place-items-center bg-[#DED8C4] text-3xl font-black leading-none text-[#121212] transition-colors hover:bg-[#BE2E21] hover:text-[#DED8C4]"
              aria-label="关闭模块"
            >
              ×
            </button>
            <div className="mt-16">
              <div className="mb-10 flex flex-col">
                <div className="mb-5 flex items-center gap-4">
                  <span className="grid h-10 w-10 rotate-45 place-items-center bg-[#DED8C4] text-[#121212]">
                    <span className="-rotate-45 text-xs font-black">{activeIndex}</span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-[#BE2E21]">
                    {activeData.subtitle} / DATA NODE
                  </span>
                </div>
                <h2 className="mt-2 text-6xl font-black leading-none text-[#DED8C4] md:text-7xl">
                  {activeData.title}
                </h2>
              </div>
              <div className="mb-10 h-px w-full bg-[#BE2E21]" />
              <div className="text-lg font-medium leading-relaxed">{activeData.body}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
