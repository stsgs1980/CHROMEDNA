import { create } from 'zustand';

interface UIState {
  // Panel visibility
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;

  // Display options
  showBuyers: boolean;
  showSellers: boolean;
  showConnections: boolean;
  showVolumeProfile: boolean;
  showFibonacci: boolean;
  showEIALayer: boolean;
  showWeatherLayer: boolean;

  // Playback
  showPlaybackBar: boolean;

  // EIA Report Overlay
  showEIAReport: boolean;

  // Notification Center
  showNotifications: boolean;

  // Help Modal
  showHelp: boolean;

  // 3D Controls
  autoRotate: boolean;
  cameraTransition: boolean;

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setShowBuyers: (v: boolean) => void;
  setShowSellers: (v: boolean) => void;
  setShowConnections: (v: boolean) => void;
  setShowVolumeProfile: (v: boolean) => void;
  setShowFibonacci: (v: boolean) => void;
  setShowEIALayer: (v: boolean) => void;
  setShowWeatherLayer: (v: boolean) => void;
  togglePlaybackBar: () => void;
  toggleEIAReport: () => void;
  toggleNotifications: () => void;
  toggleHelp: () => void;
  setAutoRotate: (v: boolean) => void;
  setCameraTransition: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,

  showBuyers: true,
  showSellers: true,
  showConnections: true,
  showVolumeProfile: true,
  showFibonacci: false,
  showEIALayer: false,
  showWeatherLayer: false,

  showPlaybackBar: false,

  showEIAReport: false,

  showNotifications: false,

  showHelp: false,

  autoRotate: true,
  cameraTransition: false,

  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleBottomPanel: () => set((s) => ({ bottomPanelOpen: !s.bottomPanelOpen })),
  setShowBuyers: (showBuyers) => set({ showBuyers }),
  setShowSellers: (showSellers) => set({ showSellers }),
  setShowConnections: (showConnections) => set({ showConnections }),
  setShowVolumeProfile: (showVolumeProfile) => set({ showVolumeProfile }),
  setShowFibonacci: (showFibonacci) => set({ showFibonacci }),
  setShowEIALayer: (showEIALayer) => set({ showEIALayer }),
  setShowWeatherLayer: (showWeatherLayer) => set({ showWeatherLayer }),
  togglePlaybackBar: () => set((s) => ({ showPlaybackBar: !s.showPlaybackBar })),
  toggleEIAReport: () => set((s) => ({ showEIAReport: !s.showEIAReport })),
  toggleNotifications: () => set((s) => ({ showNotifications: !s.showNotifications })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setCameraTransition: (cameraTransition) => set({ cameraTransition }),
}));
