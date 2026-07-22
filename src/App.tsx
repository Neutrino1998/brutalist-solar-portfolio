/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import CanvasScene from './components/CanvasScene';
import OverlayUI from './components/OverlayUI';
import { ModuleId } from './types';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [focusedModule, setFocusedModule] = useState<ModuleId>('projects');

  return (
    <div className="w-full h-screen bg-[#121212] text-[#DED8C4] overflow-hidden relative font-sans selection:bg-[#DED8C4] selection:text-[#121212]" style={{ backgroundColor: '#121212' }}>
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1A1A1A 0%, #121212 72%)' }}></div>
      {/* Grain/Noise Overlay for aesthetic */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.16] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <CanvasScene
        activeModule={activeModule}
        focusedModule={focusedModule}
        setActiveModule={setActiveModule}
        setFocusedModule={setFocusedModule}
      />
      <OverlayUI
        activeModule={activeModule}
        focusedModule={focusedModule}
        setActiveModule={setActiveModule}
        setFocusedModule={setFocusedModule}
      />
    </div>
  );
}
