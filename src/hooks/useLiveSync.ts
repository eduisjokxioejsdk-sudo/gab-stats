import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMatchStore } from '@/store/matchStore';
import { useTrackingStore } from '@/store/trackingStore';
import type { Match } from '@/types/volleyball';

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function useLiveSync() {
  const match = useMatchStore((s) => s.match);
  const shareCodeRef = useRef<string | null>(null);
  const liveIdRef = useRef<string | null>(null);
  const syncingRef = useRef(false);

  // Create live match entry when match starts
  useEffect(() => {
    if (!match) {
      shareCodeRef.current = null;
      liveIdRef.current = null;
      return;
    }

    if (liveIdRef.current) return; // already created

    const code = generateShareCode();
    shareCodeRef.current = code;

    const createLive = async () => {
      const config = useTrackingStore.getState().config;
      const matchWithConfig = { ...JSON.parse(JSON.stringify(match)), trackingConfig: config };
      const { data, error } = await supabase
        .from('live_matches')
        .insert({ share_code: code, match_data: matchWithConfig })
        .select('id')
        .single();

      if (!error && data) {
        liveIdRef.current = data.id;
      } else {
        console.error('Failed to create live match:', error);
      }
    };

    createLive();
  }, [match?.id]);

  // Sync match data on every change
  useEffect(() => {
    if (!match || !liveIdRef.current || syncingRef.current) return;

    syncingRef.current = true;
    const id = liveIdRef.current;

    const sync = async () => {
      await supabase
        .from('live_matches')
        .update({ match_data: JSON.parse(JSON.stringify(match)) })
        .eq('id', id);
      syncingRef.current = false;
    };

    sync();
  }, [match]);

  return {
    shareCode: shareCodeRef.current,
    isLive: !!liveIdRef.current,
  };
}

export function useLiveWatch(shareCode: string | null) {
  const matchRef = useRef<Match | null>(null);
  const setMatch = useRef<((m: Match | null) => void) | null>(null);

  useEffect(() => {
    if (!shareCode) return;

    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('live_matches')
        .select('match_data')
        .eq('share_code', shareCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (data?.match_data) {
        matchRef.current = data.match_data as unknown as Match;
        setMatch.current?.(matchRef.current);
      }
    };

    fetchInitial();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`live-match-${shareCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_matches',
          filter: `share_code=eq.${shareCode.toUpperCase()}`,
        },
        (payload) => {
          const newData = payload.new as { match_data: unknown };
          if (newData?.match_data) {
            matchRef.current = newData.match_data as Match;
            setMatch.current?.(matchRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareCode]);

  return { matchRef, setMatchCallback: setMatch };
}
