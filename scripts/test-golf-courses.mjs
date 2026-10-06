import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const testDir = mkdtempSync(join(tmpdir(), 'mayday-courses-'));
const originalFetch = globalThis.fetch;
function loadSource(path, name) {
  const compiled = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const output = join(testDir, name + '.mjs');
  writeFileSync(output, compiled.outputText);
  return import(pathToFileURL(output));
}

try {
  const { searchGolfCourses, getGolfCourse } = await loadSource('src/lib/golfCourses.ts', 'client');
  const { onRequestGet } = await loadSource('functions/api/golf-courses/[id].ts', 'detail');
  const env = { GOLFCOURSE_API_KEY: 'test-key' };
  const summaries = ['rvjzcr4m', 'qrff3bzn'].map((id) => ({
    id, club_name: 'Talking Stick Golf Club', course_name: id,
    tees: { male: 1, female: 0 },
  }));
  const tee = {
    tee_name: 'White',
    holes: Array.from({ length: 18 }, (_, i) => ({ par: 4, yardage: 400, handicap: i + 1 })),
  };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    if (url === '/api/golf-courses/search?q=Talking%20Stick') {
      return Response.json({ courses: summaries });
    }
    if (String(url).startsWith('/api/golf-courses/')) {
      return onRequestGet({ env, params: { id: String(url).split('/').at(-1) } });
    }
    const id = String(url).split('/').at(-1);
    assert.ok(summaries.some((course) => course.id === id));
    assert.equal(init.headers.Authorization, 'Key test-key');
    return Response.json({ ...summaries.find((course) => course.id === id), tees: { male: [tee] } });
  };

  // Exercise search -> selected ID -> Pages handler -> full scorecard.
  const results = await searchGolfCourses('Talking Stick');
  for (const course of results) {
    const detail = await getGolfCourse(course.id);
    assert.equal(detail.id, course.id);
    assert.equal(detail.tees.male[0].holes.length, 18);
    assert.ok(calls.includes('https://api.golfcourseapi.com/v1/courses/' + course.id));
  }
  assert.equal((await onRequestGet({ env, params: { id: 'RVJZCR4M' } })).status, 200);

  for (const id of [undefined, '', '123', 'invalid!', '../search', 'abcdefgh/extra']) {
    const before = calls.length;
    const response = await onRequestGet({ env, params: { id } });
    assert.equal(response.status, 400);
    assert.equal(calls.length, before, 'invalid IDs must not reach the provider');
  }
  assert.equal((await onRequestGet({ env: {}, params: { id: 'rvjzcr4m' } })).status, 500);
  globalThis.fetch = async () => Response.json({ error: 'Course not found' }, { status: 404 });
  await assert.rejects(getGolfCourse('rvjzcr4m'), /Course not found/);
  console.log('Golf course search/import tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  rmSync(testDir, { recursive: true, force: true });
}
