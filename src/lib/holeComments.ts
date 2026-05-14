function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LOSER_LINES: Array<(loser: string, winner: string) => string> = [
  (l) => `${l} just donated that hole. Very generous. Very embarrassing.`,
  (l) => `Bold strategy from ${l}. Absolutely catastrophic, but bold.`,
  (l) => `${l} out here playing like they're being paid to lose.`,
  (l) => `A child with a pool noodle could've parred that. ${l} could not.`,
  (l) => `${l} needs a therapist more than a golf coach at this point.`,
  (l) => `If losing holes were an Olympic sport, ${l} would finally medal.`,
  (l) => `Somewhere, a golf pro is watching ${l} and openly weeping.`,
  (l) => `${l}'s ancestors are watching from the afterlife. They're not clapping.`,
  (l) => `Scientists have named that style of play the "${l} Spiral." It ends badly every time.`,
  (l) => `${l} absolutely mailed that hole in. Return to sender.`,
  (l) => `Even the course felt bad for ${l} on that one.`,
  (l) => `It would be unfair to call that "golf." Let's call it ${l}'s "abstract art period."`,
  (l) => `${l}: 0. Self-respect: also 0.`,
  (l) => `That was a choice, ${l}. A deeply shameful choice.`,
  (l) => `${l} is at least consistent — consistently terrible.`,
  (l) => `Free hole, courtesy of ${l}. No purchase necessary.`,
  (l, w) => `${w} didn't even have to try. ${l} took care of it themselves.`,
  (l) => `${l}'s caddy is quietly updating their résumé.`,
  (l) => `Another hole, another reminder that ${l} probably shouldn't have come today.`,
  (l) => `Historians will not record ${l}'s performance on this hole. Mercifully.`,
  (l) => `${l} is playing like they lost a bet and the bet was "play badly."`,
  (_l) => `That's the kind of golf that makes strangers in the parking lot wince.`,
  (l) => `${l} treated that hole like it personally offended their family.`,
  (l, w) => `${w} accepts the hole. ${l} accepts the shame.`,
  (l) => `Not a single soul saw that coming. Except everyone. Everyone saw that coming from ${l}.`,
];

const HALVED_LINES: Array<(a: string, b: string) => string> = [
  (a, b) => `A tie. ${a} and ${b} — two groups of adults — and nobody could manage to win a hole. Stunning.`,
  () => `Halved! Both teams equally committed to doing absolutely nothing impressive.`,
  (a, b) => `${a} and ${b} looked at each other and said "nah, you take it." Neither did.`,
  () => `A draw. Golf's most dignified way of saying everyone sucked.`,
  () => `The hole is halved. The dignity? Also halved.`,
  (a, b) => `${a} and ${b} matched scores and matched incompetence. A perfect mirror of mediocrity.`,
  () => `Neither team wanted it badly enough to actually earn it. Halved.`,
  () => `Both sides so committed to parity they forgot to compete.`,
  (a, b) => `It's like watching ${a} and ${b} arm wrestle and both give up at the same time.`,
  () => `Halved! The golfing gods looked down and couldn't pick a lesser team. That's how bad it was.`,
  () => `A tie. Two teams, eighteen clubs each, and this is what we got.`,
  (a, b) => `${a} and ${b} split the hole. And the embarrassment. Equally.`,
  () => `Nobody wins. Nobody loses. Everyone goes home a little dead inside.`,
  () => `Halved! As if the scoreboard needed to remind us that neither team is dangerous.`,
  () => `Both teams high-fived each other's failure on that one.`,
];

export function getHoleComment(
  winner: 'A' | 'B' | null,
  nameA: string,
  nameB: string
): string {
  if (winner === null) {
    return pick(HALVED_LINES)(nameA, nameB);
  }
  const loser = winner === 'A' ? nameB : nameA;
  const winnerName = winner === 'A' ? nameA : nameB;
  return pick(LOSER_LINES)(loser, winnerName);
}
