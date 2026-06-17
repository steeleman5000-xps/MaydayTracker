import { useEffect, useState } from 'react';
import type { GolfCourseApiCourse, GolfCourseTeeBox, Round, Trip } from '../types';
import { saveRound, updateRound, deleteRound } from '../lib/db';
import { getGolfCourse, searchGolfCourses } from '../lib/golfCourses';

interface Props {
  rounds: Round[];
  trips: Trip[];
  selectedTripId: string;
}

const DEFAULT_SI = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
type RoundForm = Omit<Round, 'id' | 'createdAt'>;
const BLANK_ROUND: RoundForm = { tripId: '', number: 1, courseName: '', strokeIndexes: [...DEFAULT_SI] };

export default function AdminRounds({ rounds, trips, selectedTripId }: Props) {
  const [form, setForm] = useState(BLANK_ROUND);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editState, setEditState] = useState<RoundForm | null>(null);
  const [courseQuery, setCourseQuery] = useState('');
  const [courseResults, setCourseResults] = useState<GolfCourseApiCourse[]>([]);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourseApiCourse | null>(null);
  const [selectedTeeKey, setSelectedTeeKey] = useState('');
  const filteredRounds = rounds.filter((round) => (
    selectedTripId ? round.tripId === selectedTripId : !round.tripId
  ));

  useEffect(() => {
    setForm((f) => ({ ...f, tripId: selectedTripId }));
    setExpanded(null);
    setEditState(null);
  }, [selectedTripId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseName.trim()) return;
    setSaving(true);
    await saveRound(cleanRoundPayload({
      ...form,
      courseName: form.courseName.trim(),
      createdAt: Date.now(),
    }));
    setForm({ ...BLANK_ROUND, tripId: selectedTripId });
    setSelectedCourse(null);
    setSelectedTeeKey('');
    setSaving(false);
  }

  function setSI(idx: number, val: string) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    setForm((f) => {
      const si = [...f.strokeIndexes];
      si[idx] = parsed;
      return { ...f, strokeIndexes: si };
    });
  }

  function setEditSI(idx: number, val: string) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    setEditState((s) => {
      if (!s) return s;
      const si = [...s.strokeIndexes];
      si[idx] = parsed;
      return { ...s, strokeIndexes: si };
    });
  }

  async function handleUpdate(id: string) {
    if (!editState) return;
    setSaving(true);
    await updateRound(id, cleanRoundPayload(editState));
    setExpanded(null);
    setEditState(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this round? All matchups for this round will still exist.')) return;
    await deleteRound(id);
  }

  function tripLabel(tripId?: string) {
    const trip = trips.find((t) => t.id === tripId);
    return trip ? `${trip.year} ${trip.name}` : 'Unassigned';
  }

  async function handleCourseSearch() {
    if (!courseQuery.trim()) return;
    setCourseLoading(true);
    setCourseError(null);
    try {
      const results = await searchGolfCourses(courseQuery.trim());
      setCourseResults(results);
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Course search failed');
    } finally {
      setCourseLoading(false);
    }
  }

  async function handleSelectCourse(course: GolfCourseApiCourse) {
    setCourseLoading(true);
    setCourseError(null);
    try {
      const detail = await getGolfCourse(course.id);
      setSelectedCourse(detail);
      const firstTee = getTeeOptions(detail)[0];
      if (firstTee) {
        setSelectedTeeKey(firstTee.key);
        applyTeeToForm(detail, firstTee.gender, firstTee.tee);
      }
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Could not load course details');
    } finally {
      setCourseLoading(false);
    }
  }

  function applySelectedTee(key: string) {
    setSelectedTeeKey(key);
    if (!selectedCourse) return;
    const option = getTeeOptions(selectedCourse).find((tee) => tee.key === key);
    if (option) applyTeeToForm(selectedCourse, option.gender, option.tee);
  }

  function applyTeeToForm(
    course: GolfCourseApiCourse,
    gender: 'male' | 'female',
    tee: GolfCourseTeeBox
  ) {
    const holes = tee.holes ?? [];
    const completeHoles = holes.length >= 18 ? holes.slice(0, 18) : [];
    const courseName = course.course_name && course.course_name !== course.club_name
      ? `${course.club_name} - ${course.course_name}`
      : course.club_name || course.course_name;

    setForm((current) => ({
      ...current,
      courseName,
      courseApiId: course.id,
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

  function startEdit(round: Round) {
    setExpanded(round.id);
    setEditState({
      tripId: round.tripId ?? '',
      number: round.number,
      courseName: round.courseName,
      courseApiId: round.courseApiId,
      courseClubName: round.courseClubName,
      teeName: round.teeName,
      teeGender: round.teeGender,
      courseRating: round.courseRating,
      slopeRating: round.slopeRating,
      courseLogoUrl: round.courseLogoUrl,
      courseBrandColor: round.courseBrandColor,
      pars: round.pars ? [...round.pars] : undefined,
      yardages: round.yardages ? [...round.yardages] : undefined,
      strokeIndexes: [...round.strokeIndexes],
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Round</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
            Adding rounds to <span className="font-semibold text-white">{tripLabel(selectedTripId)}</span>.
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-3">
            <div>
              <label className="label">Import Scorecard</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Search course or club"
                  value={courseQuery}
                  onChange={(e) => setCourseQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary px-4"
                  disabled={courseLoading || !courseQuery.trim()}
                  onClick={handleCourseSearch}
                >
                  {courseLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Imported scorecards fill par, yardage, and stroke indexes. You can still edit indexes below.
              </p>
            </div>

            {courseError && (
              <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
                {courseError}
              </div>
            )}

            {courseResults.length > 0 && (
              <div className="space-y-2">
                {courseResults.slice(0, 6).map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left hover:border-emerald-600"
                    onClick={() => handleSelectCourse(course)}
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

            {selectedCourse && getTeeOptions(selectedCourse).length > 0 && (
              <div className="space-y-2">
                <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  Selected {selectedCourse.club_name}
                  {selectedCourse.course_name ? ` - ${selectedCourse.course_name}` : ''}
                </div>
                <label className="label">Tee Box</label>
                <select
                  className="input"
                  value={selectedTeeKey}
                  onChange={(e) => applySelectedTee(e.target.value)}
                >
                  {getTeeOptions(selectedCourse).map(({ key, gender, tee }) => (
                    <option key={key} value={key}>
                      {tee.tee_name} ({gender}) · {tee.total_yards ?? '-'} yards · {tee.course_rating ?? '-'} / {tee.slope_rating ?? '-'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="w-24">
              <label className="label">Round #</label>
              <input
                type="number"
                className="input"
                min="1"
                max="3"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
              />
            </div>
            <div className="flex-1">
              <label className="label">Course Name</label>
              <input
                className="input"
                placeholder="e.g. Pebble Beach"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3">
            <div>
              <label className="label">Course Logo URL</label>
              <input
                className="input"
                placeholder="https://course.com/logo.png"
                value={form.courseLogoUrl ?? ''}
                onChange={(e) => setForm({ ...form, courseLogoUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Brand Color</label>
              <input
                className="input h-11"
                type="color"
                value={form.courseBrandColor ?? '#0f766e'}
                onChange={(e) => setForm({ ...form, courseBrandColor: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Hole Stroke Indexes (from scorecard)</label>
            <p className="text-slate-500 text-xs mb-2">
              Enter the stroke index for each hole 1–18. Hole with SI=1 is hardest (first to receive a stroke).
            </p>
            {form.pars && form.yardages && (
              <div className="mb-2 overflow-x-auto rounded-lg border border-slate-700">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-2 py-1 text-slate-500">Hole</th>
                      {form.pars.map((_, idx) => <td key={idx} className="text-center px-1 py-1">{idx + 1}</td>)}
                    </tr>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-2 py-1 text-slate-500">Par</th>
                      {form.pars.map((par, idx) => <td key={idx} className="text-center px-1 py-1">{par}</td>)}
                    </tr>
                    <tr>
                      <th className="text-left px-2 py-1 text-slate-500">Yds</th>
                      {form.yardages.map((yards, idx) => <td key={idx} className="text-center px-1 py-1">{yards}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-cols-9 gap-1">
              {form.strokeIndexes.map((si, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-slate-500 text-xs">{idx + 1}</span>
                  <input
                    type="number"
                    className="w-full text-center bg-slate-700 border border-slate-600 rounded p-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                    min="1"
                    max="18"
                    value={si}
                    onChange={(e) => setSI(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving || !form.courseName.trim()}>
            Add Round
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Rounds for {tripLabel(selectedTripId)}</h3>
          <span className="text-xs text-slate-500">{filteredRounds.length} shown</span>
        </div>
        {filteredRounds.length === 0 && (
          <p className="text-slate-500 text-sm">No rounds for this trip yet.</p>
        )}
        {filteredRounds.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold">Round {r.number}</span>
                <span className="text-slate-300 ml-2">{r.courseName}</span>
                <span className="text-slate-500 text-xs ml-2">{tripLabel(r.tripId)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-slate-400 hover:text-white text-sm px-2 py-1"
                  onClick={() => {
                    if (expanded === r.id) { setExpanded(null); setEditState(null); return; }
                    startEdit(r);
                  }}
                >
                  {expanded === r.id ? 'Close' : 'Edit'}
                </button>
                <button
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  onClick={() => handleDelete(r.id)}
                >
                  ✕
                </button>
              </div>
            </div>

            {expanded === r.id && editState && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                {trips.length > 0 && (
                  <div>
                    <label className="label">Trip</label>
                    <select
                      className="input"
                      value={editState.tripId}
                      onChange={(e) => setEditState({ ...editState, tripId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>{trip.year} {trip.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Course Name</label>
                  <input
                    className="input"
                    value={editState.courseName}
                    onChange={(e) => setEditState({ ...editState, courseName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Tee Name</label>
                    <input
                      className="input"
                      value={editState.teeName ?? ''}
                      onChange={(e) => setEditState({ ...editState, teeName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Rating / Slope</label>
                    <input
                      className="input"
                      value={[editState.courseRating, editState.slopeRating].filter((v) => v != null).join(' / ')}
                      disabled
                      placeholder="Imported only"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_9rem] gap-3">
                  <div>
                    <label className="label">Course Logo URL</label>
                    <input
                      className="input"
                      value={editState.courseLogoUrl ?? ''}
                      onChange={(e) => setEditState({ ...editState, courseLogoUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Brand Color</label>
                    <input
                      className="input h-11"
                      type="color"
                      value={editState.courseBrandColor ?? '#0f766e'}
                      onChange={(e) => setEditState({ ...editState, courseBrandColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Stroke Indexes</label>
                  {editState.pars && editState.yardages && (
                    <div className="mb-2 overflow-x-auto rounded-lg border border-slate-700">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-slate-700">
                            <th className="text-left px-2 py-1 text-slate-500">Hole</th>
                            {editState.pars.map((_, idx) => <td key={idx} className="text-center px-1 py-1">{idx + 1}</td>)}
                          </tr>
                          <tr className="border-b border-slate-700">
                            <th className="text-left px-2 py-1 text-slate-500">Par</th>
                            {editState.pars.map((par, idx) => <td key={idx} className="text-center px-1 py-1">{par}</td>)}
                          </tr>
                          <tr>
                            <th className="text-left px-2 py-1 text-slate-500">Yds</th>
                            {editState.yardages.map((yards, idx) => <td key={idx} className="text-center px-1 py-1">{yards}</td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="grid grid-cols-9 gap-1">
                    {editState.strokeIndexes.map((si, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-slate-500 text-xs">{idx + 1}</span>
                        <input
                          type="number"
                          className="w-full text-center bg-slate-700 border border-slate-600 rounded p-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                          min="1"
                          max="18"
                          value={si}
                          onChange={(e) => setEditSI(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" disabled={saving} onClick={() => handleUpdate(r.id)}>Save</button>
                  <button className="btn-secondary" onClick={() => { setExpanded(null); setEditState(null); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTeeOptions(course: GolfCourseApiCourse): Array<{
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

function cleanRoundPayload<T extends Partial<Round>>(round: T): T {
  return Object.fromEntries(
    Object.entries(round).filter(([, value]) => value !== undefined && value !== '')
  ) as T;
}
