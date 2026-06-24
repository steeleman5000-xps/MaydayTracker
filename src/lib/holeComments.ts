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

const SOLO_BOGEY_LINES: Array<(player: string) => string> = [
  (p) => `${p} made bogey with the confidence of a man who definitely blames the wind.`,
  (p) => `Bogey for ${p}. Not a disaster, just the kind of slow leak that ruins a vacation rental deposit.`,
  (p) => `${p} gave one back like the course had a Venmo request pending.`,
  (p) => `Bogey. ${p} is officially playing defense against his own scorecard.`,
  (p) => `${p} just turned a routine hole into a minor paperwork incident.`,
  (p) => `One over for ${p}. The golf gods saw that and said, "yeah, sounds about right."`,
];

const SOLO_DOUBLE_LINES: Array<(player: string) => string> = [
  (p) => `Double for ${p}. That hole had less structure than a bachelor party group chat.`,
  (p) => `${p} just made double and somehow the cart GPS looks disappointed.`,
  (p) => `Double bogey. ${p}'s handicap just opened a burner account.`,
  (p) => `${p} turned that hole into a crime scene with a pencil.`,
  (p) => `That double from ${p} had layers: bad plan, worse execution, elite denial.`,
  (p) => `${p} made double like he was trying to get comped a lesson out of pity.`,
];

const SOLO_BLOWUP_LINES: Array<(player: string, overPar: number) => string> = [
  (p, over) => `${p} went ${over} over on that hole. That's not scoring, that's a hostage note.`,
  (p, over) => `${over} over for ${p}. Somewhere a starter just whispered, "we should have paired him with strangers."`,
  (p, over) => `${p} just posted a ${over}-over masterpiece in recreational self-harm.`,
  (p, over) => `${over} over. ${p}'s ball wasn't lost, it fled an unsafe work environment.`,
  (p, over) => `${p} went ${over} over and made the scorecard ask for witness protection.`,
  (p, over) => `${over} over for ${p}. The hole won, the course won, and basic dignity withdrew before the turn.`,
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

export function getSoloHoleComment(player: string, score: number, par: number): string | null {
  const overPar = score - par;
  if (overPar <= 0) return null;
  if (overPar === 1) return pick(SOLO_BOGEY_LINES)(player);
  if (overPar === 2) return pick(SOLO_DOUBLE_LINES)(player);
  return pick(SOLO_BLOWUP_LINES)(player, overPar);
}
