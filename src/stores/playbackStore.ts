import { create } from 'zustand';

type PlaybackSpeed = 0.5 | 1 | 2 | 4 | 8;

interface PlaybackState {
  isPlaying: boolean;
  speed: PlaybackSpeed;
  currentIndex: number;
  maxIndex: number;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentIndex: (index: number) => void;
  setMaxIndex: (max: number) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  speed: 2,
  currentIndex: 0,
  maxIndex: 0,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setSpeed: (speed) => set({ speed }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setMaxIndex: (maxIndex) => set({ maxIndex }),
  reset: () => set({ currentIndex: 0, isPlaying: false }),
}));
