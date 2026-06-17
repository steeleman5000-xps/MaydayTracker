import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const source = readFileSync('src/lib/scoring.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2020,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  },
});

const testDir = mkdtempSync(join(tmpdir(), 'mayday-scoring-'));
const compiledPath = join(testDir, 'scoring.mjs');
writeFileSync(compiledPath, compiled.outputText);

const { calcMatchResult, aggregateTeamPoints } = await import(pathToFileURL(compiledPath));

const strokeIndexes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const player = (id, teamId, handicap) => ({
  id,
  name: id,
  teamId,
  handicap,
  createdAt: 1,
});

const singles = {
  id: 'm1',
  roundId: 'r1',
  format: 'singles',
  playerAId: 'a1',
  playerBId: 'b1',
  scores: {
    1: { playerA: 5, playerB: 4 },
    2: { playerA: 4, playerB: 4 },
    3: { playerA: 3, playerB: 5 },
  },
  wagers: {},
  status: 'active',
  createdAt: 1,
};

const singlesResult = calcMatchResult(
  singles,
  player('a1', 'A', 10),
  player('b1', 'B', 8),
  strokeIndexes
);

assert.equal(singlesResult.strokes.a1, 2, 'higher handicap singles player receives the handicap difference');
assert.equal(singlesResult.holesPlayed, 3);
assert.equal(singlesResult.status, '2 UP');
assert.equal(singlesResult.pointsA, 0);
assert.equal(singlesResult.pointsB, 0);

const fourball = {
  id: 'm2',
  roundId: 'r1',
  format: 'fourball',
  playerAId: 'a1',
  playerA2Id: 'a2',
  playerBId: 'b1',
  playerB2Id: 'b2',
  scores: {
    1: { playerA: 5, playerA2: 6, playerB: 4, playerB2: 5 },
    2: { playerA: 4, playerA2: 5, playerB: 4 },
    3: { playerA2: 4, playerB: 5, playerB2: 4 },
  },
  wagers: {},
  status: 'active',
  createdAt: 1,
};

const fourballResult = calcMatchResult(
  fourball,
  player('a1', 'A', 4),
  player('b1', 'B', 8),
  strokeIndexes,
  player('a2', 'A', 12),
  player('b2', 'B', 16)
);

assert.deepEqual(
  fourballResult.strokes,
  { a1: 0, a2: 8, b1: 4, b2: 12 },
  'fourball handicaps are based on the lowest handicap in the match'
);
assert.equal(fourballResult.holesPlayed, 3);
assert.equal(fourballResult.teamAHolesUp, -2);
assert.equal(fourballResult.status, '2 DN');

assert.deepEqual(
  aggregateTeamPoints([
    { ...singlesResult, pointsA: 1, pointsB: 0 },
    { ...fourballResult, pointsA: 0.5, pointsB: 0.5 },
  ]),
  { A: 1.5, B: 0.5 }
);

console.log('Scoring tests passed.');
