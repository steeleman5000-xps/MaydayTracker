function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LOSER_LINES: Array<(loser: string, winner: string) => string> = [
  (l) => `${l} just donated that hole like a drunk uncle with Venmo and no supervision.`,
  (l) => `Bold strategy from ${l}: play like ass and hope the scoreboard gets embarrassed first.`,
  (l) => `${l} is out here turning a golf trip into a crime scene with divots.`,
  (l) => `${l} just played that hole like the cart girl cut him off three beers too late.`,
  (l) => `${l} needs a swing coach, a therapist, and somebody brave enough to delete that score.`,
  (l) => `If choking were match play, ${l} would be signing autographs right now.`,
  (_l) => `Somewhere, a golf pro just felt a disturbance in the force and threw up in a range bucket.`,
  (l) => `${l}'s ancestors saw that hole and immediately changed the family name.`,
  (l) => `Scientists have named that style of play the "${l} Spiral." Symptoms include panic, profanity, and buying a new driver.`,
  (l) => `${l} mailed that hole in, but even the post office said "we don't deliver trash."`,
  (l) => `Even the course felt bad for ${l}, and this place charges $9 for a hot dog.`,
  (l) => `Calling that golf is generous. That was ${l}'s midlife crisis wearing spikes.`,
  (l) => `${l}: 0. Self-respect: also 0. Cart beers: doing all the emotional labor.`,
  (l) => `That was a choice, ${l}. The kind of choice that makes friends stop giving swing tips and start filming.`,
  (l) => `${l} is at least consistent: every hole comes with disappointment and a receipt.`,
  (l) => `Free hole, courtesy of ${l}. No purchase necessary, dignity sold separately.`,
  (l, w) => `${w} didn't win that hole so much as ${l} tripped over his own shoelaces and lit the card on fire.`,
  (l) => `${l}'s caddie is quietly checking LinkedIn between bad decisions.`,
  (l) => `Another hole, another reminder that ${l} packed confidence instead of talent.`,
  (l) => `Historians will skip ${l}'s performance on this hole out of basic human decency.`,
  (l) => `${l} is playing like the bet was "make everyone uncomfortable." Mission accomplished.`,
  (_l) => `That's the kind of golf that makes strangers in the parking lot lock their trunks.`,
  (l) => `${l} treated that hole like it owed him money and still somehow lost the argument.`,
  (l, w) => `${w} accepts the hole. ${l} accepts the public shaming and whatever's left of his man card.`,
  (l) => `Nobody saw that coming. Except every person who has watched ${l} hold a wedge.`,
  (l) => `${l} just made bogey look like a wellness retreat.`,
  (l) => `${l} is one more swing thought away from joining a pickleball league.`,
  (l) => `That hole hit ${l} so hard his handicap asked for a new owner.`,
  (l) => `${l} played that like his clubs were assembled by a gas station knife salesman.`,
  (l) => `${l} brought main-character energy and NPC ball striking.`,
  (l) => `The only thing lower than ${l}'s odds on that hole was the group's respect level afterward.`,
  (l) => `${l} just put on a clinic. Unfortunately the clinic was for preventable mistakes.`,
  (l) => `That wasn't a lost hole. That was ${l} filing for golf bankruptcy in real time.`,
  (l) => `${l}'s ball saw the target and chose witness protection.`,
  (l) => `${l} has the short game of a man trying to text during a fire drill.`,
];

const HALVED_LINES: Array<(a: string, b: string) => string> = [
  (a, b) => `A tie. ${a} and ${b} both had the wheel and still drove the hole into a ditch.`,
  () => `Halved! Two teams entered, zero clutch genes were detected.`,
  (a, b) => `${a} and ${b} looked at each other and said "you blow it." Then both followed instructions.`,
  () => `A draw. Golf's most polite way of saying everyone brought garbage to the potluck.`,
  () => `The hole is halved. The dignity is buried somewhere near the cart path.`,
  (a, b) => `${a} and ${b} matched scores and matched incompetence. Very synchronized. Very sad.`,
  () => `Neither team wanted it badly enough to stop playing like a rental set with trust issues.`,
  () => `Both sides were so committed to equality they forgot this was a competition.`,
  (a, b) => `Watching ${a} and ${b} halve that hole was like watching two Roombas fight over a sock.`,
  () => `Halved! The golfing gods looked down and said, "we're not putting our name on either of these idiots."`,
  () => `A tie. Two teams, a pile of clubs, and somehow the hole still pressed charges.`,
  (a, b) => `${a} and ${b} split the hole and the embarrassment right down the middle.`,
  () => `Nobody wins. Nobody loses. Everyone just gets a little more divorced from their self-image.`,
  () => `Halved! The scoreboard blinked first out of secondhand shame.`,
  () => `Both teams high-fived each other's failure like it was a charity scramble.`,
  () => `That half-point came with all the swagger of a wet scorecard.`,
  () => `A push. The only thing won there was another round of silence in the cart.`,
  () => `Halved. Everybody gets half a point and a full serving of disappointment.`,
  (a, b) => `${a} and ${b} just produced the golf equivalent of a group text nobody wants to answer.`,
  () => `The hole ended all square, which is generous because both sides looked emotionally foreclosed.`,
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
