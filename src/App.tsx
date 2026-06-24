import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Check, Trash2, Star, TrendingUp, AlertCircle, Plus, X, BarChart2, RotateCcw, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type PathChoice = 'future' | 'streamer';
type ScreenId =
  | 'intro' | 'waiver_home' | 'filter_te'
  | 'first_path' | 'second_path'
  | 'drop_choice' | 'roster_drop' | 'confirmation' | 'outro';

type TEPlayer = {
  id: number;
  name: string;
  pos: string;
  team: string;
  owned: number;
  pts: number;
  trend: string;
  rank?: number;
  highlight?: boolean;
};

// ─── Bengals palette ──────────────────────────────────────────────────────────
// Primary accent: #FB4F14 (Bengals orange)
// Background: #F8F7F4 (warm white)
// Surface: #FFFFFF
// Border: #E5E2DC

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_PLAYERS = [
  { id: 1, name: 'Marcus Webb', pos: 'WR', team: 'DAL', owned: 28, pts: 8.4, trend: '+2.1' },
  { id: 2, name: 'Devon Okafor', pos: 'RB', team: 'SF', owned: 34, pts: 11.2, trend: '+0.8' },
  { id: 3, name: 'Tyler Brandt', pos: 'TE', team: 'PHI', owned: 12, pts: 3.1, trend: '+5.4' },
  { id: 4, name: 'Jordan Reyes', pos: 'QB', team: 'KC', owned: 41, pts: 22.7, trend: '-1.2' },
  { id: 5, name: 'Calvin Morrow', pos: 'WR', team: 'MIA', owned: 19, pts: 7.8, trend: '+3.3' },
  { id: 6, name: 'Darius Knox', pos: 'TE', team: 'BUF', owned: 8, pts: 2.4, trend: '+1.9' },
  { id: 7, name: 'Elijah Stone', pos: 'RB', team: 'NYG', owned: 22, pts: 9.6, trend: '-0.4' },
  { id: 8, name: 'Nate Holloway', pos: 'TE', team: 'DEN', owned: 6, pts: 1.8, trend: '+2.2' },
];

const TE_ALL = [
  { id: 3, name: 'Tyler Brandt', pos: 'TE', team: 'PHI', owned: 12, pts: 3.1, trend: '+5.4' },
  { id: 6, name: 'Darius Knox', pos: 'TE', team: 'BUF', owned: 8, pts: 2.4, trend: '+1.9' },
  { id: 8, name: 'Nate Holloway', pos: 'TE', team: 'DEN', owned: 6, pts: 1.8, trend: '+2.2' },
  { id: 9, name: 'Quentin Park', pos: 'TE', team: 'LAR', owned: 5, pts: 1.6, trend: '+0.7' },
  { id: 10, name: 'Isaiah Ferrell', pos: 'TE', team: 'NE', owned: 4, pts: 1.1, trend: '+0.3' },
  { id: 11, name: 'Marcus Trent', pos: 'TE', team: 'ATL', owned: 3, pts: 0.8, trend: '+0.1' },
];

// Master lookup for all TE players referenced across both pools
const TE_PLAYER_DATA: Record<number, Omit<TEPlayer, 'rank' | 'highlight'>> = {
  3: { id: 3, name: 'Tyler Brandt', pos: 'TE', team: 'PHI', owned: 12, pts: 3.1, trend: '+5.4' },
  6: { id: 6, name: 'Darius Knox', pos: 'TE', team: 'BUF', owned: 8, pts: 2.4, trend: '+1.9' },
  8: { id: 8, name: 'Nate Holloway', pos: 'TE', team: 'DEN', owned: 6, pts: 1.8, trend: '+2.2' },
  9: { id: 9, name: 'Quentin Park', pos: 'TE', team: 'LAR', owned: 5, pts: 1.6, trend: '+0.7' },
};

// Future Value pool: Brandt(1), Knox(2), Holloway(3)
const INITIAL_FUTURE_POOL: TEPlayer[] = [
  { ...TE_PLAYER_DATA[3], rank: 1, highlight: true },
  { ...TE_PLAYER_DATA[6], rank: 2, highlight: false },
  { ...TE_PLAYER_DATA[8], rank: 3, highlight: false },
];

// Streamer pool: Knox(1), Holloway(2), Park(3)
const INITIAL_STREAMER_POOL: TEPlayer[] = [
  { ...TE_PLAYER_DATA[6], rank: 1, highlight: false },
  { ...TE_PLAYER_DATA[8], rank: 2, highlight: false },
  { ...TE_PLAYER_DATA[9], rank: 3, highlight: false },
];

const ROSTER = [
  { id: 20, name: 'Derek Faulk', pos: 'QB', team: 'GB', slot: 'QB', drop: false },
  { id: 21, name: 'Anthony Cruise', pos: 'RB', team: 'CIN', slot: 'RB', drop: false },
  { id: 22, name: 'Brayden Mills', pos: 'RB', team: 'NO', slot: 'RB', drop: false },
  { id: 23, name: 'Keion Wallace', pos: 'WR', team: 'SEA', slot: 'WR', drop: true },
  { id: 24, name: 'Trevon Ash', pos: 'WR', team: 'TEN', slot: 'WR', drop: false },
  { id: 25, name: 'Marcus Webb', pos: 'WR', team: 'DAL', slot: 'FLEX', drop: false },
  { id: 26, name: 'Cole Ramsey', pos: 'TE', team: 'CHI', slot: 'TE', drop: false },
  { id: 27, name: 'Ryan Spears', pos: 'K', team: 'LAC', slot: 'K', drop: false },
  { id: 28, name: 'Dallas D/ST', pos: 'D/ST', team: 'DAL', slot: 'D/ST', drop: false },
];

const SNAP_DATA = [
  { week: 'Wk4', pct: 38 },
  { week: 'Wk5', pct: 41 },
  { week: 'Wk6', pct: 44 },
  { week: 'Wk7', pct: 58 },
  { week: 'Wk8', pct: 71 },
  { week: 'Wk9', pct: 84 },
];

// ─── Deduplication ────────────────────────────────────────────────────────────
//
// When FV chosen first → updating Streamer pool → splice backfill at removed index
// When Streamer chosen first → updating FV pool → append backfill at end (rank 3)
//
function buildDeduplicatedPool(
  secondPool: TEPlayer[],
  selectedId: number,
  backfillPool: TEPlayer[],
  appendBackfillToEnd: boolean,
): TEPlayer[] {
  const removedIdx = secondPool.findIndex(p => p.id === selectedId);
  if (removedIdx === -1) return secondPool; // player not in second pool, no change

  const remaining = secondPool.filter(p => p.id !== selectedId);
  const remainingIds = new Set(remaining.map(p => p.id));
  const backfill = backfillPool.find(p => p.id !== selectedId && !remainingIds.has(p.id));

  let result: TEPlayer[];
  if (!backfill) {
    result = remaining;
  } else if (appendBackfillToEnd) {
    result = [...remaining, { ...backfill, highlight: false }];
  } else {
    const arr = [...remaining];
    arr.splice(removedIdx, 0, { ...backfill, highlight: false });
    result = arr;
  }

  return result.map((p, i) => ({ ...p, rank: i + 1 }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const POS_AVATAR_COLOR: Record<string, string> = {
  QB: 'bg-red-500',
  RB: 'bg-blue-500',
  WR: 'bg-amber-500',
  TE: 'bg-teal-600',
  K: 'bg-gray-500',
  'D/ST': 'bg-gray-500',
};

function Avatar({ name, pos, size = 'md' }: { name: string; pos?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const color = pos ? (POS_AVATAR_COLOR[pos] ?? 'bg-gray-500') : 'bg-gray-400';
  return (
    <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

function PosTag({ pos }: { pos: string }) {
  const map: Record<string, string> = {
    QB: 'bg-red-100 text-red-700',
    RB: 'bg-blue-100 text-blue-700',
    WR: 'bg-amber-100 text-amber-700',
    TE: 'bg-orange-100 text-orange-700',
    K: 'bg-gray-100 text-gray-600',
    'D/ST': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${map[pos] ?? 'bg-gray-100 text-gray-600'}`}>
      {pos}
    </span>
  );
}

function useCardSelectPulse(onActivate: () => void, enabled: boolean) {
  const [pulsing, setPulsing] = useState(false);

  const handleClick = () => {
    if (!enabled) return;
    setPulsing(false);
    requestAnimationFrame(() => setPulsing(true));
    onActivate();
  };

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLElement>) => {
    if (e.animationName === 'cardSelectPulse') setPulsing(false);
  };

  return { pulsing, handleClick, handleAnimationEnd };
}

function PlayerRow({ player, rank, highlighted, selectable, selected, onSelect }: {
  player: { id: number; name: string; pos: string; team: string; owned: number; pts: number; trend: string; rank?: number; highlight?: boolean };
  rank?: number;
  highlighted?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const isHighlighted = highlighted ?? player.highlight;
  const isEmphasized = isHighlighted || selected;
  const { pulsing, handleClick, handleAnimationEnd } = useCardSelectPulse(
    () => onSelect?.(),
    !!selectable,
  );
  return (
    <div
      onClick={selectable ? handleClick : undefined}
      onAnimationEnd={selectable ? handleAnimationEnd : undefined}
      style={isHighlighted ? { border: '1.5px solid #FB4F14', background: '#FFF5F0' } :
             selected ? { border: '1.5px solid #FB4F14', background: '#FFF5F0' } :
             { border: '1px solid #E5E2DC', background: '#FFFFFF' }}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-[background-color,border-color,box-shadow] duration-200 ${
        selectable ? 'cursor-pointer' : 'cursor-default'
      } ${isHighlighted ? 'shadow-md' : ''} ${pulsing ? 'card-select-pulse' : ''}`}
    >
      {rank !== undefined && (
        <div
          style={selected ? { background: '#FB4F14', color: '#fff' } : rank === 1 && !selectable ? { background: '#FB4F14', color: '#fff' } : { background: '#F0EDE8', color: '#888' }}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        >
          {rank}
        </div>
      )}
      <Avatar name={player.name} pos={player.pos} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate text-gray-900 ${isEmphasized ? 'text-base' : 'text-sm'}`}>
            {player.name}
          </span>
          {isHighlighted && <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FB4F14', fill: '#FB4F14' }} />}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <PosTag pos={player.pos} />
          <span className="text-gray-500 text-xs">{player.team}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-500 text-xs">{player.owned}% owned</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-bold text-gray-900 ${isEmphasized ? 'text-base' : 'text-sm'}`}>
          {player.pts} <span className="text-gray-400 text-xs font-normal">pts</span>
        </div>
        <div className={`text-xs font-medium ${player.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
          {player.trend}
        </div>
      </div>
    </div>
  );
}

const BUBBLE_ANIM_MS = 600;
const AI_BUBBLE_CLS = 'rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed bg-gray-100 text-gray-800 border border-gray-200';

// Captured synchronously before a screen change so the next ChatPanel can read it on mount.
let pendingOutgoingMessage: React.ReactNode | null = null;
let activeBubbleMessage: React.ReactNode | null = null;

function AnimatedBubbleBody({
  message,
  messageKey,
  bubbleClassName,
  bubbleStyle,
  crossScreenOutgoing,
}: {
  message: React.ReactNode;
  messageKey?: string | number;
  bubbleClassName: string;
  bubbleStyle?: React.CSSProperties;
  crossScreenOutgoing?: React.ReactNode | null;
}) {
  const stableKey = messageKey ?? (typeof message === 'string' ? message : null);
  const [localOutgoing, setLocalOutgoing] = useState<React.ReactNode | null>(null);
  const [enterNonce, setEnterNonce] = useState(() => (crossScreenOutgoing ? 1 : 0));
  const prevKeyRef = useRef(stableKey);
  const displayedMessageRef = useRef(message);

  const outgoing = crossScreenOutgoing ?? localOutgoing;

  useEffect(() => {
    if (stableKey === prevKeyRef.current) {
      displayedMessageRef.current = message;
      return;
    }
    setLocalOutgoing(displayedMessageRef.current);
    displayedMessageRef.current = message;
    prevKeyRef.current = stableKey;
    setEnterNonce(n => n + 1);
    const timer = setTimeout(() => setLocalOutgoing(null), BUBBLE_ANIM_MS);
    return () => clearTimeout(timer);
  }, [stableKey, message]);

  return (
    <div className="chat-bubble-stack">
      {outgoing !== null && (
        <div
          className={`${bubbleClassName} chat-bubble-exit`}
          style={bubbleStyle}
        >
          {outgoing}
        </div>
      )}
      <div
        key={enterNonce}
        className={`${bubbleClassName} chat-bubble-enter`}
        style={bubbleStyle}
      >
        {message}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  messageKey,
  isAI = true,
  outgoingMessage,
}: {
  message: React.ReactNode;
  messageKey?: string | number;
  isAI?: boolean;
  outgoingMessage?: React.ReactNode | null;
}) {
  useEffect(() => {
    activeBubbleMessage = message;
  }, [message]);

  if (isAI) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: '#FB4F14' }} />
          <span className="text-[11px] font-semibold text-gray-500 tracking-wide">AI Insight</span>
        </div>
        <div className="chat-bubble-clip">
          <AnimatedBubbleBody
            message={message}
            messageKey={messageKey}
            bubbleClassName={AI_BUBBLE_CLS}
            crossScreenOutgoing={outgoingMessage}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="chat-bubble-clip">
        <AnimatedBubbleBody
          message={message}
          messageKey={messageKey}
          bubbleClassName="rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed text-white font-medium"
          bubbleStyle={{ background: '#FB4F14' }}
          crossScreenOutgoing={outgoingMessage}
        />
      </div>
    </div>
  );
}

function ChatPanel({ message, actions }: { message: React.ReactNode; actions: React.ReactNode }) {
  const [outgoingMessage, setOutgoingMessage] = useState<React.ReactNode | null>(
    () => pendingOutgoingMessage,
  );

  useEffect(() => {
    pendingOutgoingMessage = null;
    if (outgoingMessage === null) return;
    const timer = setTimeout(() => setOutgoingMessage(null), BUBBLE_ANIM_MS);
    return () => clearTimeout(timer);
  }, []); // mount: consume pending outgoing and schedule removal

  const renderedMessage =
    outgoingMessage !== null && React.isValidElement(message)
      ? React.cloneElement(message as React.ReactElement<{ outgoingMessage?: React.ReactNode | null }>, {
          outgoingMessage,
        })
      : message;

  return (
    <div
      className="flex-shrink-0 bg-white px-4 pt-3 pb-4 flex flex-col justify-between overflow-visible"
      style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.10)', height: 264 }}
    >
      <div className="overflow-visible relative z-0">{renderedMessage}</div>
      <div className="chat-panel-actions flex flex-col gap-2">{actions}</div>
    </div>
  );
}

// Primary CTA — glowing pulse. Accepts an optional color override for distinct choices.
function LiveButton({ label, onClick, fullWidth, color = '#FB4F14', disabled = false, pulseGlow = false }: {
  label: string;
  onClick?: () => void;
  fullWidth?: boolean;
  color?: string;
  disabled?: boolean;
  pulseGlow?: boolean;
}) {
  if (disabled) {
    return (
      <button
        disabled
        className={`${fullWidth ? 'w-full' : 'px-4'} py-2.5 rounded-full text-sm font-semibold text-gray-400 border border-gray-200 bg-gray-100 cursor-default select-none`}
      >
        {label}
      </button>
    );
  }
  return (
    <div className={`relative${fullWidth ? ' w-full' : ''}`}>
      {!pulseGlow && (
        <div
          className="absolute inset-0 rounded-full animate-pulse opacity-40 blur-sm"
          style={{ background: color }}
        />
      )}
      <button
        onClick={onClick}
        style={{ background: color }}
        className={`relative${fullWidth ? ' w-full' : ' px-4'} py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-150 active:scale-95${pulseGlow ? ' start-demo-glow' : ' shadow-md'}`}
      >
        {label}
      </button>
    </div>
  );
}

// Disabled placeholder button — visual filler for locked options
function DeadButton({ label, fullWidth }: { label: string; fullWidth?: boolean }) {
  return (
    <button
      disabled
      className={`${fullWidth ? 'w-full' : 'px-4'} py-2.5 rounded-full text-sm font-medium text-gray-500 border border-gray-300 bg-white cursor-default select-none`}
      style={{ opacity: 0.75 }}
    >
      {label}
    </button>
  );
}

// Clickable secondary button — lower visual weight than LiveButton
function SecondaryButton({ label, onClick, fullWidth }: { label: string; onClick: () => void; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? 'w-full' : 'px-4'} py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 bg-white transition-all active:bg-gray-50`}
    >
      {label}
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function SnapModal({ onClose }: { onClose: () => void }) {
  const max = Math.max(...SNAP_DATA.map(d => d.pct));
  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div
        className="relative bg-white rounded-t-3xl w-full p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Tyler Brandt — Snap %</h3>
            <p className="text-xs text-gray-500">Last 6 weeks · PHI TE</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-end gap-2 h-28 mb-2">
          {SNAP_DATA.map(d => (
            <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-700">{d.pct}%</span>
              <div className="w-full rounded-t-sm" style={{
                height: `${(d.pct / max) * 80}px`,
                background: d.week === 'Wk9' ? '#FB4F14' : '#FFD4C0',
              }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          {SNAP_DATA.map(d => (
            <div key={d.week} className="flex-1 text-center text-[10px] text-gray-400 font-medium">{d.week}</div>
          ))}
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 flex items-start gap-2 mb-4">
          <BarChart2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FB4F14' }} />
          <p className="text-xs text-gray-700 leading-relaxed">
            Snap % has jumped <span className="font-bold text-gray-900">+46 pts</span> over the last 3 weeks — from 38% to 84%. That&apos;s a starter-level workload entering a month with no competition.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function InjuryModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div
        className="relative bg-white rounded-t-3xl w-full p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Injury Report</h3>
            <p className="text-xs text-gray-500">PHI · Cole Pennington · TE</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Cole Pennington</span>
              <span className="text-[10px] font-bold bg-red-100 text-red-600 rounded px-1.5 py-0.5">OUT 4 WEEKS</span>
            </div>
            <span className="text-xs text-gray-500">High ankle sprain · Wk9–Wk12</span>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed mb-3">
          <p><span className="font-bold">Injury:</span> High ankle sprain (right), suffered Week 8 vs. NYG. Classified as non-surgical.</p>
          <p className="mt-1.5"><span className="font-bold">Timeline:</span> Expected to miss 4 weeks (Wk9–Wk12). IR designation placed Wednesday.</p>
          <p className="mt-1.5"><span className="font-bold">Opportunity:</span> Tyler Brandt steps in as the clear #1 TE with no other depth on the roster. He ran 100% of TE snaps in the second half of Week 8.</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 flex items-start gap-2 mb-4">
          <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FB4F14' }} />
          <p className="text-xs text-gray-700 font-medium">Brandt is the <span className="font-bold text-gray-900">clear beneficiary</span> for at minimum 4 weeks.</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 bg-gray-50 active:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function ScreenIntro({ advance }: { advance: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center">
      <div className="mb-6">
        <img
          src="/images/image copy.png"
          alt="Helmet"
          className="mx-auto mb-4"
          style={{ width: 96, height: 96, objectFit: 'contain' }}
        />
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
          Fantasy Football App<br />with AI Assist
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">
          A concept demo showing how AI can guide real-time roster decisions through conversational insight.
        </p>
      </div>

      <div className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 mb-6 text-left shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scenario</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          It&rsquo;s Week 9. You&rsquo;re fighting for a playoff spot. Your AI assistant has already spotted something that needs your attention.
        </p>
      </div>

      <LiveButton label="Start Demo" onClick={advance} pulseGlow />

      <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
        Tap the glowing button to advance through each screen.
      </p>
    </div>
  );
}

// Screen 1 — Waiver Home
function Screen1({ advance }: { advance: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Waiver Wire</h1>
            <p className="text-xs font-semibold" style={{ color: '#FB4F14' }}>Week 9 · Available Players</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5 border border-gray-200">
            <span className="text-xs text-gray-600 font-medium">All Positions</span>
          </div>
        </div>
        <SectionLabel label="Top Available" />
        <div className="flex flex-col gap-2">
          {[...ALL_PLAYERS].sort((a, b) => b.pts - a.pts).map(p => <PlayerRow key={p.id} player={p} />)}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message="Your only Tight End's on a bye this week. Want to tackle that plan first?" />}
        actions={<LiveButton label="Explore the plan." onClick={advance} fullWidth />}
      />
    </div>
  );
}

// Screen 2 — Filter TEs: two equal-weight path choices
function Screen2({ onChoice }: { onChoice: (choice: PathChoice) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Waiver Wire</h1>
            <p className="text-xs font-semibold" style={{ color: '#FB4F14' }}>Filtering: TE · Week 9</p>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border"
            style={{ background: '#FFF5F0', borderColor: '#FFCAB0' }}
          >
            <span className="text-xs font-bold" style={{ color: '#FB4F14' }}>TE</span>
          </div>
        </div>
        <SectionLabel label="Available TEs" />
        <div className="flex flex-col gap-2">
          {TE_ALL.map(p => <PlayerRow key={p.id} player={p} />)}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message="Are you feeling a future value guy that could blossom into a starter, or a high ceiling streamer play?" />}
        actions={<>
          <LiveButton label="Future value" onClick={() => onChoice('future')} fullWidth />
          <LiveButton label="Streamer" onClick={() => onChoice('streamer')} fullWidth color="#D9480F" />
        </>}
      />
    </div>
  );
}

// Future Value ranked-card screen — used as both first and second path
function ScreenFutureValue({
  pool,
  selectedId,
  onSelectId,
  isFirstPath,
  onConfirm,
  onSkip,
}: {
  pool: TEPlayer[];
  selectedId: number;
  onSelectId: (id: number) => void;
  isFirstPath: boolean;
  onConfirm: () => void;
  onSkip?: () => void;
}) {
  const [snapOpen, setSnapOpen] = useState(false);
  const [injuryOpen, setInjuryOpen] = useState(false);

  return (
    <div className="flex flex-col h-full relative">
      {snapOpen && <SnapModal onClose={() => setSnapOpen(false)} />}
      {injuryOpen && <InjuryModal onClose={() => setInjuryOpen(false)} />}
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">TE Recommendations</h1>
            <p className="text-xs font-semibold" style={{ color: '#FB4F14' }}>Future Value · Top 3</p>
          </div>
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1 border"
            style={{ background: '#FFF5F0', borderColor: '#FFCAB0' }}
          >
            <TrendingUp className="w-3 h-3" style={{ color: '#FB4F14' }} />
            <span className="text-xs font-bold" style={{ color: '#FB4F14' }}>Ranked</span>
          </div>
        </div>
        <SectionLabel label="AI Picks" />
        <div className="flex flex-col gap-2">
          {pool.map(p => (
            <PlayerRow
              key={p.id}
              player={{ ...p, highlight: p.id === selectedId }}
              rank={p.rank}
              highlighted={p.id === selectedId}
              selectable
              selected={p.id === selectedId}
              onSelect={() => onSelectId(p.id)}
            />
          ))}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message={isFirstPath
          ? (
            <span>
              Brandt&rsquo;s my clear top pick. His{' '}
              <button
                onClick={() => setSnapOpen(true)}
                className="underline underline-offset-2 font-semibold cursor-pointer"
                style={{ color: '#FB4F14' }}
              >
                snap percentage
              </button>
              {' '}is on the rise, and the starting Tight End in front of him just got a{' '}
              <button
                onClick={() => setInjuryOpen(true)}
                className="underline underline-offset-2 font-semibold cursor-pointer"
                style={{ color: '#FB4F14' }}
              >
                4 week injury
              </button>
              . He&rsquo;s about to get a real shot.
            </span>
          )
          : "Solid. Brandt's stock is on the rise — queue him as a fallback in case your first pick doesn't slip to your #7 waiver spot."
        } />}
        actions={<>
          <LiveButton label="Pickup Selected Player" onClick={onConfirm} fullWidth />
          {!isFirstPath && onSkip && (
            <SecondaryButton label="No thanks, continue to Drop Player" onClick={onSkip} fullWidth />
          )}
        </>}
      />
    </div>
  );
}

// Streamer ranked-card screen — used as both first and second path
function ScreenStreamer({
  pool,
  selectedId,
  onSelectId,
  isFirstPath,
  onConfirm,
  onSkip,
}: {
  pool: TEPlayer[];
  selectedId: number;
  onSelectId: (id: number) => void;
  isFirstPath: boolean;
  onConfirm: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Backup Options</h1>
            <p className="text-xs text-gray-500">Streamer · Pick One</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">TE Streamer</span>
          </div>
        </div>
        <SectionLabel label="Equal Value Picks" />
        <div className="flex flex-col gap-2">
          {pool.map((p, i) => (
            <PlayerRow
              key={p.id}
              player={p}
              rank={p.rank ?? i + 1}
              selectable
              selected={selectedId === p.id}
              onSelect={() => onSelectId(p.id)}
            />
          ))}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message={isFirstPath
          ? "These streamer options are pretty even — high floor this week. Pick the matchup you like best."
          : "That pickup might slip to you at your #7 waiver spot, but queue a backup just in case. Here are your next three best options."
        } />}
        actions={<>
          <LiveButton label="Pickup Selected Player" onClick={onConfirm} fullWidth />
          {!isFirstPath && onSkip && (
            <SecondaryButton label="No thanks, continue to Drop Player" onClick={onSkip} fullWidth />
          )}
        </>}
      />
    </div>
  );
}

// Drop Choice screen — only shown when 2 TEs are queued
function Screen5({ onSame, onDifferent, queuedTEs }: {
  onSame: () => void;
  onDifferent: () => void;
  queuedTEs: TEPlayer[];
}) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div className="px-4 pt-1 pb-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Waiver Queue</h1>
            <p className="text-xs font-semibold" style={{ color: '#FB4F14' }}>{queuedTEs.length} TEs queued</p>
          </div>
        </div>
        <SectionLabel label="Queued Adds" />
        <div className="flex flex-col gap-2">
          {queuedTEs.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#F0EDE8', color: '#888' }}
              >
                {i + 1}
              </div>
              <Avatar name={p.name} pos={p.pos} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                  <PosTag pos={p.pos} />
                </div>
                <span className="text-xs text-gray-500">{p.team} · #{i + 1} Priority</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message="Two Tight Ends ready to queue. Drop the same player for both, or a different one for each?" />}
        actions={<>
          <LiveButton label="Drop the same player for both" onClick={onSame} fullWidth />
          <SecondaryButton label="Drop different player for each" onClick={onDifferent} fullWidth />
        </>}
      />
    </div>
  );
}

// Roster Drop screen — all players tappable; AI recommends Wallace but user can override
function RosterDropRow({
  player,
  isSelected,
  isAiPick,
  isTaken,
  onSelect,
}: {
  player: typeof ROSTER[number];
  isSelected: boolean;
  isAiPick: boolean;
  isTaken: boolean;
  onSelect: () => void;
}) {
  const { pulsing, handleClick, handleAnimationEnd } = useCardSelectPulse(onSelect, !isTaken);

  return (
    <div
      onClick={!isTaken ? handleClick : undefined}
      onAnimationEnd={!isTaken ? handleAnimationEnd : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-[background-color,border-color,box-shadow] duration-200 ${isTaken ? 'opacity-40 cursor-default' : 'cursor-pointer'} ${pulsing ? 'card-select-pulse' : ''}`}
      style={isSelected
        ? { background: '#FFF0EE', borderColor: '#FB4F14', boxShadow: '0 1px 4px rgba(251,79,20,0.15)' }
        : { background: '#FFFFFF', borderColor: '#E5E2DC' }}
    >
      <span
        className="text-[10px] font-bold w-10 flex-shrink-0"
        style={{ color: isSelected ? '#FB4F14' : '#9CA3AF' }}
      >
        {player.slot}
      </span>
      <Avatar name={player.name} pos={player.pos} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-semibold truncate ${isSelected ? 'text-base text-gray-900' : 'text-sm text-gray-700'}`}>
            {player.name}
          </span>
          {isAiPick && isSelected && !isTaken && (
            <span
              className="flex-shrink-0 text-[9px] font-bold rounded px-1 py-0.5 uppercase tracking-wide"
              style={{ background: '#FFEBE5', color: '#FB4F14', border: '1px solid #FFCAB0' }}
            >
              AI Pick
            </span>
          )}
          {isTaken && (
            <span className="flex-shrink-0 text-[9px] font-bold rounded px-1 py-0.5 uppercase tracking-wide bg-gray-100 text-gray-400 border border-gray-200">
              Already dropping
            </span>
          )}
        </div>
        <span className={`text-xs ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>{player.team}</span>
      </div>
      {isSelected && !isTaken && <Trash2 className="w-4 h-4 flex-shrink-0" style={{ color: '#FB4F14' }} />}
    </div>
  );
}

function Screen6({ advance, forTEName, passIndex, alreadyDroppedId }: {
  advance: (selectedId: number) => void;
  forTEName?: string;
  passIndex?: number; // 0 = first pass, 1 = second pass; undefined = single-drop flow
  alreadyDroppedId?: number;
}) {
  const aiPickId = ROSTER.find(p => p.drop)!.id;
  const isSecondPass = passIndex === 1;
  const [selectedDropId, setSelectedDropId] = useState<number | null>(isSecondPass ? null : aiPickId);

  const wizardMessage = passIndex === 0 && forTEName
    ? `Got it — I'll walk you through each one separately. Who are you dropping to make room for ${forTEName}?`
    : passIndex === 1 && forTEName
    ? `And who are you dropping for ${forTEName}?`
    : (
      <span>
        Based on your roster and bye weeks, I&rsquo;d drop{' '}
        <span className="font-bold text-gray-900">Keion Wallace</span>
        . Slow start, and the rookie behind him is about to take his workload.
      </span>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Your Roster</h1>
            <p className="text-xs text-gray-500">
              {forTEName ? `Dropping for: ${forTEName}` : 'Select a player to drop'}
            </p>
          </div>
        </div>
        <SectionLabel label="Current Roster" />
        <div className="flex flex-col gap-1.5">
          {ROSTER.map(p => (
            <RosterDropRow
              key={p.id}
              player={p}
              isSelected={selectedDropId !== null && p.id === selectedDropId}
              isAiPick={p.id === aiPickId && !isSecondPass}
              isTaken={p.id === alreadyDroppedId}
              onSelect={() => setSelectedDropId(p.id)}
            />
          ))}
        </div>
      </div>

      <ChatPanel
        message={<ChatBubble message={wizardMessage} messageKey={passIndex ?? 'single'} />}
        actions={
          <LiveButton
            label="Drop Selected Player"
            onClick={() => selectedDropId !== null && advance(selectedDropId)}
            fullWidth
            disabled={selectedDropId === null}
          />
        }
      />
    </div>
  );
}

// Confirmation screen — handles 1 or 2 queued TEs
function Screen7({ advance, queuedTEs, dropAssignments, dropMode }: {
  advance: () => void;
  queuedTEs: TEPlayer[];
  dropAssignments: Record<number, number>;
  dropMode: 'same' | 'different';
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex-1 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#FFF5F0', border: '1.5px solid #FB4F14' }}
            >
              <Check className="w-4 h-4" style={{ color: '#FB4F14' }} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Waivers Queued!</h1>
          </div>
          <p className="text-xs text-gray-500 pl-9">Processes Wednesday at 3:00 AM ET</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3 shadow-sm">
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {queuedTEs.length} TE Waiver{queuedTEs.length !== 1 ? 's' : ''} Queued
            </span>
            <span className="text-xs font-bold" style={{ color: '#FB4F14' }}>PENDING</span>
          </div>
          {queuedTEs.map((te, i) => {
            const dropRosterId = dropAssignments[i] ?? dropAssignments[0];
            const dropRosterPlayer = ROSTER.find(r => r.id === dropRosterId) ?? ROSTER.find(r => r.drop)!;
            return (
              <div key={te.id} className={`px-3 pt-2.5 pb-3 ${i < queuedTEs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Priority #{i + 1}</span>
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {/* IN side */}
                  <div className="flex-1 px-3 py-2.5" style={{ background: '#F0FAF4' }}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: '#16A34A' }}>IN</div>
                    <div className="text-sm font-bold text-gray-900 leading-tight">{te.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{te.team} · {te.pos}</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px bg-gray-200 flex-shrink-0" />
                  {/* OUT side */}
                  <div className="flex-1 px-3 py-2.5 text-right" style={{ background: '#FFF5F5' }}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: '#DC2626' }}>OUT</div>
                    <div className="text-sm font-bold text-gray-900 leading-tight">{dropRosterPlayer.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{dropRosterPlayer.team} · {dropRosterPlayer.pos}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {queuedTEs.length > 1 && dropMode === 'same' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-gray-700">If priority #1 clears, #2 is automatically cancelled.</p>
          </div>
        )}
      </div>

      <ChatPanel
        message={<ChatBubble message="Nice. I also spotted a couple stud Wide Receivers on waiver, better than what's on your bench, no offense. Want a look?" />}
        actions={<>
          <LiveButton label="Yeah, show me." onClick={advance} fullWidth />
          <SecondaryButton label="No thanks, I'm done" onClick={advance} fullWidth />
        </>}
      />
    </div>
  );
}

function ScreenOutro({ restart }: { restart: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center">
      <div className="mb-6">
        <img
          src="/images/image copy.png"
          alt="Helmet"
          className="mx-auto mb-4"
          style={{ width: 96, height: 96, objectFit: 'contain' }}
        />
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
          End of Demo
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-[270px] mx-auto">
          Built with five tools, each chosen for a different phase of the work.
        </p>
      </div>

      <div className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 mb-5 text-left shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Built With</p>
        <div className="flex flex-col gap-2">
          {[
            'Claude — UX strategy, decision logic, and prompt authoring',
            'Bolt — rapid prototyping and state logic',
            'Figma AI — design critique and style exploration',
            'Cursor — micro-interaction polish and code edits',
            'GitHub — version control and Bolt-to-Cursor handoff',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FFF5F0', border: '1px solid #FFCAB0' }}>
                <Check className="w-2.5 h-2.5" style={{ color: '#FB4F14' }} />
              </div>
              <span className="text-xs text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={restart}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-all active:scale-95 shadow-md"
          style={{ background: '#FB4F14' }}
        >
          <RotateCcw className="w-4 h-4" />
          Restart Demo
        </button>

        <a
          href="https://woodsandrew.com/aiexploration/aiexploration"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium text-gray-600 border border-gray-300 bg-white transition-all active:bg-gray-50"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          More AI Explorations
        </a>
      </div>
    </div>
  );
}

// ─── Sidebar labels — order matches the two-branch flow ───────────────────────
const SCREEN_LABELS = [
  'Intro',
  'Waiver Home',
  'Filter TEs',
  'Future Value',
  'Streamer',
  'Drop Choice',
  'Roster Drop',
  'Confirmation',
  'End of Demo',
];

function getSidebarIndex(screen: ScreenId, firstChoice: PathChoice | null): number {
  switch (screen) {
    case 'intro':       return 0;
    case 'waiver_home': return 1;
    case 'filter_te':   return 2;
    case 'first_path':  return firstChoice === 'future' ? 3 : 4;
    case 'second_path': return firstChoice === 'future' ? 4 : 3;
    case 'drop_choice': return 5;
    case 'roster_drop': return 6;
    case 'confirmation':return 7;
    case 'outro':       return 8;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('intro');
  const [firstChoice, setFirstChoice] = useState<PathChoice | null>(null);

  // Per-pool selection state (persist across renders so taps are remembered)
  const [selectedFutureId, setSelectedFutureId] = useState<number>(3);   // Brandt default
  const [selectedStreamerId, setSelectedStreamerId] = useState<number>(6); // Knox default

  // What the user actually confirmed on each path (null = not yet / skipped)
  const [confirmedFuturePlayer, setConfirmedFuturePlayer] = useState<TEPlayer | null>(null);
  const [confirmedStreamerPlayer, setConfirmedStreamerPlayer] = useState<TEPlayer | null>(null);

  // Pools may be modified by deduplication after first-path confirmation
  const [futurePool, setFuturePool] = useState<TEPlayer[]>(INITIAL_FUTURE_POOL);
  const [streamerPool, setStreamerPool] = useState<TEPlayer[]>(INITIAL_STREAMER_POOL);

  // Drop flow state
  // dropMode: 'same' = single roster drop for both TEs; 'different' = two-pass
  const [dropMode, setDropMode] = useState<'same' | 'different'>('same');
  const [dropPassIndex, setDropPassIndex] = useState<0 | 1>(0); // which pass we're on in 'different' mode
  // dropAssignments: maps queuedTE index → roster player id that will be dropped
  const [dropAssignments, setDropAssignments] = useState<Record<number, number>>({});

  // Ordered list of confirmed picks for downstream screens
  const queuedTEs = [confirmedFuturePlayer, confirmedStreamerPlayer]
    .filter((p): p is TEPlayer => p !== null);

  const sidebarIndex = getSidebarIndex(currentScreen, firstChoice);

  const navigateToScreen = useCallback((screen: ScreenId) => {
    if (screen !== currentScreen && activeBubbleMessage != null) {
      pendingOutgoingMessage = activeBubbleMessage;
    }
    setCurrentScreen(screen);
  }, [currentScreen]);

  // ── Transitions ─────────────────────────────────────────────────────────────

  const handleFilterChoice = (choice: PathChoice) => {
    setFirstChoice(choice);
    navigateToScreen('first_path');
  };

  const handleFirstPathConfirm = () => {
    if (firstChoice === 'future') {
      const player = futurePool.find(p => p.id === selectedFutureId) ?? futurePool[0];
      setConfirmedFuturePlayer(player);
      // Deduplicate Streamer pool: splice backfill at the removed index
      const updated = buildDeduplicatedPool(streamerPool, selectedFutureId, futurePool, false);
      setStreamerPool(updated);
      setSelectedStreamerId(updated[0].id); // reset Streamer selection to new top pick
    } else {
      const player = streamerPool.find(p => p.id === selectedStreamerId) ?? streamerPool[0];
      setConfirmedStreamerPlayer(player);
      // Deduplicate FV pool: append backfill at rank 3
      const updated = buildDeduplicatedPool(futurePool, selectedStreamerId, streamerPool, true);
      setFuturePool(updated);
      setSelectedFutureId(updated[0].id); // reset FV selection to new top pick
    }
    navigateToScreen('second_path');
  };

  const handleSecondPathConfirm = () => {
    if (firstChoice === 'future') {
      const player = streamerPool.find(p => p.id === selectedStreamerId) ?? streamerPool[0];
      setConfirmedStreamerPlayer(player);
    } else {
      const player = futurePool.find(p => p.id === selectedFutureId) ?? futurePool[0];
      setConfirmedFuturePlayer(player);
    }
    // Two picks confirmed → show Drop Choice
    navigateToScreen('drop_choice');
  };

  const handleSecondPathSkip = () => {
    // One pick → skip Drop Choice, go straight to Roster Drop
    navigateToScreen('roster_drop');
  };

  const restart = () => {
    pendingOutgoingMessage = null;
    activeBubbleMessage = null;
    setCurrentScreen('intro');
    setFirstChoice(null);
    setSelectedFutureId(3);
    setSelectedStreamerId(6);
    setConfirmedFuturePlayer(null);
    setConfirmedStreamerPlayer(null);
    setFuturePool(INITIAL_FUTURE_POOL);
    setStreamerPool(INITIAL_STREAMER_POOL);
    setDropMode('same');
    setDropPassIndex(0);
    setDropAssignments({});
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderScreen = () => {
    switch (currentScreen) {
      case 'intro':
        return <ScreenIntro advance={() => navigateToScreen('waiver_home')} />;

      case 'waiver_home':
        return <Screen1 advance={() => navigateToScreen('filter_te')} />;

      case 'filter_te':
        return <Screen2 onChoice={handleFilterChoice} />;

      case 'first_path':
        return firstChoice === 'future'
          ? (
            <ScreenFutureValue
              pool={futurePool}
              selectedId={selectedFutureId}
              onSelectId={setSelectedFutureId}
              isFirstPath={true}
              onConfirm={handleFirstPathConfirm}
            />
          ) : (
            <ScreenStreamer
              pool={streamerPool}
              selectedId={selectedStreamerId}
              onSelectId={setSelectedStreamerId}
              isFirstPath={true}
              onConfirm={handleFirstPathConfirm}
            />
          );

      case 'second_path':
        return firstChoice === 'future'
          ? (
            <ScreenStreamer
              pool={streamerPool}
              selectedId={selectedStreamerId}
              onSelectId={setSelectedStreamerId}
              isFirstPath={false}
              onConfirm={handleSecondPathConfirm}
              onSkip={handleSecondPathSkip}
            />
          ) : (
            <ScreenFutureValue
              pool={futurePool}
              selectedId={selectedFutureId}
              onSelectId={setSelectedFutureId}
              isFirstPath={false}
              onConfirm={handleSecondPathConfirm}
              onSkip={handleSecondPathSkip}
            />
          );

      case 'drop_choice':
        return (
          <Screen5
            queuedTEs={queuedTEs}
            onSame={() => {
              setDropMode('same');
              navigateToScreen('roster_drop');
            }}
            onDifferent={() => {
              setDropMode('different');
              setDropPassIndex(0);
              setDropAssignments({});
              navigateToScreen('roster_drop');
            }}
          />
        );

      case 'roster_drop': {
        if (dropMode === 'different') {
          const teName = queuedTEs[dropPassIndex]?.name ?? '';
          const alreadyDroppedId = dropPassIndex === 1 ? dropAssignments[0] : undefined;
          return (
            <Screen6
              key={dropPassIndex}
              forTEName={teName}
              passIndex={dropPassIndex}
              alreadyDroppedId={alreadyDroppedId}
              advance={(selectedId) => {
                const updated = { ...dropAssignments, [dropPassIndex]: selectedId };
                setDropAssignments(updated);
                if (dropPassIndex === 0) {
                  setDropPassIndex(1);
                  // stay on roster_drop — React will re-render with new passIndex
                } else {
                  navigateToScreen('confirmation');
                }
              }}
            />
          );
        }
        return (
          <Screen6
            advance={(selectedId) => {
              setDropAssignments({ 0: selectedId, 1: selectedId });
              navigateToScreen('confirmation');
            }}
          />
        );
      }

      case 'confirmation':
        return <Screen7 advance={() => navigateToScreen('outro')} queuedTEs={queuedTEs} dropAssignments={dropAssignments} dropMode={dropMode} />;

      case 'outro':
        return <ScreenOutro restart={restart} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EDE8' }}>
      {/* Desktop left label */}
      <div className="hidden sm:flex flex-col items-center mr-8 gap-2">
        <div className="text-gray-400 text-xs font-medium uppercase tracking-widest">Waiver Wire</div>
        <div className="text-gray-400 text-xs">AI Assistant</div>
        <div className="w-px h-16 bg-gray-300 mt-2" />
        <div className="text-gray-400 text-[10px] mt-1">Prototype</div>
      </div>

      {/* Phone frame */}
      <div className="relative w-[375px] flex-shrink-0">
        <div
          className="rounded-[44px] overflow-hidden shadow-2xl"
          style={{
            border: '3px solid #2A2A2A',
            background: '#F8F7F4',
            boxShadow: '0 32px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1" style={{ background: '#F8F7F4' }}>
            <span className="text-gray-900 text-xs font-semibold">9:41</span>
            <div className="w-24 h-5 rounded-full absolute left-1/2 -translate-x-1/2 top-2" style={{ background: '#2A2A2A' }} />
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5 items-end">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className={`w-1 rounded-sm ${i < 3 ? 'bg-gray-800' : 'bg-gray-400'}`} style={{ height: h }} />
                ))}
              </div>
              <div className="text-gray-700 text-[10px] ml-0.5">●●</div>
              <div className="w-5 h-2.5 border border-gray-700 rounded-sm relative ml-0.5">
                <div className="absolute inset-0.5 rounded-sm w-3/4" style={{ background: '#2A2A2A' }} />
                <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-0.5 h-1 bg-gray-600 rounded-r" />
              </div>
            </div>
          </div>

          {/* Screen content — fixed height */}
          <div
            className="overflow-hidden flex flex-col"
            style={{ height: 652, background: '#F8F7F4' }}
          >
            {renderScreen()}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-2" style={{ background: '#F8F7F4' }}>
            <div className="w-28 h-1 rounded-full" style={{ background: '#C8C4BE' }} />
          </div>
        </div>
      </div>

      {/* Desktop right: flow progress */}
      <div className="hidden sm:flex flex-col items-start ml-8 gap-4 max-w-[180px]">
        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Flow Progress</div>
        <div className="flex flex-col gap-1.5">
          {SCREEN_LABELS.map((label, i) => i > sidebarIndex ? null : (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs transition-all ${
                i === sidebarIndex ? 'font-semibold' : 'text-gray-400'
              }`}
              style={i === sidebarIndex ? { color: '#FB4F14' } : {}}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: i === sidebarIndex ? '#FB4F14' : '#C8C4BE',
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
