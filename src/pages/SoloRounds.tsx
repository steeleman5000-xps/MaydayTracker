import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from 'firebase/auth';
import Layout from '../components/Layout';
import type {
  GolfCourseApiCourse,
  GolfCourseTeeBox,
  Player,
  SavedCourse,
  SavedCourseTeeBox,
  SoloRound,
} from '../types';
import {
  addSoloRound,
  deleteSoloRound,
  subscribePlayers,
  subscribeSavedCourses,
  subscribeSoloRounds,
  updateSoloHoleScore,
  updateSoloRound,
} from '../lib/db';
import { subscribeAuth } from '../lib/auth';
import { getGolfCourse, searchGolfCourses } from '../lib/golfCourses';
import { DEFAULT_LOGO_URL } from '../lib/tripAssets';
import { getSoloHoleComment } from '../lib/holeComments';

type SoloRoundDraft = Omit<
  SoloRound,
  'id' | 'playerId' | 'authUid' | 'playerName' | 'scores' | 'status' | 'createdAt' | 'updatedAt'
>;

interface SoloRoundSummary {
  holesPlayed: number;
  gross: number;
  parTotal: number;
  toPar: number;
  netEstimate: number | null;
}

interface SoloRoundEntry {
  round: SoloRound;
  handicap: number;
  summary: SoloRoundSummary;
}

interface SoloLeaderboardRow {
  key: string;
  playerName: string;
  rounds: number;
  totalHoles: number;
  avgGross: number;
  bestGross: number;
  avgNet: number | null;
  bestNet: number | null;
  avgToPar: number;
  bestToPar: number;
  lastPlayedAt: string;
  lastCourse: string;
}

const DEFAULT_SI = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function SoloRounds() {
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [soloRounds, setSoloRounds] = useState<SoloRound[]>([]);
  const [loaded, setLoaded] = useState({ auth: false, players: false, courses: false, rounds: false });
  const [draft, setDraft] = useState<SoloRoundDraft>(() => blankDraft());
  const [courseQuery, setCourseQuery] = useState('');
  const [courseResults, setCourseResults] = useState<GolfCourseApiCourse[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [selectedApiCourse, setSelectedApiCourse] = useState<GolfCourseApiCourse | null>(null);
  const [selectedApiTeeKey, setSelectedApiTeeKey] = useState('');
  const [selectedSavedCourseId, setSelectedSavedCourseId] = useState('');
  const [selectedSavedTeeId, setSelectedSavedTeeId] = useState('');
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'burn' | 'compliment'>('burn');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeAuth((nextUser) => {
        setUser(nextUser);
        setLoaded((prev) => ({ ...prev, auth: true }));
      }),
      subscribePlayers((nextPlayers) => {
        setPlayers(nextPlayers);
        setLoaded((prev) => ({ ...prev, players: true }));
      }),
      subscribeSavedCourses((nextCourses) => {
        setSavedCourses(nextCourses);
        setLoaded((prev) => ({ ...prev, courses: true }));
      }),
      subscribeSoloRounds((nextRounds) => {
        setSoloRounds(nextRounds);
        setLoaded((prev) => ({ ...prev, rounds: true }));
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const player = useMemo(() => {
    if (!user) return null;
    const userEmail = user.email?.toLowerCase();
    return (
      players.find((p) => p.authUid === user.uid) ??
      players.find((p) => p.email?.toLowerCase() === userEmail) ??
      null
    );
  }, [players, user]);

  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const myRounds = useMemo(() => {
    if (!player && !user) return [];
    return soloRounds
      .filter((round) => round.playerId === player?.id || round.authUid === user?.uid)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [player, soloRounds, user]);

  const activeRound = useMemo(() => {
    const selectedRound = activeRoundId
      ? myRounds.find((round) => round.id === activeRoundId && round.status !== 'complete')
      : null;
    if (selectedRound) return selectedRound;
    return myRounds.find((round) => round.status === 'active') ?? null;
  }, [activeRoundId, myRounds]);

  const completedRoundEntries = useMemo<SoloRoundEntry[]>(() => {
    return soloRounds
      .filter((round) => round.status === 'complete')
      .map((round) => {
        const handicap = playersById.get(round.playerId)?.handicap ?? 0;
        return {
          round,
          handicap,
          summary: summarizeRound(round, handicap),
        };
      })
      .filter((entry) => entry.summary.holesPlayed > 0)
      .sort((a, b) => b.round.createdAt - a.round.createdAt);
  }, [playersById, soloRounds]);

  const fullCompletedRoundEntries = useMemo(
    () => completedRoundEntries.filter((entry) => entry.summary.holesPlayed === 18),
    [completedRoundEntries]
  );

  const leaderboardRows = useMemo(
    () => buildSoloLeaderboard(fullCompletedRoundEntries),
    [fullCompletedRoundEntries]
  );

  const recentCompletedRounds = completedRoundEntries.slice(0, 10);
  const leaderboardLeader = leaderboardRows[0] ?? null;
  const mostRounds = leaderboardRows
    .slice()
    .sort((a, b) => b.rounds - a.rounds || (a.avgNet ?? 999) - (b.avgNet ?? 999))[0] ?? null;
  const bestGross = leaderboardRows
    .slice()
    .sort((a, b) => a.bestGross - b.bestGross || (a.bestNet ?? 999) - (b.bestNet ?? 999))[0] ?? null;
  const maxLeaderboardRounds = Math.max(1, ...leaderboardRows.map((row) => row.rounds));

  useEffect(() => {
    if (!activeRound) {
      setLocalScores({});
      return;
    }
    setActiveRoundId(activeRound.id);
    setLocalScores(Object.fromEntries(
      Array.from({ length: 18 }, (_, index) => {
        const hole = index + 1;
        const score = activeRound.scores?.[hole];
        return [hole, score != null ? String(score) : ''];
      })
    ));
  }, [activeRound]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loading = !loaded.auth || !loaded.players || !loaded.courses || !loaded.rounds;
  const selectedSavedCourse = savedCourses.find((course) => course.id === selectedSavedCourseId);

  async function handleCourseSearch() {
    if (!courseQuery.trim()) return;
    setCourseLoading(true);
    setCourseError(null);
    try {
      setCourseResults(await searchGolfCourses(courseQuery.trim()));
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Course search failed');
    } finally {
      setCourseLoading(false);
    }
  }

  async function selectApiCourse(course: GolfCourseApiCourse) {
    setCourseLoading(true);
    setCourseError(null);
    try {
      const detail = await getGolfCourse(course.id);
      setSelectedApiCourse(detail);
      setSelectedSavedCourseId('');
      setSelectedSavedTeeId('');
      const firstTee = getApiTeeOptions(detail)[0];
      if (firstTee) {
        setSelectedApiTeeKey(firstTee.key);
        applyApiTee(detail, firstTee.gender, firstTee.tee);
      }
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Could not load course details');
    } finally {
      setCourseLoading(false);
    }
  }

  function selectApiTee(key: string) {
    setSelectedApiTeeKey(key);
    if (!selectedApiCourse) return;
    const option = getApiTeeOptions(selectedApiCourse).find((tee) => tee.key === key);
    if (option) applyApiTee(selectedApiCourse, option.gender, option.tee);
  }

  function selectSavedCourse(courseId: string) {
    setSelectedSavedCourseId(courseId);
    setSelectedApiCourse(null);
    setSelectedApiTeeKey('');
    const course = savedCourses.find((item) => item.id === courseId);
    const firstTee = course?.tees[0];
    if (course && firstTee) {
      setSelectedSavedTeeId(firstTee.id);
      applySavedTee(course, firstTee);
    } else {
      setSelectedSavedTeeId('');
    }
  }

  function selectSavedTee(teeId: string) {
    setSelectedSavedTeeId(teeId);
    const tee = selectedSavedCourse?.tees.find((item) => item.id === teeId);
    if (selectedSavedCourse && tee) applySavedTee(selectedSavedCourse, tee);
  }

  async function startRound(e: React.FormEvent) {
    e.preventDefault();
    if (!player || !user) return;
    if (!draft.courseName.trim()) {
      setError('Choose a course and tee box before starting a solo round.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const now = Date.now();
      const id = await addSoloRound(cleanSoloRoundPayload({
        ...draft,
        courseName: draft.courseName.trim(),
        playerId: player.id,
        authUid: user.uid,
        playerName: player.name,
        scores: {},
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }));
      setActiveRoundId(id);
      setDraft(blankDraft());
      setCourseQuery('');
      setCourseResults([]);
      setSelectedApiCourse(null);
      setSelectedApiTeeKey('');
      setSelectedSavedCourseId('');
      setSelectedSavedTeeId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start solo round');
    } finally {
      setSaving(false);
    }
  }

  async function changeScore(round: SoloRound, hole: number, raw: string) {
    const value = raw.replace(/[^0-9]/g, '').slice(0, 2);
    setLocalScores((prev) => ({ ...prev, [hole]: value }));
    const score = value ? Number(value) : null;
    setSaving(true);
    try {
      await updateSoloHoleScore(round.id, hole, score);
      const par = round.pars?.[hole - 1] ?? 4;
      if (score != null && score > par) {
        setToastTone('burn');
      } else if (score != null && score < par) {
        setToastTone('compliment');
      }
      const firstName = round.playerName.split(' ')[0] || 'You';
      setToast(score == null ? null : getSoloHoleComment(firstName, score, par));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save score');
    } finally {
      setSaving(false);
    }
  }

  async function markComplete(round: SoloRound) {
    setSaving(true);
    await updateSoloRound(round.id, { status: 'complete', updatedAt: Date.now() });
    setActiveRoundId(null);
    setExpandedRoundId(null);
    setSaving(false);
  }

  async function reopenRound(round: SoloRound) {
    setSaving(true);
    await updateSoloRound(round.id, { status: 'active', updatedAt: Date.now() });
    setActiveRoundId(round.id);
    setExpandedRoundId(null);
    setSaving(false);
  }

  async function removeRound(round: SoloRound) {
    if (!confirm(`Delete solo round at ${round.courseName}?`)) return;
    await deleteSoloRound(round.id);
    if (activeRoundId === round.id) setActiveRoundId(null);
    if (expandedRoundId === round.id) setExpandedRoundId(null);
  }

  function applyApiTee(course: GolfCourseApiCourse, gender: 'male' | 'female', tee: GolfCourseTeeBox) {
    const holes = tee.holes ?? [];
    const completeHoles = holes.length >= 18 ? holes.slice(0, 18) : [];
    setDraft((current) => ({
      ...current,
      courseName: formatApiCourseName(course),
      courseApiId: course.id,
      savedCourseId: undefined,
      courseClubName: course.club_name,
      teeName: tee.tee_name,
      teeGender: gender,
      courseRating: tee.course_rating,
      slopeRating: tee.slope_rating,
      courseBrandColor: current.courseBrandColor || '#0f766e',
      pars: completeHoles.length ? completeHoles.map((hole) => hole.par) : undefined,
      yardages: completeHoles.length ? completeHoles.map((hole) => hole.yardage) : undefined,
      strokeIndexes: completeHoles.length ? completeHoles.map((hole) => hole.handicap) : current.strokeIndexes,
    }));
  }

  function applySavedTee(course: SavedCourse, tee: SavedCourseTeeBox) {
    const completeHoles = tee.holes.length >= 18 ? tee.holes.slice(0, 18) : [];
    setDraft((current) => ({
      ...current,
      courseName: formatSavedCourseName(course),
      courseApiId: undefined,
      savedCourseId: course.id,
      courseClubName: course.clubName,
      teeName: tee.teeName,
      teeGender: tee.gender,
      courseRating: tee.courseRating,
      slopeRating: tee.slopeRating,
      courseLogoUrl: course.logoUrl || current.courseLogoUrl,
      courseBrandColor: course.brandColor || current.courseBrandColor || '#0f766e',
      pars: completeHoles.length ? completeHoles.map((hole) => hole.par) : undefined,
      yardages: completeHoles.length ? completeHoles.map((hole) => hole.yardage) : undefined,
      strokeIndexes: completeHoles.length ? completeHoles.map((hole) => hole.handicap) : current.strokeIndexes,
    }));
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center text-slate-400">Loading solo mode...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black">Solo Rounds</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in before tracking personal rounds.</p>
          </div>
          <div className="card text-center">
            <p className="text-slate-300">Solo mode uses your Mayday player profile so your score history stays tied to you.</p>
            <Link to="/my-player" className="btn-primary mt-4 inline-block">Sign In</Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black">Solo Rounds</h1>
            <p className="mt-1 text-sm text-slate-400">No Mayday player is linked to {user.email} yet.</p>
          </div>
          <div className="card">
            <p className="text-slate-300">Ask an admin to add your email to your player row, then come back here.</p>
            <Link to="/my-player" className="btn-secondary mt-4 inline-block">Back to My Player</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const activeSummary = activeRound ? summarizeRound(activeRound, player.handicap) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Solo Rounds</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track your non-Mayday rounds, save history, and let the app heckle bad holes in real time.
          </p>
        </div>

        <div className="card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Start Solo Round</h2>
              <p className="text-xs text-slate-500">Playing as {player.name} · HCP {player.handicap}</p>
            </div>
            {draft.courseName && (
              <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-200">
                {draft.courseName}
              </span>
            )}
          </div>

          <form onSubmit={startRound} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
              <div>
                <label className="label">Date Played</label>
                <input
                  className="input"
                  type="date"
                  value={draft.playedAt}
                  onChange={(e) => setDraft({ ...draft, playedAt: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Course Name</label>
                <input
                  className="input"
                  value={draft.courseName}
                  placeholder="Select from API or saved courses"
                  onChange={(e) => setDraft({ ...draft, courseName: e.target.value })}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-3">
              <div>
                <label className="label">Search GolfCourseAPI</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Course name or club name..."
                    value={courseQuery}
                    onChange={(e) => setCourseQuery(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={courseLoading || !courseQuery.trim()}
                    onClick={handleCourseSearch}
                  >
                    {courseLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {courseError && (
                <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
                  {courseError}
                </div>
              )}

              {courseResults.length > 0 && (
                <div className="space-y-2">
                  {courseResults.slice(0, 5).map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left hover:border-emerald-600"
                      onClick={() => selectApiCourse(course)}
                    >
                      <div className="font-semibold text-white">{course.club_name}</div>
                      <div className="text-xs text-slate-400">
                        {course.course_name}
                        {course.location?.city || course.location?.state
                          ? ` · ${[course.location.city, course.location.state].filter(Boolean).join(', ')}`
                          : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedApiCourse && getApiTeeOptions(selectedApiCourse).length > 0 && (
                <div>
                  <label className="label">API Tee Box</label>
                  <select
                    className="input"
                    value={selectedApiTeeKey}
                    onChange={(e) => selectApiTee(e.target.value)}
                  >
                    {getApiTeeOptions(selectedApiCourse).map(({ key, gender, tee }) => (
                      <option key={key} value={key}>
                        {tee.tee_name} ({gender}) · {tee.total_yards ?? '-'} yards · {tee.course_rating ?? '-'} / {tee.slope_rating ?? '-'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {savedCourses.length > 0 && (
                <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 space-y-3">
                  <div>
                    <label className="label">Use Saved Course</label>
                    <select
                      className="input"
                      value={selectedSavedCourseId}
                      onChange={(e) => selectSavedCourse(e.target.value)}
                    >
                      <option value="">Choose from local course library</option>
                      {savedCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {formatSavedCourseName(course)}
                          {course.location?.city || course.location?.state
                            ? ` · ${[course.location.city, course.location.state].filter(Boolean).join(', ')}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSavedCourse && (
                    <div>
                      <label className="label">Saved Tee Box</label>
                      <select
                        className="input"
                        value={selectedSavedTeeId}
                        onChange={(e) => selectSavedTee(e.target.value)}
                      >
                        {selectedSavedCourse.tees.map((tee) => (
                          <option key={tee.id} value={tee.id}>
                            {tee.teeName} · {tee.totalYards} yards · par {tee.parTotal}
                            {tee.courseRating && tee.slopeRating ? ` · ${tee.courseRating} / ${tee.slopeRating}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {draft.pars && draft.yardages && (
              <div className="overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full min-w-[580px] text-xs">
                  <tbody>
                    <SetupRow label="Hole" values={Array.from({ length: 18 }, (_, index) => index + 1)} />
                    <SetupRow label="Par" values={draft.pars} />
                    <SetupRow label="Yds" values={draft.yardages} />
                    <SetupRow label="HCP" values={draft.strokeIndexes} />
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            )}

            <button className="btn-primary w-full" disabled={saving || !draft.courseName.trim()}>
              {saving ? 'Saving...' : 'Start Round'}
            </button>
          </form>
        </div>

        <section className="card">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Solo Leaderboard</h2>
              <p className="text-xs text-slate-500">
                Completed 18-hole solo rounds from everyone in the crew.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
              {fullCompletedRoundEntries.length} posted rounds
            </span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <LeaderboardCallout
              label="Top Dawg"
              value={leaderboardLeader ? `#1 ${leaderboardLeader.playerName}` : '-'}
              detail={leaderboardLeader ? `Best net ${formatScore(leaderboardLeader.bestNet)} · avg ${formatScore(leaderboardLeader.avgNet)}` : 'Post a completed round to claim it.'}
            />
            <LeaderboardCallout
              label="Best Gross"
              value={bestGross ? `${bestGross.bestGross}` : '-'}
              detail={bestGross ? `${bestGross.playerName} · ${bestGross.rounds} round${bestGross.rounds === 1 ? '' : 's'}` : 'No full cards yet.'}
            />
            <LeaderboardCallout
              label="Ironman"
              value={mostRounds ? `${mostRounds.rounds}` : '-'}
              detail={mostRounds ? `${mostRounds.playerName} completed rounds` : 'No one has enough receipts yet.'}
            />
          </div>

          {leaderboardRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400">
              No completed 18-hole solo rounds yet. Once players mark rounds complete, this board ranks by best net, then average net.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Rank</th>
                    <th className="px-3 py-2 text-left">Player</th>
                    <th className="px-3 py-2 text-center">Rounds</th>
                    <th className="px-3 py-2 text-center">Best Net</th>
                    <th className="px-3 py-2 text-center">Avg Net</th>
                    <th className="px-3 py-2 text-center">Best Gross</th>
                    <th className="px-3 py-2 text-center">Avg +/-</th>
                    <th className="px-3 py-2 text-left">Last Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardRows.map((row, index) => (
                    <tr key={row.key} className="border-t border-slate-700">
                      <td className="px-3 py-3">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                          index === 0 ? 'bg-amber-400 text-slate-950' : index === 1 ? 'bg-slate-300 text-slate-950' : index === 2 ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-white">{row.playerName}</div>
                        <div className="mt-1 h-1.5 w-28 rounded-full bg-slate-800">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400"
                            style={{ width: `${Math.max(10, (row.rounds / maxLeaderboardRounds) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-white">{row.rounds}</td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-300">{formatScore(row.bestNet)}</td>
                      <td className="px-3 py-3 text-center">{formatScore(row.avgNet)}</td>
                      <td className="px-3 py-3 text-center">{row.bestGross}</td>
                      <td className="px-3 py-3 text-center">{formatToPar(Math.round(row.avgToPar * 10) / 10)}</td>
                      <td className="px-3 py-3 text-slate-400">
                        <div>{formatDate(row.lastPlayedAt)}</div>
                        <div className="max-w-[12rem] truncate text-xs text-slate-500">{row.lastCourse}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {activeRound && activeSummary && (
          <div className="card">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeRound.courseLogoUrl || DEFAULT_LOGO_URL}
                  alt={activeRound.courseName}
                  className="h-12 w-12 rounded bg-white object-contain p-1"
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {activeRound.status === 'complete' ? 'Completed Round' : 'Active Round'}
                  </div>
                  <h2 className="text-lg font-bold">{activeRound.courseName}</h2>
                  <p className="text-xs text-slate-400">
                    {formatDate(activeRound.playedAt)} · {activeRound.teeName ?? 'Tee TBD'}
                    {activeRound.courseRating && activeRound.slopeRating ? ` · ${activeRound.courseRating} / ${activeRound.slopeRating}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div className="font-black text-white">{activeSummary.gross || '-'} gross</div>
                <div>{formatToPar(activeSummary.toPar)}</div>
                <div>{activeSummary.holesPlayed}/18 holes</div>
                {saving && <div className="text-emerald-300">saving...</div>}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="Gross" value={activeSummary.gross || '-'} />
              <Metric label="To Par" value={formatToPar(activeSummary.toPar)} />
              <Metric label="Net Est." value={activeSummary.netEstimate ?? '-'} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="py-1 text-left">Hole</th>
                    <th className="py-1 text-center">Par</th>
                    <th className="py-1 text-center">Yds</th>
                    <th className="py-1 text-center">HCP</th>
                    <th className="py-1 text-center">Score</th>
                    <th className="py-1 text-center">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 18 }, (_, index) => {
                    const hole = index + 1;
                    const par = activeRound.pars?.[index] ?? 4;
                    const score = activeRound.scores?.[hole];
                    const diff = score != null ? score - par : null;
                    return (
                      <tr key={hole} className="border-t border-slate-700">
                        <td className="py-2 text-slate-400">{hole}</td>
                        <td className="py-2 text-center">{par}</td>
                        <td className="py-2 text-center text-slate-400">{activeRound.yardages?.[index] ?? '-'}</td>
                        <td className="py-2 text-center text-slate-500">{activeRound.strokeIndexes[index] ?? '-'}</td>
                        <td className="py-2 text-center">
                          <input
                            className="score-input"
                            type="number"
                            min="1"
                            max="15"
                            inputMode="numeric"
                            placeholder="-"
                            value={localScores[hole] ?? ''}
                            disabled={activeRound.status === 'complete'}
                            onChange={(e) => changeScore(activeRound, hole, e.target.value)}
                          />
                        </td>
                        <td className={`py-2 text-center font-bold ${diff == null ? 'text-slate-600' : diff <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {diff == null ? '-' : formatToPar(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-2">
              {activeRound.status === 'complete' ? (
                <button className="btn-secondary flex-1" disabled={saving} onClick={() => reopenRound(activeRound)}>
                  Reopen
                </button>
              ) : (
                <button className="btn-primary flex-1" disabled={saving || activeSummary.holesPlayed === 0} onClick={() => markComplete(activeRound)}>
                  Mark Complete
                </button>
              )}
              <button className="btn-danger" disabled={saving} onClick={() => removeRound(activeRound)}>
                Delete
              </button>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">My Rounds</h2>
              <p className="text-xs text-slate-500">Resume, review, or delete accidental starts.</p>
            </div>
            <span className="text-xs text-slate-500">{myRounds.length} rounds</span>
          </div>
          {myRounds.length === 0 && (
            <div className="card text-sm text-slate-400">
              No solo rounds yet. Start one above and the history will build itself.
            </div>
          )}
          {myRounds.map((round) => {
            const summary = summarizeRound(round, player.handicap);
            return (
              <article
                key={round.id}
                className={`card ${
                  activeRound?.id === round.id ? 'border-emerald-700' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-semibold text-white">{round.courseName}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase ${
                        round.status === 'complete'
                          ? 'border-emerald-700 bg-emerald-950 text-emerald-200'
                          : 'border-orange-700 bg-orange-950 text-orange-200'
                      }`}>
                        {round.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDate(round.playedAt)} · {round.teeName ?? 'Tee TBD'} · {summary.holesPlayed}/18 holes
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-black text-white">{summary.gross || '-'}</div>
                    <div className="text-xs text-slate-400">{formatToPar(summary.toPar)}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={() => {
                      if (round.status === 'complete') {
                        setExpandedRoundId((current) => current === round.id ? null : round.id);
                        setActiveRoundId(null);
                      } else {
                        setActiveRoundId(round.id);
                        setExpandedRoundId(null);
                      }
                    }}
                  >
                    {round.status === 'complete'
                      ? expandedRoundId === round.id ? 'Hide Card' : 'View Card'
                      : 'Resume'}
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-sm"
                    disabled={saving}
                    onClick={() => removeRound(round)}
                  >
                    Delete
                  </button>
                </div>
                {expandedRoundId === round.id && (
                  <div className="mt-4 border-t border-slate-700 pt-4">
                    <SoloRoundCardTable round={round} />
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Completed Round Feed</h2>
              <p className="text-xs text-slate-500">Recent posted solo rounds from everyone.</p>
            </div>
            <span className="text-xs text-slate-500">{completedRoundEntries.length} cards</span>
          </div>
          {recentCompletedRounds.length === 0 ? (
            <div className="card text-sm text-slate-400">
              No completed solo rounds have been posted yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentCompletedRounds.map(({ round, summary }) => (
                <article key={round.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{round.playerName}</div>
                      <div className="mt-1 truncate text-sm text-slate-300">{round.courseName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(round.playedAt)} · {round.teeName ?? 'Tee TBD'} · {summary.holesPlayed}/18 holes
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xl font-black text-white">{summary.gross || '-'}</div>
                      <div className="text-xs text-slate-400">
                        net {summary.netEstimate ?? '-'} · {formatToPar(summary.toPar)}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div
          className="fixed bottom-4 left-3 right-3 z-50 cursor-pointer"
          onClick={() => setToast(null)}
        >
          <div className={`rounded-xl border-2 bg-slate-900 p-4 shadow-2xl ${
            toastTone === 'compliment' ? 'border-emerald-500' : 'border-orange-500'
          }`}>
            <div className={`mb-2 text-center text-xs font-bold uppercase tracking-widest ${
              toastTone === 'compliment' ? 'text-emerald-400' : 'text-orange-400'
            }`}>
              Solo Hole Report
            </div>
            <p className="text-center text-sm leading-snug text-white">{toast}</p>
            <p className="mt-2 text-center text-xs text-slate-500">tap to dismiss</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

function blankDraft(): SoloRoundDraft {
  return {
    playedAt: new Date().toISOString().slice(0, 10),
    courseName: '',
    strokeIndexes: [...DEFAULT_SI],
  };
}

function getApiTeeOptions(course: GolfCourseApiCourse): Array<{
  key: string;
  gender: 'male' | 'female';
  tee: GolfCourseTeeBox;
}> {
  const options: Array<{ key: string; gender: 'male' | 'female'; tee: GolfCourseTeeBox }> = [];
  (['male', 'female'] as const).forEach((gender) => {
    course.tees?.[gender]?.forEach((tee, index) => {
      options.push({ key: `${gender}-${index}`, gender, tee });
    });
  });
  return options;
}

function formatApiCourseName(course: GolfCourseApiCourse): string {
  if (course.course_name && course.course_name !== course.club_name) {
    return `${course.club_name} - ${course.course_name}`;
  }
  return course.club_name || course.course_name;
}

function formatSavedCourseName(course: SavedCourse): string {
  if (course.courseName && course.courseName !== course.clubName) {
    return `${course.clubName} - ${course.courseName}`;
  }
  return course.clubName;
}

function buildSoloLeaderboard(entries: SoloRoundEntry[]): SoloLeaderboardRow[] {
  const groups = new Map<string, {
    playerName: string;
    rounds: number;
    totalHoles: number;
    grossScores: number[];
    netScores: number[];
    toPars: number[];
    lastPlayedAt: string;
    lastCourse: string;
    lastCreatedAt: number;
  }>();

  entries.forEach(({ round, summary }) => {
    const key = round.playerId || round.authUid || round.playerName;
    const current = groups.get(key) ?? {
      playerName: round.playerName,
      rounds: 0,
      totalHoles: 0,
      grossScores: [],
      netScores: [],
      toPars: [],
      lastPlayedAt: round.playedAt,
      lastCourse: round.courseName,
      lastCreatedAt: 0,
    };

    current.rounds += 1;
    current.totalHoles += summary.holesPlayed;
    current.grossScores.push(summary.gross);
    current.toPars.push(summary.toPar);
    if (summary.netEstimate != null) current.netScores.push(summary.netEstimate);
    if ((round.updatedAt ?? round.createdAt) > current.lastCreatedAt) {
      current.lastCreatedAt = round.updatedAt ?? round.createdAt;
      current.lastPlayedAt = round.playedAt;
      current.lastCourse = round.courseName;
    }
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      playerName: group.playerName,
      rounds: group.rounds,
      totalHoles: group.totalHoles,
      avgGross: roundToTenth(average(group.grossScores)),
      bestGross: Math.min(...group.grossScores),
      avgNet: group.netScores.length ? roundToTenth(average(group.netScores)) : null,
      bestNet: group.netScores.length ? Math.min(...group.netScores) : null,
      avgToPar: roundToTenth(average(group.toPars)),
      bestToPar: Math.min(...group.toPars),
      lastPlayedAt: group.lastPlayedAt,
      lastCourse: group.lastCourse,
    }))
    .sort((a, b) =>
      (a.bestNet ?? 999) - (b.bestNet ?? 999) ||
      (a.avgNet ?? 999) - (b.avgNet ?? 999) ||
      a.avgGross - b.avgGross ||
      b.rounds - a.rounds
    );
}

function summarizeRound(round: SoloRound, handicap: number): SoloRoundSummary {
  const scoredHoles = Array.from({ length: 18 }, (_, index) => {
    const hole = index + 1;
    const score = round.scores?.[hole];
    return typeof score === 'number'
      ? { score, par: round.pars?.[index] ?? 4 }
      : null;
  }).filter((item): item is { score: number; par: number } => item !== null);
  const gross = scoredHoles.reduce((total, item) => total + item.score, 0);
  const playedPars = scoredHoles.reduce((total, item) => total + item.par, 0);
  const toPar = scoredHoles.length ? gross - playedPars : 0;
  const netEstimate = scoredHoles.length === 18 ? Math.round((gross - handicap) * 10) / 10 : null;
  return {
    holesPlayed: scoredHoles.length,
    gross,
    parTotal: playedPars,
    toPar,
    netEstimate,
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatScore(value: number | null): string {
  if (value == null) return '-';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatToPar(value: number): string {
  if (value === 0) return 'E';
  return value > 0 ? `+${value}` : String(value);
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function SetupRow({ label, values }: { label: string; values: Array<string | number> }) {
  return (
    <tr className="border-t border-slate-700 first:border-t-0">
      <th className="px-2 py-1 text-left text-slate-500">{label}</th>
      {values.map((value, index) => (
        <td key={index} className="px-1 py-1 text-center">{value}</td>
      ))}
    </tr>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-3">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  );
}

function SoloRoundCardTable({ round }: { round: SoloRound }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="py-1 text-left">Hole</th>
            <th className="py-1 text-center">Par</th>
            <th className="py-1 text-center">Yds</th>
            <th className="py-1 text-center">HCP</th>
            <th className="py-1 text-center">Score</th>
            <th className="py-1 text-center">+/-</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 18 }, (_, index) => {
            const hole = index + 1;
            const par = round.pars?.[index] ?? 4;
            const score = round.scores?.[hole];
            const diff = score != null ? score - par : null;
            return (
              <tr key={hole} className="border-t border-slate-700">
                <td className="py-2 text-slate-400">{hole}</td>
                <td className="py-2 text-center">{par}</td>
                <td className="py-2 text-center text-slate-400">{round.yardages?.[index] ?? '-'}</td>
                <td className="py-2 text-center text-slate-500">{round.strokeIndexes[index] ?? '-'}</td>
                <td className="py-2 text-center font-bold text-white">{score ?? '-'}</td>
                <td className={`py-2 text-center font-bold ${diff == null ? 'text-slate-600' : diff <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {diff == null ? '-' : formatToPar(diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardCallout({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function cleanSoloRoundPayload<T extends Partial<SoloRound>>(round: T): T {
  return Object.fromEntries(
    Object.entries(round).filter(([, value]) => value !== undefined && value !== '')
  ) as T;
}
