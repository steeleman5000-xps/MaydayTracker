import { Link } from 'react-router-dom';
import type { Matchup, Player, Round, AppConfig, WagerType } from '../types';
import { calcMatchResult } from '../lib/scoring';

interface Props {
  matchup: Matchup;
  playerA: Player;
  playerB: Player;
  round: Round;
  config: AppConfig;
  playerA2?: Player;
  playerB2?: Player;
  showLink?: boolean;
}

export default function MatchCard({
  matchup, playerA, playerB, round, config,
  playerA2, playerB2, showLink = true,
}: Props) {
  const result = calcMatchResult(matchup, playerA, playerB, round.strokeIndexes, playerA2, playerB2);
  const isFourball = matchup.format === 'fourball';

  function statusColor() {
    if (result.holesPlayed === 0) return 'text-slate-400';
    if (result.isComplete && result.winner === null) return 'text-yellow-400';
    if (result.winner === 'A' || (!result.isComplete && result.teamAHolesUp > 0)) return 'text-blue-400';
    if (result.winner === 'B' || (!result.isComplete && result.teamAHolesUp < 0)) return 'text-red-400';
    return 'text-slate-300';
  }

  function statusLabel() {
    if (result.holesPlayed === 0) return 'Not started';
    const leaderName = result.teamAHolesUp > 0
      ? playerA.name.split(' ')[0]
      : result.teamAHolesUp < 0
      ? playerB.name.split(' ')[0]
      : null;

    if (result.isComplete) {
      if (result.winner === 'A') return `${playerA.name.split(' ')[0]} wins ${result.status}`;
      if (result.winner === 'B') return `${playerB.name.split(' ')[0]} wins ${result.status}`;
      return 'Halved';
    }
    return leaderName ? `${leaderName} ${result.status}` : 'All Square';
  }

  const thruText = !result.isComplete && result.holesPlayed > 0
    ? `thru ${result.holesPlayed}`
    : result.isComplete && result.holesPlayed > 0 ? 'Final' : '';

  const wagerLabels: Record<WagerType, string> = {
    money: '$',
    drinks: 'Drinks',
    bragging_rights: 'Pride',
    custom: 'Bet',
  };

  function hdcpLine() {
    if (isFourball) {
      const { a1, a2, b1, b2 } = result.strokes;
      const parts = [
        a1 > 0 ? `${playerA.name.split(' ')[0]} +${a1}` : null,
        a2 > 0 && playerA2 ? `${playerA2.name.split(' ')[0]} +${a2}` : null,
        b1 > 0 ? `${playerB.name.split(' ')[0]} +${b1}` : null,
        b2 > 0 && playerB2 ? `${playerB2.name.split(' ')[0]} +${b2}` : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Scratch match';
    }
    const { a1, b1 } = result.strokes;
    if (a1 > 0) return `${playerA.name.split(' ')[0]} +${a1}`;
    if (b1 > 0) return `${playerB.name.split(' ')[0]} +${b1}`;
    return 'Scratch match';
  }

  const inner = (
    <div className="card hover:border-slate-600 transition-colors">
      {/* Format badge */}
      <div className="flex items-center gap-2 mb-2">
        {matchup.teeTime && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium">
            {formatTime(matchup.teeTime)}
          </span>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          isFourball ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'
        }`}>
          {isFourball ? 'Fourball' : 'Singles'}
        </span>
        {matchup.manualResult && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 font-medium">
            Manual
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Team A */}
          <div>
            <span className="font-semibold text-blue-400">
              {playerA.name}{playerA2 ? ` & ${playerA2.name}` : ''}
            </span>
            <span className="text-slate-500 font-normal text-xs ml-1">
              ({config.teamAName})
              {isFourball && playerA2
                ? ` HCP ${playerA.handicap}/${playerA2.handicap}`
                : ` HCP ${playerA.handicap}`}
            </span>
          </div>
          {/* Team B */}
          <div>
            <span className="font-semibold text-red-400">
              {playerB.name}{playerB2 ? ` & ${playerB2.name}` : ''}
            </span>
            <span className="text-slate-500 font-normal text-xs ml-1">
              ({config.teamBName})
              {isFourball && playerB2
                ? ` HCP ${playerB.handicap}/${playerB2.handicap}`
                : ` HCP ${playerB.handicap}`}
            </span>
          </div>
          <span className="text-slate-500 text-xs mt-0.5">{hdcpLine()}</span>
          {matchup.matchWager && (
            <span className="text-yellow-300 text-xs mt-0.5">
              Match wager: {wagerLabels[matchup.matchWager.type]} {matchup.matchWager.amount}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="text-right shrink-0">
          <div className={`font-bold text-sm ${statusColor()}`}>{statusLabel()}</div>
          {thruText && <div className="text-slate-500 text-xs">{thruText}</div>}
          {result.isComplete && (
            <div className="text-xs mt-0.5">
              <span className="text-blue-400">{result.pointsA}</span>
              <span className="text-slate-500"> – </span>
              <span className="text-red-400">{result.pointsB}</span>
            </div>
          )}
        </div>
      </div>

      {showLink && (
        <div className="mt-2 pt-2 border-t border-slate-700 text-right">
          <span className="text-emerald-400 text-xs font-medium">Score →</span>
        </div>
      )}
    </div>
  );

  if (!showLink) return inner;
  return <Link to={`/match/${matchup.id}`}>{inner}</Link>;
}

function formatTime(time: string): string {
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
