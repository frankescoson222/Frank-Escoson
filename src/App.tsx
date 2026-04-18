/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  Gamepad2, 
  Settings, 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  Maximize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle
} from 'lucide-react';

type ButtonState = Record<string, boolean>;

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [buttons, setButtons] = useState<ButtonState>({});
  const [lastInput, setLastInput] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState<'controller' | 'games' | 'playing'>('controller');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Customization State
  const [accentColor, setAccentColor] = useState('#00d2ff');
  const [glassBlur, setGlassBlur] = useState(40);
  const [showLabels, setShowLabels] = useState(true);
  const [controllerScale, setControllerScale] = useState(100);

  // Vibration helper
  const vibrate = (ms = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  useEffect(() => {
    const s = io();
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const handlePress = useCallback((id: string, isPressed: boolean) => {
    setButtons(prev => ({ ...prev, [id]: isPressed }));
    
    if (isPressed) {
      vibrate(30);
      setLastInput(id);
      socket?.emit('controller_input', { type: 'button', id, state: 'pressed' });
    } else {
      socket?.emit('controller_input', { type: 'button', id, state: 'released' });
    }
  }, [socket]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const DPad = () => (
    <div className="relative w-48 h-48 bg-nexus-surface rounded-full border border-nexus-border flex items-center justify-center shadow-2xl">
      <div className="absolute grid grid-cols-3 grid-rows-3 gap-1">
        <div />
        <DirectionButton id="UP" icon={<ChevronUp />} onStateChange={handlePress} />
        <div />
        <DirectionButton id="LEFT" icon={<ChevronLeft />} onStateChange={handlePress} />
        <div className="bg-nexus-bg/50 rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
        </div>
        <DirectionButton id="RIGHT" icon={<ChevronRight />} onStateChange={handlePress} />
        <div />
        <DirectionButton id="DOWN" icon={<ChevronDown />} onStateChange={handlePress} />
        <div />
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="relative w-48 h-48 grid grid-cols-3 grid-rows-3 gap-2">
      <div />
      <ActionButton id="TRIANGLE" label="Δ" color="text-[#3ed8a3]" onStateChange={handlePress} />
      <div />
      <ActionButton id="SQUARE" label="□" color="text-[#e293b6]" onStateChange={handlePress} />
      <div />
      <ActionButton id="CIRCLE" label="○" color="text-[#e27357]" onStateChange={handlePress} />
      <div />
      <ActionButton id="CROSS" label="✖" color="text-[#738ce2]" onStateChange={handlePress} />
      <div />
    </div>
  );

  const [orientation, setOrientation] = useState(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (orientation === 'portrait') {
    return (
      <div className="fixed inset-0 bg-[#0c0c1e] flex flex-col items-center justify-center p-12 text-center overflow-hidden">
         <div className="fixed inset-0" style={{
            backgroundImage: `radial-gradient(at 0% 0%, #32255e 0px, transparent 50%),
                             radial-gradient(at 100% 0%, #1c4e7a 0px, transparent 50%),
                             radial-gradient(at 100% 100%, #4a2b4b 0px, transparent 50%),
                             radial-gradient(at 0% 100%, #1b3b3a 0px, transparent 50%)`
         }} />
        <motion.div 
          animate={{ rotate: 90 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-8 p-6 glass-button rounded-3xl"
        >
          <RotateCcw className="w-12 h-12 text-accent" />
        </motion.div>
        <h1 className="relative text-2xl font-bold mb-4">Rotate Device</h1>
        <p className="relative text-white/50 text-sm max-w-xs">
          The Nexus Controller is optimized for landscape mode. Please rotate your device to begin.
        </p>
        
        <div className="relative mt-12 p-6 glass-button rounded-2xl text-left">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50">Setup Guide</h2>
          <ol className="text-xs space-y-3 font-mono opacity-80">
            <li>1. Open in Safari (iOS) or Chrome (Android)</li>
            <li>2. Tap 'Share' or 'Menu' (three dots)</li>
            <li>3. Select 'Add to Home Screen'</li>
            <li>4. Launch from home screen for full-screen arcade experience</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ '--color-accent': accentColor } as any}
    >
      <div 
        className="device-frame"
        style={{ backdropFilter: `blur(${glassBlur}px)`, WebkitBackdropFilter: `blur(${glassBlur}px)` }}
      >
        {/* Shoulder Buttons & Triggers */}
        <div className="absolute top-0 left-0 right-0 flex justify-between px-16 z-20">
          <div className="flex gap-4">
            <TriggerButton id="L2" label="L2" onStateChange={handlePress} />
            <TriggerButton id="L1" label="L1" onStateChange={handlePress} />
          </div>
          <div className="flex gap-4 text-right">
            <TriggerButton id="R1" label="R1" onStateChange={handlePress} />
            <TriggerButton id="R2" label="R2" onStateChange={handlePress} />
          </div>
        </div>

        {/* Top Bar / Header */}
        <div className="w-full h-10 flex items-center justify-between px-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('controller')}
              className={`px-4 py-1 rounded-full border flex items-center gap-2 text-[8px] font-bold tracking-widest uppercase transition-all ${currentView === 'controller' ? 'bg-white text-black border-white' : 'bg-glass-active border-glass-border text-white/50 hover:text-white'}`}
            >
              Control
            </button>
            <button 
              onClick={() => setCurrentView('games')}
              className={`px-4 py-1 rounded-full border flex items-center gap-2 text-[8px] font-bold tracking-widest uppercase transition-all ${currentView === 'games' ? 'bg-white text-black border-white' : 'bg-glass-active border-glass-border text-white/50 hover:text-white'}`}
            >
              Game Hub
            </button>
            <div className={`px-4 py-1 rounded-full bg-glass-active border border-glass-border flex items-center gap-2 text-[8px] font-bold tracking-widest uppercase transition-colors ${connected ? 'text-white' : 'text-red-400'}`}>
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-shadow duration-500 ${connected ? 'bg-[#4cd137]' : 'bg-red-400'}`} 
                style={{ boxShadow: connected ? `0 0 8px ${accentColor}` : '0 0 8px #ef4444' }}
              />
              {connected ? 'Sync_Stable' : 'Offline'}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowSettings(true)}
                className="p-1 glass-button rounded-lg text-white/50 hover:text-white"
             >
                <Settings className="w-3 h-3" />
             </button>
             <button 
                onClick={toggleFullscreen}
                className={`p-1 glass-button rounded-lg transition-all ${isFullscreen ? 'text-accent border-accent/50' : 'text-white/50 hover:text-white'}`}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
             >
                <Maximize2 className="w-3 h-3" />
             </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 w-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'controller' && (
              <motion.div 
                key="controller"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] items-center px-12 pb-2 transition-transform duration-300"
                style={{ transform: `scale(${controllerScale / 100})` }}
              >
                {/* Left: Stick & D-Pad */}
                <div className="flex flex-col items-center gap-2 md:gap-4 lg:gap-6 scale-90 origin-bottom lg:scale-100">
                  <Stick id="L3" onStateChange={handlePress} />
                  <DPad />
                </div>

                {/* Center: Touchpad & System Buttons */}
                <div className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 px-2 scale-90 origin-bottom lg:scale-100">
                  <div 
                    onTouchStart={() => handlePress('TOUCHPAD', true)}
                    onTouchEnd={() => handlePress('TOUCHPAD', false)}
                    className="w-48 md:w-56 h-28 md:h-32 bg-glass border-2 border-glass-border rounded-2xl flex flex-col items-center justify-center relative overflow-hidden glass-button active:bg-glass-active"
                  >
                    <div className="absolute top-2 left-2 right-2 bottom-2 rounded-xl border border-white/5 pointer-events-none" />
                    {showLabels && <div className="text-[10px] font-mono opacity-30 uppercase tracking-[4px] mt-4">Touchpad</div>}
                    <div className="flex-1 w-full" />
                    <div className="w-full h-1" style={{ backgroundColor: `${accentColor}40` }} />
                  </div>

                  <div className="flex items-center gap-6 md:gap-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <button onTouchStart={() => handlePress('CREATE', true)} onTouchEnd={() => handlePress('CREATE', false)} className="w-8 h-5 glass-button rounded-sm" />
                      {showLabels && <span className="text-[6px] uppercase font-bold opacity-30 tracking-widest">Create</span>}
                    </div>

                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-glass-active to-transparent border border-glass-border flex items-center justify-center glass-button shadow-inner" onClick={() => { vibrate(100); handlePress('PS', true); setTimeout(() => handlePress('PS', false), 200); }}>
                      <div className={`w-2.5 h-2.5 rounded-full transition-shadow duration-500 ${connected ? 'bg-accent' : 'bg-white/10'}`} style={{ backgroundColor: connected ? accentColor : 'rgba(255,255,255,0.1)', boxShadow: connected ? `0 0 15px ${accentColor}` : 'none' }} />
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <button onTouchStart={() => handlePress('OPTIONS', true)} onTouchEnd={() => handlePress('OPTIONS', false)} className="w-8 h-5 glass-button rounded-sm" />
                      {showLabels && <span className="text-[6px] uppercase font-bold opacity-30 tracking-widest">Options</span>}
                    </div>
                  </div>

                  <div className="text-[7px] font-mono opacity-20 uppercase tracking-[2px]">{lastInput || "READY"}</div>
                  <button onTouchStart={() => handlePress('MUTE', true)} onTouchEnd={() => handlePress('MUTE', false)} className="w-8 h-3.5 glass-button rounded-full" style={{ borderColor: `${accentColor}40` }} />
                </div>

                {/* Right: Face Buttons & Stick */}
                <div className="flex flex-col items-center gap-2 md:gap-4 lg:gap-6 scale-90 origin-bottom lg:scale-100">
                  <ActionButtons />
                  <Stick id="R3" onStateChange={handlePress} />
                </div>
              </motion.div>
            )}

            {currentView === 'games' && (
              <motion.div 
                key="games"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="absolute inset-0 p-8 flex flex-col"
              >
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter mb-1 uppercase">Nexus Game Cloud</h2>
                    <p className="text-xs text-white/40 tracking-widest font-bold uppercase">Optimized Mobile Experiences</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest italic">New Arrivals</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {[
                    { id: 'neon-strike', name: 'Neon Strike 2077', genre: 'Action Arcade', color: '#ff00d2', img: 'https://picsum.photos/seed/cyber/600/400' },
                    { id: 'zenith', name: 'Zenith Flight', genre: 'Atmospheric Sim', color: '#00d2ff', img: 'https://picsum.photos/seed/sky/600/400' },
                    { id: 'retro-racing', name: 'Retro Grid Racer', genre: 'Speed / Synth', color: '#d2ff00', img: 'https://picsum.photos/seed/race/600/400' },
                    { id: 'crystal-climb', name: 'Crystal Climber', genre: 'Platformer', color: '#00ff7f', img: 'https://picsum.photos/seed/cave/600/400' },
                  ].map(game => (
                    <motion.button
                      key={game.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedGame(game.id); setCurrentView('playing'); }}
                      className="group relative h-48 rounded-3xl overflow-hidden border border-white/10 flex flex-col text-left"
                    >
                      <img src={game.img} alt={game.name} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="relative mt-auto p-4">
                         <div className="text-[8px] font-black uppercase tracking-[3px] mb-1" style={{ color: game.color }}>{game.genre}</div>
                         <div className="text-lg font-bold leading-tight line-clamp-2">{game.name}</div>
                      </div>
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3 h-3" />
                      </div>
                    </motion.button>
                  ))}
                  {/* Custom Game Loader */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="group relative h-48 rounded-3xl overflow-hidden border border-accent/30 bg-glass transition-all flex flex-col p-6 border-dashed"
                  >
                    <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-[8px] font-black uppercase tracking-[3px] mb-1 text-accent">Cloud Inject</div>
                      <div className="text-lg font-bold leading-tight mb-4">Run Remote Mobile Game</div>
                      <input 
                        type="text" 
                        placeholder="https://game-url.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono mb-4 focus:border-accent outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSelectedGame((e.target as HTMLInputElement).value);
                            setCurrentView('playing');
                          }
                        }}
                      />
                      <p className="text-[7px] opacity-40 uppercase tracking-widest leading-relaxed">Enter a URL to stream any WebGL/HTML5 mobile game directly to this dualsense interface.</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {currentView === 'playing' && (
              <motion.div 
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black flex flex-col"
              >
                {selectedGame?.startsWith('http') ? (
                  <iframe 
                    src={selectedGame} 
                    className="w-full h-full border-none"
                    allow="autoplay; gamepad; fullscreen"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center relative group">
                    <div className="text-center">
                        <div className="w-32 h-32 rounded-full border-4 border-accent animate-spin-slow mb-6 mx-auto flex items-center justify-center">
                          <Gamepad2 className="w-12 h-12 text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 uppercase tracking-widest">Launching {selectedGame?.replace('-', ' ')}</h2>
                        <p className="text-xs text-white/40 tracking-widest uppercase">Connecting DualSense Virtual Input...</p>
                    </div>
                  </div>
                )}

                {/* Game Simulation Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-black/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md z-50">
                  <button onClick={() => setCurrentView('games')} className="text-[10px] font-bold uppercase tracking-widest hover:text-red-400">Exit Game</button>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">L3/R3: Active</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full py-6 text-center text-[10px] font-bold tracking-[3px] opacity-30 uppercase border-t border-glass-border/10 m-x-12">
          Nexus DualSense • Hardware Profile v4.5.1
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {!isFullscreen && currentView !== 'playing' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
             <button 
              onClick={toggleFullscreen}
              className="px-6 py-3 rounded-full bg-accent text-black font-black uppercase text-xs tracking-[4px] shadow-[0_0_30px_rgba(0,210,255,0.4)] flex items-center gap-3 active:scale-95 transition-transform"
             >
                <Maximize2 className="w-4 h-4" />
                Maximize Experience
             </button>
          </motion.div>
        )}

        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#12122b] rounded-[32px] border border-glass-border p-8 overflow-hidden relative shadow-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                    <Settings className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <h2 className="text-xl font-bold">Personalization</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
                >
                  ✖
                </button>
              </div>

              <div className="space-y-6">
                {/* Accent Color */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-50 mb-3 block">Accent Color</label>
                  <div className="flex gap-3">
                    {['#00d2ff', '#ff00d2', '#d2ff00', '#00ff7f', '#ffffff'].map(color => (
                      <button 
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-transform ${accentColor === color ? 'scale-110' : 'scale-100 opacity-50'}`}
                        style={{ backgroundColor: color, borderColor: accentColor === color ? 'white' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] uppercase tracking-widest opacity-50">Controller Scale</label>
                    <span className="text-xs font-mono">{controllerScale}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" max="120" 
                    value={controllerScale} 
                    onChange={e => setControllerScale(parseInt(e.target.value))}
                    className="w-full accent-accent"
                    style={{ accentColor: accentColor }}
                  />
                </div>

                {/* Glass Blur */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] uppercase tracking-widest opacity-50">Frosted Intensity</label>
                    <span className="text-xs font-mono">{glassBlur}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="80" 
                    value={glassBlur} 
                    onChange={e => setGlassBlur(parseInt(e.target.value))}
                    className="w-full"
                    style={{ accentColor: accentColor }}
                  />
                </div>

                {/* Toggles */}
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowLabels(!showLabels)}
                      className={`flex-1 py-3 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest ${showLabels ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 opacity-50'}`}
                    >
                      {showLabels ? 'Labels ON' : 'Labels OFF'}
                    </button>
                 </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="px-8 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest"
                  >
                    Apply Changes
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DirectionButton({ id, icon, onStateChange }: { id: string, icon: ReactNode, onStateChange: (id: string, state: boolean) => void }) {
  const [pressed, setPressed] = useState(false);

  const handleStart = () => {
    setPressed(true);
    onStateChange(id, true);
  };

  const handleEnd = () => {
    setPressed(false);
    onStateChange(id, false);
  };

  const radiusClass = id === 'UP' ? 'rounded-t-lg' : 
                      id === 'DOWN' ? 'rounded-b-lg' : 
                      id === 'LEFT' ? 'rounded-l-lg' : 
                      id === 'RIGHT' ? 'rounded-r-lg' : 'rounded-none';

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => pressed && handleEnd()}
      className={`w-12 h-12 flex items-center justify-center transition-all d-btn ${radiusClass} ${
        pressed ? 'bg-glass-active scale-95' : ''
      }`}
    >
      <span className="opacity-50">{icon}</span>
    </button>
  );
}

function ActionButton({ id, label, color, onStateChange }: { id: string, label: string, color: string, onStateChange: (id: string, state: boolean) => void }) {
  const [pressed, setPressed] = useState(false);

  const handleStart = () => {
    setPressed(true);
    onStateChange(id, true);
  };

  const handleEnd = () => {
    setPressed(false);
    onStateChange(id, false);
  };

  const borderColor = id === 'TRIANGLE' ? 'rgba(62, 216, 163, 0.4)' :
                      id === 'CROSS' ? 'rgba(115, 140, 226, 0.4)' :
                      id === 'SQUARE' ? 'rgba(226, 147, 182, 0.4)' :
                      id === 'CIRCLE' ? 'rgba(226, 115, 87, 0.4)' : 'var(--glass-border)';

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => pressed && handleEnd()}
      style={{ borderColor: pressed ? 'white' : borderColor }}
      className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all border-2 bg-glass ${
        pressed ? 'bg-glass-active scale-90' : 'text-white/80'
      }`}
    >
      {label}
    </button>
  );
}

function TriggerButton({ id, label, onStateChange }: { id: string, label: string, onStateChange: (id: string, state: boolean) => void }) {
  const [pressed, setPressed] = useState(false);
  const isL2R2 = id === 'L2' || id === 'R2';

  const handleStart = () => {
    setPressed(true);
    onStateChange(id, true);
  };

  const handleEnd = () => {
    setPressed(false);
    onStateChange(id, false);
  };

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={() => pressed && handleEnd()}
      className={`${isL2R2 ? 'w-24 h-16' : 'w-24 h-10'} glass-button rounded-b-xl flex flex-col items-center justify-center transition-all ${
        pressed ? 'bg-glass-active translate-y-2' : ''
      }`}
    >
      <span className="text-[10px] font-bold tracking-widest">{label}</span>
      {isL2R2 && <div className="w-12 h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
        <div className={`h-full bg-accent transition-all ${pressed ? 'w-full' : 'w-0'}`} />
      </div>}
    </button>
  );
}

function Stick({ id, onStateChange }: { id: string, onStateChange: (id: string, state: boolean) => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div 
      className="w-32 h-32 rounded-full border-2 border-glass-border bg-glass flex items-center justify-center relative shadow-2xl active:scale-95 transition-transform"
      onTouchStart={() => {
        setPressed(true);
        onStateChange(id, true);
      }}
      onTouchEnd={() => {
        setPressed(false);
        onStateChange(id, false);
      }}
    >
      <div className={`w-20 h-20 rounded-full border border-glass-border bg-glass-active shadow-xl transition-all ${
        pressed ? 'scale-110 brightness-150' : ''
      }`} />
      <span className="absolute text-[8px] font-bold opacity-20">{id}</span>
    </div>
  );
}
