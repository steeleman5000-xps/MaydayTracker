import { useMemo, useState } from 'react';
import type { GolfCourseHole, SavedCourse, SavedCourseTeeBox, TeeGender } from '../types';
import { addSavedCourse, deleteSavedCourse, updateSavedCourse } from '../lib/db';

interface Props {
  courses: SavedCourse[];
}

type CourseForm = {
  clubName: string;
  courseName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  brandColor: string;
  tees: SavedCourseTeeBox[];
};

const TEE_GENDERS: TeeGender[] = ['unisex', 'male', 'female'];
const DEFAULT_BRAND_COLOR = '#0f766e';

export default function AdminCourses({ courses }: Props) {
  const [form, setForm] = useState<CourseForm>(() => blankCourseForm());
  const [activeTeeIndex, setActiveTeeIndex] = useState(0);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTee = form.tees[activeTeeIndex] ?? form.tees[0];
  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => displayCourseName(a).localeCompare(displayCourseName(b))),
    [courses]
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const existing = editingCourseId ? courses.find((course) => course.id === editingCourseId) : undefined;
      const payload = buildCoursePayload(form, existing?.createdAt ?? Date.now());
      const validationError = validateCourse(payload);
      if (validationError) throw new Error(validationError);

      if (editingCourseId) {
        await updateSavedCourse(editingCourseId, payload);
        setMessage('Saved course updated.');
      } else {
        await addSavedCourse(payload);
        setMessage('Saved course added.');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save course');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: SavedCourse) {
    if (!confirm(`Delete ${displayCourseName(course)} from the course library? Existing rounds will keep their copied scorecard data.`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deleteSavedCourse(course.id);
      if (editingCourseId === course.id) resetForm();
      setMessage('Saved course deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete course');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(blankCourseForm());
    setActiveTeeIndex(0);
    setEditingCourseId(null);
    setCsvText('');
  }

  function startEdit(course: SavedCourse) {
    setEditingCourseId(course.id);
    setForm(courseToForm(course));
    setActiveTeeIndex(0);
    setCsvText('');
    setMessage(null);
    setError(null);
  }

  function updateActiveTee(patch: Partial<SavedCourseTeeBox>) {
    setForm((current) => {
      const tees = current.tees.map((tee, index) => (
        index === activeTeeIndex ? { ...tee, ...patch } : tee
      ));
      return { ...current, tees };
    });
  }

  function updateHole(index: number, field: keyof GolfCourseHole, value: string) {
    const parsed = Number(value);
    setForm((current) => {
      const tees = current.tees.map((tee, teeIndex) => {
        if (teeIndex !== activeTeeIndex) return tee;
        const holes = tee.holes.map((hole, holeIndex) => (
          holeIndex === index ? { ...hole, [field]: Number.isFinite(parsed) ? parsed : 0 } : hole
        ));
        return { ...tee, holes };
      });
      return { ...current, tees };
    });
  }

  function addTee() {
    const nextIndex = form.tees.length;
    setForm((current) => ({
      ...current,
      tees: [...current.tees, blankTee(`Tee ${current.tees.length + 1}`)],
    }));
    setActiveTeeIndex(nextIndex);
  }

  function duplicateTee() {
    if (!activeTee) return;
    const nextIndex = form.tees.length;
    const copy = {
      ...cloneTee(activeTee),
      id: makeTeeId(),
      teeName: `${activeTee.teeName || 'Tee'} Copy`,
    };
    setForm((current) => ({ ...current, tees: [...current.tees, copy] }));
    setActiveTeeIndex(nextIndex);
  }

  function removeTee() {
    if (form.tees.length <= 1) return;
    setForm((current) => ({
      ...current,
      tees: current.tees.filter((_, index) => index !== activeTeeIndex),
    }));
    setActiveTeeIndex(Math.max(0, activeTeeIndex - 1));
  }

  function importCsvToActiveTee() {
    setError(null);
    setMessage(null);
    try {
      if (!activeTee) throw new Error('Add a tee box before importing holes.');
      const holes = parseScorecardText(csvText);
      updateActiveTee({ holes });
      setMessage(`Imported ${holes.length} holes into ${activeTee.teeName || 'active tee'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import scorecard');
    }
  }

  async function handleCsvFile(file: File | undefined) {
    if (!file) return;
    setCsvText(await file.text());
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">{editingCourseId ? 'Edit Saved Course' : 'Add Saved Course'}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Build a local scorecard when GolfCourseAPI is missing a course. Rounds can reuse these tee boxes later.
            </p>
          </div>
          {editingCourseId && (
            <button type="button" className="btn-secondary text-sm" onClick={resetForm}>
              New Course
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">Club Name</label>
              <input
                className="input"
                placeholder="Evansville Golf Club"
                value={form.clubName}
                onChange={(e) => setForm({ ...form, clubName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Course Name</label>
              <input
                className="input"
                placeholder="Main Course"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_8rem_1fr]">
            <div>
              <label className="label">Address</label>
              <input
                className="input"
                placeholder="8501 N Cemetery Rd"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                className="input"
                placeholder="Evansville"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                className="input"
                placeholder="WI"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                className="input"
                placeholder="United States"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
            <div>
              <label className="label">Course Logo URL</label>
              <input
                className="input"
                placeholder="https://course.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Brand Color</label>
              <input
                className="input h-11"
                type="color"
                value={form.brandColor}
                onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="label mb-0">Tee Boxes</label>
                <p className="text-xs text-slate-500">Each tee stores its own distances, par, and handicap indexes.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={addTee}>Add Tee</button>
                <button type="button" className="btn-secondary text-sm" onClick={duplicateTee} disabled={!activeTee}>Duplicate</button>
                <button type="button" className="btn-danger text-sm" onClick={removeTee} disabled={form.tees.length <= 1}>Remove</button>
              </div>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {form.tees.map((tee, index) => (
                <button
                  key={tee.id}
                  type="button"
                  className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${
                    index === activeTeeIndex
                      ? 'border-emerald-500 bg-emerald-900 text-emerald-100'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  onClick={() => setActiveTeeIndex(index)}
                >
                  {tee.teeName || `Tee ${index + 1}`}
                </button>
              ))}
            </div>

            {activeTee && (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                  <div>
                    <label className="label">Tee Name</label>
                    <input
                      className="input"
                      placeholder="White"
                      value={activeTee.teeName}
                      onChange={(e) => updateActiveTee({ teeName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Tee Type</label>
                    <select
                      className="input"
                      value={activeTee.gender}
                      onChange={(e) => updateActiveTee({ gender: e.target.value as TeeGender })}
                    >
                      {TEE_GENDERS.map((gender) => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Course Rating</label>
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      placeholder="70.2"
                      value={activeTee.courseRating ?? ''}
                      onChange={(e) => updateActiveTee({ courseRating: parseOptionalNumber(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="label">Slope</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="124"
                      value={activeTee.slopeRating ?? ''}
                      onChange={(e) => updateActiveTee({ slopeRating: parseOptionalNumber(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_1.25fr]">
                  <div className="space-y-2">
                    <label className="label">Import Tee Scorecard</label>
                    <textarea
                      className="input min-h-36 font-mono text-xs"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder={'Hole,Par,Yards,HCP\n1,4,355,9\n2,3,168,17\n...\n18,5,512,3'}
                    />
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="input max-w-sm text-sm"
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain"
                        onChange={(e) => handleCsvFile(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={!csvText.trim()}
                        onClick={importCsvToActiveTee}
                      >
                        Import to Tee
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Accepted headers: Hole, Par, Yards/Yardage, HCP/Handicap/SI. No header uses Hole, Par, Yards, HCP.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-slate-800 text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="px-2 py-2 text-left">Hole</th>
                          <th className="px-2 py-2 text-left">Par</th>
                          <th className="px-2 py-2 text-left">Yards</th>
                          <th className="px-2 py-2 text-left">HCP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTee.holes.map((hole, index) => (
                          <tr key={index} className="border-t border-slate-700">
                            <td className="px-2 py-1 text-slate-400">{index + 1}</td>
                            <td className="px-2 py-1">
                              <input
                                className="input py-1 text-sm"
                                type="number"
                                min="3"
                                max="6"
                                value={hole.par}
                                onChange={(e) => updateHole(index, 'par', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                className="input py-1 text-sm"
                                type="number"
                                min="1"
                                value={hole.yardage}
                                onChange={(e) => updateHole(index, 'yardage', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                className="input py-1 text-sm"
                                type="number"
                                min="1"
                                max="18"
                                value={hole.handicap}
                                onChange={(e) => updateHole(index, 'handicap', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-800 text-xs font-bold text-slate-300">
                        <tr>
                          <td className="px-2 py-2">Total</td>
                          <td className="px-2 py-2">{sum(activeTee.holes.map((hole) => hole.par))}</td>
                          <td className="px-2 py-2">{sum(activeTee.holes.map((hole) => hole.yardage))}</td>
                          <td className="px-2 py-2">1-18</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={saving || !form.clubName.trim()}>
            {saving ? 'Saving...' : editingCourseId ? 'Update Saved Course' : 'Save Course'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Saved Course Library</h3>
          <span className="text-xs text-slate-500">{sortedCourses.length} saved</span>
        </div>
        {sortedCourses.length === 0 && (
          <div className="card text-sm text-slate-400">
            No saved courses yet. Add a missing course once, then use it when creating rounds.
          </div>
        )}
        {sortedCourses.map((course) => (
          <div key={course.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold text-white">{displayCourseName(course)}</div>
                <div className="text-xs text-slate-500">{formatLocation(course)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {course.tees.map((tee) => (
                    <span key={tee.id} className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
                      {tee.teeName} · {tee.totalYards} yds · par {tee.parTotal}
                      {tee.courseRating && tee.slopeRating ? ` · ${tee.courseRating} / ${tee.slopeRating}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary text-sm" disabled={saving} onClick={() => startEdit(course)}>
                  Edit
                </button>
                <button type="button" className="btn-danger text-sm" disabled={saving} onClick={() => handleDelete(course)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function blankCourseForm(): CourseForm {
  return {
    clubName: '',
    courseName: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    logoUrl: '',
    brandColor: DEFAULT_BRAND_COLOR,
    tees: [blankTee('White')],
  };
}

function blankTee(name: string): SavedCourseTeeBox {
  return {
    id: makeTeeId(),
    teeName: name,
    gender: 'unisex',
    totalYards: 0,
    parTotal: 72,
    holes: Array.from({ length: 18 }, (_, index) => ({
      par: 4,
      yardage: 0,
      handicap: index + 1,
    })),
  };
}

function courseToForm(course: SavedCourse): CourseForm {
  return {
    clubName: course.clubName,
    courseName: course.courseName ?? '',
    address: course.location?.address ?? '',
    city: course.location?.city ?? '',
    state: course.location?.state ?? '',
    country: course.location?.country ?? 'United States',
    logoUrl: course.logoUrl ?? '',
    brandColor: course.brandColor ?? DEFAULT_BRAND_COLOR,
    tees: course.tees.length ? course.tees.map(cloneTee) : [blankTee('White')],
  };
}

function cloneTee(tee: SavedCourseTeeBox): SavedCourseTeeBox {
  return {
    ...tee,
    holes: tee.holes.map((hole) => ({ ...hole })),
  };
}

function buildCoursePayload(form: CourseForm, createdAt: number): Omit<SavedCourse, 'id'> {
  const location = {
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
  };
  const cleanLocation = Object.fromEntries(
    Object.entries(location).filter(([, value]) => value)
  ) as SavedCourse['location'];

  const payload: Omit<SavedCourse, 'id'> = {
    clubName: form.clubName.trim(),
    tees: form.tees.map(normalizeTee),
    source: 'manual',
    createdAt,
    updatedAt: Date.now(),
  };
  if (form.courseName.trim()) payload.courseName = form.courseName.trim();
  if (Object.keys(cleanLocation ?? {}).length > 0) payload.location = cleanLocation;
  if (form.logoUrl.trim()) payload.logoUrl = form.logoUrl.trim();
  if (form.brandColor.trim()) payload.brandColor = form.brandColor.trim();
  return payload;
}

function normalizeTee(tee: SavedCourseTeeBox): SavedCourseTeeBox {
  const holes = tee.holes.slice(0, 18).map((hole) => ({
    par: Number(hole.par),
    yardage: Number(hole.yardage),
    handicap: Number(hole.handicap),
  }));
  const normalized: SavedCourseTeeBox = {
    id: tee.id || makeTeeId(),
    teeName: tee.teeName.trim(),
    gender: tee.gender,
    totalYards: sum(holes.map((hole) => hole.yardage)),
    parTotal: sum(holes.map((hole) => hole.par)),
    holes,
  };
  if (tee.courseRating != null) normalized.courseRating = tee.courseRating;
  if (tee.slopeRating != null) normalized.slopeRating = tee.slopeRating;
  return normalized;
}

function validateCourse(course: Omit<SavedCourse, 'id'>): string | null {
  if (!course.clubName.trim()) return 'Club name is required.';
  if (!course.tees.length) return 'At least one tee box is required.';
  for (const tee of course.tees) {
    if (!tee.teeName.trim()) return 'Each tee box needs a name.';
    const teeError = validateHoles(tee.holes, tee.teeName);
    if (teeError) return teeError;
  }
  return null;
}

function validateHoles(holes: GolfCourseHole[], teeName: string): string | null {
  if (holes.length !== 18) return `${teeName} needs exactly 18 holes.`;
  const indexes = new Set<number>();
  for (const [index, hole] of holes.entries()) {
    const holeNumber = index + 1;
    if (!Number.isFinite(hole.par) || hole.par < 3 || hole.par > 6) return `${teeName} hole ${holeNumber} needs a par from 3 to 6.`;
    if (!Number.isFinite(hole.yardage) || hole.yardage <= 0) return `${teeName} hole ${holeNumber} needs yardage greater than 0.`;
    if (!Number.isInteger(hole.handicap) || hole.handicap < 1 || hole.handicap > 18) return `${teeName} hole ${holeNumber} needs HCP from 1 to 18.`;
    indexes.add(hole.handicap);
  }
  if (indexes.size !== 18) return `${teeName} needs unique HCP values from 1 to 18.`;
  return null;
}

function parseScorecardText(text: string): GolfCourseHole[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => splitScorecardLine(line))
    .filter((row) => row.length > 0);
  if (rows.length < 18) throw new Error('Import needs at least 18 rows.');

  const firstRowIsHeader = rows[0].some((cell) => /[a-zA-Z#]/.test(cell));
  const headerIndexes = firstRowIsHeader ? headerMap(rows[0]) : null;
  const dataRows = firstRowIsHeader ? rows.slice(1) : rows;
  const parsed = dataRows.slice(0, 18).map((row) => parseHoleRow(row, headerIndexes));
  parsed.sort((a, b) => a.hole - b.hole);
  const holeNumbers = new Set(parsed.map((row) => row.hole));
  if (holeNumbers.size !== 18 || parsed.some((row) => !Number.isInteger(row.hole) || row.hole < 1 || row.hole > 18)) {
    throw new Error('Imported rows must include each hole number from 1 to 18.');
  }

  const holes = parsed.map(({ par, yardage, handicap }) => ({ par, yardage, handicap }));
  const validationError = validateHoles(holes, 'Imported tee');
  if (validationError) throw new Error(validationError);
  return holes;
}

function splitScorecardLine(line: string): string[] {
  return line
    .split(/[,\t;]/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function headerMap(header: string[]) {
  const normalized = header.map((cell) => cell.toLowerCase().replace(/[^a-z#]/g, ''));
  const find = (patterns: RegExp[]) => normalized.findIndex((cell) => patterns.some((pattern) => pattern.test(cell)));
  const hole = find([/^hole$/, /^#$/]);
  const par = find([/^par$/]);
  const yardage = find([/^yards?$/, /^yds$/, /^yardage$/]);
  const handicap = find([/^hcp$/, /^handicap$/, /^si$/, /^strokeindex$/]);
  if ([hole, par, yardage, handicap].some((index) => index < 0)) {
    throw new Error('CSV header must include Hole, Par, Yards, and HCP.');
  }
  return { hole, par, yardage, handicap };
}

function parseHoleRow(row: string[], indexes: ReturnType<typeof headerMap> | null) {
  if (indexes) {
    return {
      hole: parseRequiredNumber(row[indexes.hole], 'hole'),
      par: parseRequiredNumber(row[indexes.par], 'par'),
      yardage: parseRequiredNumber(row[indexes.yardage], 'yardage'),
      handicap: parseRequiredNumber(row[indexes.handicap], 'HCP'),
    };
  }

  if (row.length < 4) throw new Error('Rows without a header must use Hole, Par, Yards, HCP.');
  const values = row.slice(0, 4).map((cell) => parseRequiredNumber(cell, 'scorecard value'));
  const [hole, par] = values;
  let yardage = values[2];
  let handicap = values[3];
  if (values[2] <= 18 && values[3] > 18) {
    handicap = values[2];
    yardage = values[3];
  }
  return { hole, par, yardage, handicap };
}

function parseRequiredNumber(value: string | undefined, label: string): number {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(parsed)) throw new Error(`Could not parse ${label}.`);
  return parsed;
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function makeTeeId(): string {
  return `tee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function displayCourseName(course: SavedCourse): string {
  if (course.courseName && course.courseName !== course.clubName) {
    return `${course.clubName} - ${course.courseName}`;
  }
  return course.clubName;
}

function formatLocation(course: SavedCourse): string {
  const parts = [course.location?.city, course.location?.state, course.location?.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'No location saved';
}
