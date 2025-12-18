/**
 * PvP Game Screen - Main game view for 1v1 PvP matches
 * Integrates with existing GameScene and adds PvP-specific features
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameScene from '@/components/game/GameScene';
import PvPHUD from '@/components/PvPHUD';
import DisconnectionOverlay, { ReconnectionOverlay } from '@/components/DisconnectionOverlay';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/context';
import {
  onGameStart,
  onGameState,
  onPlayerFinished,
  onPlayerDied,
  onGamePaused,
  onGameResumed,
  onGameFinished,
  sendReady,
  sendFinished,
  sendPlayerDied,
  disconnectPvPSocket
} from '@/services/pvpSocket';
import { EntityInterpolation } from '@/multiplayer/EntityInterpolation';
import { PlayerState, GameStatePacket } from '../../../shared/types/pvp.types';

export default function PvPGameScreen() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, reset } = useGame();

  const [gameStarted, setGameStarted] = useState(false);
  const [opponentState, setOpponentState] = useState<PlayerState | null>(null);
  const [yourSoldiers, setYourSoldiers] = useState(0);
  const [opponentSoldiers, setOpponentSoldiers] = useState(0);
  const [yourProgress, setYourProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [maxTime, setMaxTime] = useState(150); // Default 150 seconds
  const [opponentName, setOpponentName] = useState('Opponent');
  const [opponentSkin, setOpponentSkin] = useState('default');
  const [yourSkin, setYourSkin] = useState('default');
  const [trackSeed, setTrackSeed] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [disconnectedPlayer, setDisconnectedPlayer] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(3);

  const interpolator = useRef(new EntityInterpolation());
  const hasFinished = useRef(false);

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/pvp/lobby');
      return;
    }

    // Get match data from session storage (set by lobby screen)
    const matchDataStr = sessionStorage.getItem(`pvp_match_${roomId}`);
    if (matchDataStr) {
      try {
        const matchData = JSON.parse(matchDataStr);
        // Determine which player we are based on user ID comparison
        const isPlayer1 = matchData.player1.opponent.userId !== user._id;
        const ourPayload = isPlayer1 ? matchData.player1 : matchData.player2;
        const theirPayload = isPlayer1 ? matchData.player2 : matchData.player1;

        setYourSkin(ourPayload.yourSkin);
        setOpponentSkin(ourPayload.opponentSkin);
        setTrackSeed(ourPayload.trackSeed.toString());
        setOpponentName(ourPayload.opponent.username);

        console.log('[PvP Game] Loaded match data:', {
          isPlayer1,
          yourSkin: ourPayload.yourSkin,
          opponentSkin: ourPayload.opponentSkin,
          opponentName: ourPayload.opponent.username
        });
      } catch (e) {
        console.error('[PvP Game] Failed to parse match data:', e);
      }
    }

    // Send ready signal
    sendReady(roomId);
    console.log('[PvP Game] Sent ready signal for room:', roomId);

    // Listen for game start
    const unsubStart = onGameStart((data) => {
      console.log('[PvP Game] Game started!', data);
      setGameStarted(true);
    });

    // Listen for game state updates (30 times/sec)
    const unsubState = onGameState((state: GameStatePacket) => {
      setGameTime(state.gameTime);

      // Determine which player is you and which is opponent
      const isPlayer1 = state.player1.userId === user._id;
      const yourState = isPlayer1 ? state.player1 : state.player2;
      const oppState = isPlayer1 ? state.player2 : state.player1;

      // Update your stats
      setYourSoldiers(yourState.soldiers);
      setYourProgress(yourState.progress);

      // Update opponent stats
      setOpponentSoldiers(oppState.soldiers);
      setOpponentProgress(oppState.progress);
      setOpponentName(oppState.username);

      // Add opponent state to interpolation buffer
      interpolator.current.addState(oppState, Date.now());

      // Get interpolated state for smooth rendering
      const interpolatedState = interpolator.current.getInterpolatedState(Date.now());
      setOpponentState(interpolatedState);
    });

    // Listen for player finished
    const unsubFinished = onPlayerFinished((data) => {
      console.log('[PvP Game] Player finished:', data);
      if (data.userId === user._id) {
        hasFinished.current = true;
      }
    });

    // Listen for player died
    const unsubDied = onPlayerDied((data) => {
      console.log('[PvP Game] Player died:', data);
    });

    // Listen for game paused (disconnection)
    const unsubPaused = onGamePaused((data) => {
      console.log('[PvP Game] Game paused:', data);
      setIsPaused(true);
      setDisconnectedPlayer(data.userId === user._id ? 'You' : opponentName);
    });

    // Listen for game resumed
    const unsubResumed = onGameResumed((data) => {
      console.log('[PvP Game] Game resumed:', data);
      setReconnecting(true);
      setReconnectCountdown(data.seconds);

      // Countdown
      let count = data.seconds;
      const interval = setInterval(() => {
        count -= 1;
        setReconnectCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setReconnecting(false);
          setIsPaused(false);
          setDisconnectedPlayer(null);
        }
      }, 1000);
    });

    // Listen for game finished
    const unsubGameFinished = onGameFinished((result) => {
      console.log('[PvP Game] Game finished:', result);
      // Navigate to results after short delay
      setTimeout(() => {
        navigate(`/pvp/results/${roomId}`);
      }, 2000);
    });

    // Cleanup
    return () => {
      unsubStart();
      unsubState();
      unsubFinished();
      unsubDied();
      unsubPaused();
      unsubResumed();
      unsubGameFinished();
      interpolator.current.clear();
    };
  }, [roomId, user, navigate, opponentName]);

  // Handle game events from GameContext
  useEffect(() => {
    if (status === 'finished' && !hasFinished.current && roomId) {
      // Player finished the track
      hasFinished.current = true;
      // Get completion time and soldiers from game context
      // This would need to be exposed by GameContext
      const completionTime = Date.now() - gameTime; // Simplified
      sendFinished(roomId, completionTime, yourSoldiers);
    }

    if (status === 'gameover' && roomId) {
      // Player died
      sendPlayerDied(roomId);
    }
  }, [status, roomId, gameTime, yourSoldiers]);

  // Handle forfeit on disconnect timeout
  const handleForfeit = () => {
    console.log('[PvP Game] Forfeit by timeout');
    navigate(`/pvp/results/${roomId}`);
  };

  // Handle reconnect
  const handleReconnect = () => {
    console.log('[PvP Game] Opponent reconnected');
    setIsPaused(false);
    setDisconnectedPlayer(null);
  };

  if (!user || !roomId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden touch-none no-select">
      {/* 3D Game Scene with PvP mode */}
      <GameScene
        mode="1v1"
        trackSeed={trackSeed}
        opponentState={opponentState}
        opponentSkin={opponentSkin}
      />

      {/* PvP HUD */}
      <PvPHUD
        yourSoldiers={yourSoldiers}
        opponentSoldiers={opponentSoldiers}
        yourProgress={yourProgress}
        opponentProgress={opponentProgress}
        gameTime={gameTime}
        maxTime={maxTime}
        opponentName={opponentName}
        connectionQuality="good"
      />

      {/* Disconnection Overlay */}
      {isPaused && disconnectedPlayer && !reconnecting && (
        <DisconnectionOverlay
          isVisible={true}
          disconnectedPlayer={disconnectedPlayer}
          onReconnect={handleReconnect}
          onForfeit={handleForfeit}
        />
      )}

      {/* Reconnection Overlay */}
      {reconnecting && (
        <ReconnectionOverlay countdown={reconnectCountdown} />
      )}

      {/* Pre-game countdown */}
      {!gameStarted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-white text-6xl font-bold animate-pulse">
            Get Ready...
          </div>
        </div>
      )}
    </div>
  );
}
