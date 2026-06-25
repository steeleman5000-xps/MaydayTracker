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
  (p) => `Bogey for ${p}. A gentle reminder that confidence and evidence are two very different departments.`,
  (p) => `${p} made bogey with the body language of a man already drafting the lie he'll tell at the bar.`,
  (p) => `One over for ${p}. Not a collapse, just a slow public leak from the talent tank.`,
  (p) => `${p} gave one back like the course sent an invoice and his spine paid it immediately.`,
  (p) => `Bogey. ${p} is officially playing defense against his own scorecard, and the scorecard is winning.`,
  (p) => `${p} just turned a routine hole into a minor HR incident for his handicap.`,
  (p) => `One over for ${p}. The golf gods saw that swing and downgraded him from "threat" to "local flavor."`,
  (p) => `Bogey for ${p}. That was less "bad break" and more "documented pattern of fraud."`,
  (p) => `${p} leaked a shot there like his short game signed an NDA with the other team.`,
  (p) => `Bogey. ${p}'s pre-shot routine has the swagger of a man about to disappoint five separate witnesses.`,
  (p) => `${p} just made bogey so casually you'd think mediocrity came with a loyalty card.`,
  (p) => `One over. ${p} played that hole like his swing coach accepts payment in excuses.`,
  (p) => `Bogey for ${p}. The ball didn't listen, but in fairness, neither should anyone else.`,
  (p) => `${p} donated a stroke and still looked surprised, which is the real illness here.`,
  (p) => `Bogey. Somewhere in ${p}'s bag, a club is quietly asking to be traded.`,
  (p) => `${p} made a bogey that felt inevitable, like taxes with worse tempo.`,
  (p) => `One over for ${p}. The only thing crisp on that hole was the silence afterward.`,
  (p) => `${p}'s scorecard just coughed up a bogey and asked if this is going to be the whole personality today.`,
  (p) => `Bogey. ${p} brought tour-level confidence to municipal-level execution.`,
  (p) => `${p} lost a shot there and somehow kept all the delusion. Impressive storage capacity.`,
];

const SOLO_DOUBLE_LINES: Array<(player: string) => string> = [
  (p) => `Double for ${p}. That hole had less structure than a bachelor party group chat after the ninth transfusion of Fireball.`,
  (p) => `${p} just made double and somehow even the cart GPS said, "walk from here."`,
  (p) => `Double bogey. ${p}'s handicap just took off the fake mustache and admitted it's been doing charity work.`,
  (p) => `${p} turned that hole into a crime scene with a pencil and then signed the confession in Sharpie.`,
  (p) => `That double from ${p} had layers: bad plan, worse execution, and the confidence of a casino ATM withdrawal.`,
  (p) => `${p} made double like he was trying to get comped a lesson out of pity and rejected for lack of potential.`,
  (p) => `Double for ${p}. That's not a score, that's a cry for help wearing FootJoys.`,
  (p) => `${p} just wrote down double with the calm of a man whose standards moved out years ago.`,
  (p) => `Double bogey. The hole asked ${p} a basic question and he answered in crayon.`,
  (p) => `${p} made double so cleanly it feels like he practices this exact failure in the mirror.`,
  (p) => `Two over for ${p}. The swing was loud, the result was tragic, and the denial was professionally installed.`,
  (p) => `Double. ${p}'s ball spent so much time away from grass it might qualify for airport lounge access.`,
  (p) => `${p} just made a double that could lower property values around the tee box.`,
  (p) => `Double bogey. ${p}'s clubs are not the problem, but they're going to take the blame like loyal employees.`,
  (p) => `${p} handled that hole like a man trying to assemble furniture after six beers and no instructions.`,
  (p) => `Double for ${p}. The course didn't beat him there; it audited him.`,
  (p) => `${p} just turned one hole into a full-body reputation injury.`,
  (p) => `Double bogey for ${p}. That's the kind of score that makes the next tee box pretend it doesn't know him.`,
  (p) => `${p} made double and somehow the scorecard looks sticky with shame.`,
  (p) => `Two over. ${p}'s mental game has the structural integrity of a gas station folding chair.`,
  (p) => `${p} just made double with Tiger Woods traffic-stop energy: bad optics, worse steering, and no clean way to explain the route.`,
];

const SOLO_BLOWUP_LINES: Array<(player: string, overPar: number) => string> = [
  (p, over) => `${p} went ${over} over on that hole. That's not scoring, that's a ransom note from whatever is left of his dignity.`,
  (p, over) => `${over} over for ${p}. Somewhere a starter just whispered, "we should have paired him with strangers and an apology letter."`,
  (p, over) => `${p} just posted a ${over}-over masterpiece in recreational self-sabotage.`,
  (p, over) => `${over} over. ${p}'s ball wasn't lost, it fled an unsafe work environment and filed paperwork.`,
  (p, over) => `${p} went ${over} over and made the scorecard ask for witness protection and a stiff drink.`,
  (p, over) => `${over} over for ${p}. The hole won, the course won, and basic dignity withdrew before the turn.`,
  (p, over) => `${p} just went ${over} over. The marshal is circling because that looked less like golf and more like a zoning violation.`,
  (p, over) => `${over} over. ${p}'s round didn't derail; it left the tracks, bought fireworks, and blamed the cart path.`,
  (p, over) => `${p} posted ${over} over like he was trying to make triple bogey feel emotionally stable.`,
  (p, over) => `${over} over for ${p}. That hole had a beginning, a middle, and a felony amount of coping.`,
  (p, over) => `${p} went ${over} over and turned a par into a group therapy exercise nobody consented to.`,
  (p, over) => `${over} over. ${p}'s golf IQ just got escorted out for yelling at the staff.`,
  (p, over) => `${p} detonated for ${over} over. Even the sand trap looked away like, "not in front of me."`,
  (p, over) => `${over} over for ${p}. That wasn't a blowup, that was a controlled demolition with no permits.`,
  (p, over) => `${p} just made a ${over}-over mess so loud the beverage cart started driving faster.`,
  (p, over) => `${over} over. ${p}'s swing thoughts held a meeting and voted no confidence.`,
  (p, over) => `${p} went ${over} over and somehow still has the nerve to own golf shoes.`,
  (p, over) => `${over} over for ${p}. The scorecard needs a shower and a different friend group.`,
  (p, over) => `${p} just fed ${over} strokes into that hole like a slot machine with worse lighting.`,
  (p, over) => `${over} over. The only thing ${p} controlled on that hole was the font size of the disaster.`,
  (p, over) => `${p} went ${over} over with the reckless precision of a Tiger Woods tabloid headline, except this crash only injured the scorecard.`,
];

const SOLO_BIRDIE_LINES: Array<(player: string, underPar: number) => string> = [
  (p) => `Birdie for ${p}. Incredible. The course briefly lost custody of its own dignity.`,
  (p) => `${p} made birdie, which is suspicious behavior from someone usually negotiating with bogey like a hostage mediator.`,
  (p) => `Birdie. ${p} accidentally played golf correctly and now everybody has to pretend this was the plan.`,
  (p) => `${p} just circled one. Alert the clubhouse before he starts calling it a breakthrough.`,
  (p) => `Birdie for ${p}. Enjoy the rare air before gravity and the next tee box file their paperwork.`,
  (p) => `${p} made birdie with the confidence of a man who will absolutely mention it three drinks from now.`,
  (p) => `Birdie. For one hole, ${p}'s swing and self-image were legally allowed in the same room.`,
  (p) => `${p} just stole a stroke from the course. Nice work, Ocean's Eleven handicap edition.`,
  (p) => `Birdie for ${p}. The scorecard is confused but willing to accept the donation.`,
  (p) => `${p} went under par there. Somewhere, his group chat is already overpricing the achievement.`,
];

const SOLO_EAGLE_LINES: Array<(player: string, underPar: number) => string> = [
  (p, under) => `${under} under for ${p}. That was almost too competent for the brand.`,
  (p, under) => `${p} just went ${under} under on a hole. Frame the ball before normal service resumes.`,
  (p, under) => `${under} under. ${p} briefly played like the golf gods left the keys in the cart.`,
  (p, under) => `${p} made a ${under}-under number and now has enough material for one unbearable dinner story.`,
  (p, under) => `${under} under for ${p}. The course got robbed and somehow still tipped its cap.`,
  (p) => `${p} just did something athletic enough to make the rest of the round legally non-binding.`,
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
  if (overPar === 0) return null;
  if (overPar < 0) {
    const underPar = Math.abs(overPar);
    if (underPar === 1) return pick(SOLO_BIRDIE_LINES)(player, underPar);
    return pick(SOLO_EAGLE_LINES)(player, underPar);
  }
  if (overPar === 1) return pick(SOLO_BOGEY_LINES)(player);
  if (overPar === 2) return pick(SOLO_DOUBLE_LINES)(player);
  return pick(SOLO_BLOWUP_LINES)(player, overPar);
}
