import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { meRequest } from '@/features/auth';
import { connectChatSocket } from '@/features/chat/chat-socket';
import { useAuthStore } from '@/store';
import {
  getVideoCallRequest,
  listPendingVideoCallsRequest,
  type VideoCallDto,
} from '../services/video-call-api';
import {
  notifyNewIncomingCall,
  stopIncomingCallAlert,
  syncIncomingCallQueue,
} from '../services/video-call-notify';
import { useVideoCallStore } from '../store/video-call-store';
import { VideoCallConfirmModal } from './video-call-confirm-modal';
import { VideoCallOverlay } from './video-call-overlay';
import { VideoCallWaiting } from './video-call-waiting';

export function VideoCallHost() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const waitingCall = useVideoCallStore((s) => s.waitingCall);
  const activeCall = useVideoCallStore((s) => s.activeCall);
  const setActiveCall = useVideoCallStore((s) => s.setActiveCall);
  const clearSession = useVideoCallStore((s) => s.clearSession);
  const isModel = user?.role === 'MODEL';
  const inCall = activeCall?.status === 'ACTIVE';

  useEffect(() => {
    const sock = connectChatSocket(accessToken);
    if (!sock || !user?.id) return;

    const refreshWallet = async () => {
      try {
        const me = await meRequest();
        setUser(me);
      } catch {
        /* ignore */
      }
    };

    const onAccepted = (payload: VideoCallDto) => {
      if (!payload?.id) return;
      setActiveCall(payload);
      stopIncomingCallAlert({ clearAlerted: true });
      void refreshWallet();
      void queryClient.invalidateQueries({ queryKey: ['video-call', 'pending'] });
    };

    const onEnded = (payload: VideoCallDto) => {
      if (!payload?.id) return;
      const current =
        useVideoCallStore.getState().activeCall ?? useVideoCallStore.getState().waitingCall;
      if (current && current.id === payload.id) {
        clearSession();
      }
      void queryClient.invalidateQueries({ queryKey: ['video-call', 'pending'] });
    };

    const onIncoming = (payload: VideoCallDto) => {
      void queryClient.invalidateQueries({ queryKey: ['video-call', 'pending'] });
      // Instant alert for the model when a brand-new request arrives.
      if (
        user.role === 'MODEL' &&
        !useVideoCallStore.getState().activeCall &&
        payload?.id &&
        payload.client?.displayName
      ) {
        notifyNewIncomingCall(payload.id, payload.client.displayName);
      }
    };

    sock.on('video-call:accepted', onAccepted);
    sock.on('video-call:ended', onEnded);
    sock.on('video-call:incoming', onIncoming);

    return () => {
      sock.off('video-call:accepted', onAccepted);
      sock.off('video-call:ended', onEnded);
      sock.off('video-call:incoming', onIncoming);
    };
  }, [accessToken, user?.id, user?.role, queryClient, setActiveCall, clearSession, setUser]);

  // Fallback in case the socket event is missed: poll the pending call until answered.
  const waitingId = waitingCall?.status === 'PENDING' ? waitingCall.id : null;
  const waitingPoll = useQuery({
    queryKey: ['video-call', 'watch', waitingId],
    queryFn: () => getVideoCallRequest(waitingId!),
    enabled: Boolean(waitingId),
    refetchInterval: 2000,
  });

  useEffect(() => {
    const call = waitingPoll.data;
    if (!call || call.id !== waitingId) return;
    if (call.status === 'ACTIVE') {
      setActiveCall(call);
      void meRequest().then(setUser).catch(() => undefined);
    } else if (call.status === 'ENDED' || call.status === 'CANCELLED') {
      clearSession();
    }
  }, [waitingPoll.data, waitingId, setActiveCall, clearSession, setUser]);

  // Model side: watch the queue — each new callId rings 10s again.
  const pendingQuery = useQuery({
    queryKey: ['video-call', 'pending'],
    queryFn: listPendingVideoCallsRequest,
    enabled: isModel && !inCall,
    refetchInterval: isModel && !inCall ? 3000 : false,
  });

  useEffect(() => {
    if (!isModel || inCall) {
      stopIncomingCallAlert({ clearAlerted: true });
      return;
    }
    const pending = pendingQuery.data ?? [];
    syncIncomingCallQueue(pending.map((c) => c.id));
    for (const call of pending) {
      notifyNewIncomingCall(call.id, call.client.displayName);
    }
  }, [isModel, inCall, pendingQuery.data]);

  useEffect(() => () => stopIncomingCallAlert({ clearAlerted: true }), []);

  return (
    <>
      <VideoCallConfirmModal />
      {user?.role === 'CLIENT' && waitingCall?.status === 'PENDING' ? <VideoCallWaiting /> : null}
      {activeCall?.status === 'ACTIVE' ? (
        <VideoCallOverlay
          call={activeCall}
          isCaller={activeCall.client.userId === user?.id}
        />
      ) : null}
    </>
  );
}
