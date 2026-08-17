import { create } from 'zustand';
import type { VideoCallDto, VideoCallTarget } from '../services/video-call-api';

type VideoCallState = {
  confirmTarget: VideoCallTarget | null;
  waitingCall: VideoCallDto | null;
  activeCall: VideoCallDto | null;
  openConfirm: (target: VideoCallTarget) => void;
  closeConfirm: () => void;
  setWaitingCall: (call: VideoCallDto | null) => void;
  setActiveCall: (call: VideoCallDto | null) => void;
  clearSession: () => void;
};

export const useVideoCallStore = create<VideoCallState>((set) => ({
  confirmTarget: null,
  waitingCall: null,
  activeCall: null,
  openConfirm: (target) => set({ confirmTarget: target }),
  closeConfirm: () => set({ confirmTarget: null }),
  setWaitingCall: (call) => set({ waitingCall: call, confirmTarget: null }),
  setActiveCall: (call) =>
    set({ activeCall: call, waitingCall: null, confirmTarget: null }),
  clearSession: () =>
    set({ confirmTarget: null, waitingCall: null, activeCall: null }),
}));
