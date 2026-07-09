import { useMemo, useState } from 'react';
import Layout from '../components/Layout';

type RegionPreference = 'us' | 'international' | 'either';
type BudgetRange = 'value' | 'standard' | 'premium' | 'bucket';
type TripPriority = 'course-quality' | 'easy-travel' | 'value' | 'nightlife' | 'resort-comfort' | 'hidden-gems';
type LodgingPreference = 'resort' | 'villa' | 'hotel' | 'cabin' | 'flexible';
type GroupStyle = 'competitive' | 'social' | 'mixed';
type DiscoveryMode = 'hidden' | 'balanced' | 'classic';
type DriveTolerance = 'easy' | 'moderate' | 'remote';
type PolishPreference = 'polished' | 'grassroots' | 'either';
type ScarcityTolerance = 'avoid' | 'some' | 'embrace';
type RouteStyle = 'home-base' | 'road-trip' | 'either';
type HiddenGemType = 'architecture' | 'value' | 'scenery' | 'municipal-revival' | 'new-restored' | 'local-culture' | 'flexible';
type ShortCoursePreference = 'yes' | 'no' | 'flexible';
type WalkCartPreference = 'walking' | 'cart' | 'either';
type AmenityPreference = 'none' | 'nightlife' | 'casino' | 'beach' | 'outdoors' | 'history' | 'flexible';
type SourceConfidence = 'verified' | 'hypothesis';
type UsRegion = 'northeast' | 'southeast' | 'midwest' | 'plains' | 'mountain-west' | 'southwest' | 'west-coast';
type UsRegionPreference = 'any' | UsRegion;

interface TripIdeaForm {
  groupSize: number;
  rounds: number;
  nights: number;
  month: string;
  year: string;
  budget: BudgetRange;
  region: RegionPreference;
  usRegion: UsRegionPreference;
  selectedStates: string[];
  priority: TripPriority;
  lodging: LodgingPreference;
  groupStyle: GroupStyle;
  discoveryMode: DiscoveryMode;
  driveTolerance: DriveTolerance;
  polish: PolishPreference;
  scarcity: ScarcityTolerance;
  routeStyle: RouteStyle;
  hiddenGemType: HiddenGemType;
  shortCourses: ShortCoursePreference;
  walkingPreference: WalkCartPreference;
  amenity: AmenityPreference;
}

interface TripIdea {
  id: string;
  name: string;
  location: string;
  region: Exclude<RegionPreference, 'either'>;
  summary: string;
  hiddenGemAngle: string;
  courses: string[];
  lodging: string[];
  bestMonths: number[];
  budget: BudgetRange;
  minGroupSize: number;
  maxGroupSize: number;
  minRounds: number;
  strengths: TripPriority[];
  lodgingStyles: LodgingPreference[];
  groupStyles: GroupStyle[];
  hiddenGemTypes: Exclude<HiddenGemType, 'flexible'>[];
  routeStyles: Exclude<RouteStyle, 'either'>[];
  polish: Exclude<PolishPreference, 'either'>;
  walkingStyles: Exclude<WalkCartPreference, 'either'>[];
  nonGolfAmenities: Exclude<AmenityPreference, 'flexible'>[];
  shortCourses: boolean;
  travelEase: number;
  courseQuality: number;
  mainstreamSaturationScore: number;
  grassrootsSignalScore: number;
  publicAccessQuality: number;
  teeTimeScarcity: number;
  courseClusterCount: number;
  airportDriveMinutes: number;
  lodgingCapacityScore: number;
  groupLogisticsScore: number;
  sourceConfidence: SourceConfidence;
  estimatedCost: string;
  bookabilityNote: string;
  plannerNote: string;
  sourceUrl: string;
}

interface AdditionalUsTripSeed {
  id: string;
  name: string;
  location: string;
  states: string[];
  regions: UsRegion[];
  summary: string;
  hiddenGemAngle: string;
  courses: string[];
  lodging: string[];
  bestMonths: number[];
  budget: BudgetRange;
  strengths: TripPriority[];
  hiddenGemTypes: Exclude<HiddenGemType, 'flexible'>[];
  routeStyles: Exclude<RouteStyle, 'either'>[];
  polish: Exclude<PolishPreference, 'either'>;
  walkingStyles: Exclude<WalkCartPreference, 'either'>[];
  nonGolfAmenities: Exclude<AmenityPreference, 'flexible'>[];
  shortCourses: boolean;
  travelEase: number;
  courseQuality: number;
  mainstreamSaturationScore: number;
  grassrootsSignalScore: number;
  airportDriveMinutes: number;
  estimatedCost: string;
  sourceUrl: string;
}

interface RankedTripIdea extends TripIdea {
  score: number;
  matchReasons: string[];
  tripViabilityScore: number;
  differentiationScore: number;
  coursesForPlan: string[];
}

const MONTHS = [
  { value: '', label: 'Flexible month' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const BUDGET_LABELS: Record<BudgetRange, string> = {
  value: 'Under $1,200',
  standard: '$1,200-$2,000',
  premium: '$2,000-$3,500',
  bucket: '$3,500+',
};

const PRIORITY_LABELS: Record<TripPriority, string> = {
  'course-quality': 'Best golf',
  'easy-travel': 'Easy travel',
  value: 'Best value',
  nightlife: 'Restaurants and nightlife',
  'resort-comfort': 'Resort comfort',
  'hidden-gems': 'Hidden gems',
};

const HIDDEN_GEM_LABELS: Record<HiddenGemType, string> = {
  architecture: 'Architecture',
  value: 'Value',
  scenery: 'Scenery',
  'municipal-revival': 'Muni revival',
  'new-restored': 'New or restored',
  'local-culture': 'Local culture',
  flexible: 'Any gem type',
};

const DRIVE_LABELS: Record<DriveTolerance, string> = {
  easy: 'Under 75 min',
  moderate: 'Up to 2.5 hours',
  remote: 'Remote is fine',
};

const US_REGION_LABELS: Record<UsRegionPreference, string> = {
  any: 'Any US region',
  northeast: 'Northeast',
  southeast: 'Southeast',
  midwest: 'Midwest / Great Lakes',
  plains: 'Great Plains',
  'mountain-west': 'Mountain West',
  southwest: 'Southwest',
  'west-coast': 'West Coast',
};

const US_STATE_OPTIONS: Array<[string, string]> = [
  ['AK', 'Alaska'],
  ['AL', 'Alabama'],
  ['AR', 'Arkansas'],
  ['AZ', 'Arizona'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['IA', 'Iowa'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['MA', 'Massachusetts'],
  ['MD', 'Maryland'],
  ['ME', 'Maine'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MO', 'Missouri'],
  ['MS', 'Mississippi'],
  ['MT', 'Montana'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['NE', 'Nebraska'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NV', 'Nevada'],
  ['NY', 'New York'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VA', 'Virginia'],
  ['VT', 'Vermont'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
];

const STATE_LABELS = Object.fromEntries(US_STATE_OPTIONS) as Record<string, string>;

const STATE_REGION_BY_CODE: Record<string, UsRegion> = {
  AK: 'west-coast',
  AL: 'southeast',
  AR: 'southeast',
  AZ: 'southwest',
  CA: 'west-coast',
  CO: 'mountain-west',
  CT: 'northeast',
  DE: 'southeast',
  FL: 'southeast',
  GA: 'southeast',
  HI: 'west-coast',
  IA: 'midwest',
  ID: 'mountain-west',
  IL: 'midwest',
  IN: 'midwest',
  KS: 'plains',
  KY: 'southeast',
  LA: 'southeast',
  MA: 'northeast',
  MD: 'southeast',
  ME: 'northeast',
  MI: 'midwest',
  MN: 'midwest',
  MO: 'midwest',
  MS: 'southeast',
  MT: 'mountain-west',
  NC: 'southeast',
  ND: 'plains',
  NE: 'plains',
  NH: 'northeast',
  NJ: 'northeast',
  NM: 'southwest',
  NV: 'southwest',
  NY: 'northeast',
  OH: 'midwest',
  OK: 'plains',
  OR: 'west-coast',
  PA: 'northeast',
  RI: 'northeast',
  SC: 'southeast',
  SD: 'plains',
  TN: 'southeast',
  TX: 'plains',
  UT: 'mountain-west',
  VA: 'southeast',
  VT: 'northeast',
  WA: 'west-coast',
  WI: 'midwest',
  WV: 'southeast',
  WY: 'mountain-west',
};

const TRIP_IDEAS: TripIdea[] = [
  {
    id: 'pinehurst',
    name: 'Pinehurst Village Match Play',
    location: 'Pinehurst, North Carolina',
    region: 'us',
    summary: 'A classic buddies-trip setup with deep course inventory, walkable village energy, and lodging that scales well for foursomes or larger groups.',
    hiddenGemAngle: 'This is the obvious famous-resort answer, which is useful when a group wants proven logistics, heritage, and a tournament feel over discovery.',
    courses: ['Pinehurst No. 2', 'Pinehurst No. 4', 'Pinehurst No. 8', 'The Cradle'],
    lodging: ['The Carolina Hotel', 'The Manor', 'The Holly Inn', 'Carolina Villas', 'Condos at Pinehurst'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['course-quality', 'resort-comfort', 'nightlife'],
    lodgingStyles: ['resort', 'villa', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'social', 'mixed'],
    hiddenGemTypes: ['architecture', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['history', 'nightlife'],
    shortCourses: true,
    travelEase: 4,
    courseQuality: 5,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 3,
    publicAccessQuality: 4,
    teeTimeScarcity: 4,
    courseClusterCount: 5,
    airportDriveMinutes: 80,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$2,200-$3,500 per person before flights',
    bookabilityNote: 'Best booked well ahead, especially if No. 2 is central to the trip.',
    plannerNote: 'Use when the group wants a known championship destination and low planning ambiguity.',
    sourceUrl: 'https://www.pinehurst.com/accommodations/',
  },
  {
    id: 'bandon',
    name: 'Bandon Dunes Walking Links Week',
    location: 'Bandon, Oregon',
    region: 'us',
    summary: 'Pure golf-first travel with several acclaimed walking courses, on-site lodging, caddies, shuttles, and almost no need to leave the property.',
    hiddenGemAngle: 'This is not hidden, but it remains the gold standard for groups that want the whole trip organized around golf and walking links-style rounds.',
    courses: ['Bandon Dunes', 'Pacific Dunes', 'Bandon Trails', 'Old Macdonald', 'Sheep Ranch'],
    lodging: ['The Lodge', 'The Inn', 'Chrome Lake', 'Lily Pond', 'Grove Cottages'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'bucket',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 4,
    strengths: ['course-quality', 'resort-comfort'],
    lodgingStyles: ['resort', 'villa', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['architecture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['none', 'outdoors'],
    shortCourses: true,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 5,
    publicAccessQuality: 4,
    teeTimeScarcity: 5,
    courseClusterCount: 5,
    airportDriveMinutes: 165,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$3,200-$5,000+ per person before flights',
    bookabilityNote: 'Lodging and tee sheets can drive the calendar; this is a long-lead trip.',
    plannerNote: 'Best for serious golfers who are comfortable walking, layering up, and building the trip around tee times.',
    sourceUrl: 'https://bandondunesgolf.com/golf/',
  },
  {
    id: 'streamsong',
    name: 'Streamsong Sandbelt Sprint',
    location: 'Bowling Green, Florida',
    region: 'us',
    summary: 'Modern resort golf with dramatic sandy terrain, strong dining, and a compact property that works well when planners want quality without complex logistics.',
    hiddenGemAngle: 'Not obscure, but still useful as the polished Florida answer when a group wants resort quality and a cold-weather escape.',
    courses: ['Streamsong Red', 'Streamsong Blue', 'Streamsong Black', 'The Chain'],
    lodging: ['Streamsong Lodge', 'Clubhouse Experience', 'The Golf Cabins', 'Bunker Experience'],
    bestMonths: [1, 2, 3, 4, 11, 12],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['course-quality', 'resort-comfort', 'easy-travel'],
    lodgingStyles: ['resort', 'hotel', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['architecture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['none', 'outdoors'],
    shortCourses: true,
    travelEase: 3,
    courseQuality: 5,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 4,
    publicAccessQuality: 4,
    teeTimeScarcity: 4,
    courseClusterCount: 4,
    airportDriveMinutes: 85,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$2,000-$3,500 per person before flights',
    bookabilityNote: 'Works best as an on-property trip with all rounds and lodging packaged together.',
    plannerNote: 'A strong cold-weather escape when the group wants three or four excellent rounds without bouncing between hotels.',
    sourceUrl: 'https://www.streamsongresort.com/golf/',
  },
  {
    id: 'kohler',
    name: 'Kohler Major Championship Loop',
    location: 'Kohler, Wisconsin',
    region: 'us',
    summary: 'Championship golf, polished lodging, spa/dining options, and a Ryder Cup-style feel for groups that want a premium Midwest trip.',
    hiddenGemAngle: 'This is a famous-trip option for groups that want a major-championship brand and resort execution instead of discovery.',
    courses: ['Whistling Straits - Straits', 'Whistling Straits - Irish', 'Blackwolf Run - River', 'Blackwolf Run - Meadow Valleys'],
    lodging: ['The American Club', 'Carriage House', 'Inn on Woodlake', 'Kohler Cabin Collection'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'bucket',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 3,
    strengths: ['course-quality', 'resort-comfort'],
    lodgingStyles: ['resort', 'hotel', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['architecture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['history', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 5,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 4,
    publicAccessQuality: 4,
    teeTimeScarcity: 4,
    courseClusterCount: 4,
    airportDriveMinutes: 65,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$2,800-$4,500+ per person before flights',
    bookabilityNote: 'Premium pricing is the tradeoff for polished lodging, dining, and course logistics.',
    plannerNote: 'A premium pick when the non-golf parts of the trip need to feel as considered as the tee sheet.',
    sourceUrl: 'https://www.kohlerwisconsin.com/golf',
  },
  {
    id: 'myrtle-legends',
    name: 'Myrtle Beach Value Cup',
    location: 'Myrtle Beach, South Carolina',
    region: 'us',
    summary: 'A high-convenience, lower-friction golf trip with five-course variety, airport proximity, beach-town dining, and group-friendly lodging.',
    hiddenGemAngle: 'Myrtle Beach is mainstream, but it is still valuable when the group optimizes for convenience, nightlife, and budget control.',
    courses: ['Heathland', 'Moorland', 'Parkland', 'Heritage Club', 'Oyster Bay'],
    lodging: ['Legends on-site lodging', 'Turnberry Park villas', 'nearby Myrtle Beach condos'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 32,
    minRounds: 3,
    strengths: ['value', 'easy-travel', 'nightlife'],
    lodgingStyles: ['villa', 'hotel', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'beach'],
    shortCourses: false,
    travelEase: 5,
    courseQuality: 3,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 5,
    airportDriveMinutes: 10,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$1,200-$2,000 per person before flights',
    bookabilityNote: 'Large groups and condo-style lodging are the planning advantage.',
    plannerNote: 'Best for larger groups where convenience, restaurants, and keeping the bill reasonable matter more than bucket-list architecture.',
    sourceUrl: 'https://legendsgolf.com/',
  },
  {
    id: 'rtj-alabama',
    name: 'RTJ Alabama Trail Sampler',
    location: 'Birmingham, Montgomery, or Auburn/Opelika, Alabama',
    region: 'us',
    summary: 'Flexible public-course routing with strong value, multiple resort hotels, and the ability to tune the route around the easiest airport.',
    hiddenGemAngle: 'More established than hidden, but still a useful value alternative to higher-priced resort destinations.',
    courses: ['Ross Bridge', 'Oxmoor Valley - Ridge', 'Capitol Hill - Judge', 'Grand National - Lake'],
    lodging: ['Renaissance Birmingham Ross Bridge Golf Resort & Spa', 'Montgomery Marriott Prattville Hotel & Conference Center', 'Auburn Marriott Opelika Resort & Spa at Grand National'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 28,
    minRounds: 3,
    strengths: ['value', 'easy-travel'],
    lodgingStyles: ['resort', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'none'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 4,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 5,
    airportDriveMinutes: 35,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 4,
    sourceConfidence: 'verified',
    estimatedCost: '$900-$1,700 per person before flights',
    bookabilityNote: 'Pick one hub for simple logistics or stitch two hubs together for more variety.',
    plannerNote: 'Think of this as a modular road-trip kit for groups that want value and easy booking.',
    sourceUrl: 'https://www.rtjgolf.com/resorts/',
  },
  {
    id: 'st-andrews',
    name: 'St Andrews Home of Golf Pilgrimage',
    location: 'St Andrews, Scotland',
    region: 'international',
    summary: 'A history-heavy international trip with iconic links, town-center lodging, pubs, and the kind of golf culture that makes the planning effort worth it.',
    hiddenGemAngle: 'This is the famous international anchor, included for groups that explicitly want the classic pilgrimage.',
    courses: ['Old Course', 'New Course', 'Jubilee Course', 'Castle Course', 'Eden Course'],
    lodging: ['Rusacks St Andrews', 'Old Course Hotel', 'Hamilton Grand'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'bucket',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 4,
    strengths: ['course-quality', 'nightlife', 'resort-comfort'],
    lodgingStyles: ['hotel', 'resort', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: ['local-culture', 'architecture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['history', 'nightlife'],
    shortCourses: true,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 5,
    grassrootsSignalScore: 5,
    publicAccessQuality: 3,
    teeTimeScarcity: 5,
    courseClusterCount: 5,
    airportDriveMinutes: 70,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 4,
    sourceConfidence: 'verified',
    estimatedCost: '$3,500-$6,500+ per person before flights',
    bookabilityNote: 'Old Course access needs a ballot, package, or flexible expectations.',
    plannerNote: 'Best for planners willing to work around ballots, advance bookings, and international travel for the payoff of a true bucket-list trip.',
    sourceUrl: 'https://www.standrews.com/play/courses/old-course',
  },
  {
    id: 'casa-de-campo',
    name: 'Casa de Campo Caribbean Cup',
    location: 'La Romana, Dominican Republic',
    region: 'international',
    summary: 'A warm-weather resort trip with Pete Dye courses, villas, restaurants, beach time, and enough non-golf amenities for mixed-priority groups.',
    hiddenGemAngle: 'This is a popular resort-style international option for groups that need comfort, villas, and non-golf appeal.',
    courses: ['Teeth of the Dog', 'Dye Fore', 'The Links'],
    lodging: ['Casa de Campo Resort rooms', 'Casa de Campo suites', 'private resort villas'],
    bestMonths: [1, 2, 3, 4, 11, 12],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['resort-comfort', 'nightlife', 'course-quality'],
    lodgingStyles: ['resort', 'villa', 'hotel', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['beach', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 4,
    grassrootsSignalScore: 3,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 3,
    airportDriveMinutes: 15,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$2,200-$4,000+ per person before flights',
    bookabilityNote: 'The villas and resort services make this simpler for mixed-priority groups.',
    plannerNote: 'Best when spouses, beach time, dining, and resort convenience matter nearly as much as the golf lineup.',
    sourceUrl: 'https://www.casadecampo.com.do/golf/',
  },
  {
    id: 'sweetens-chattanooga',
    name: 'Sequatchie Valley Architecture Loop',
    location: 'Chattanooga and South Pittsburg, Tennessee',
    region: 'us',
    summary: 'A small-footprint golf trip built around Sweetens Cove, with mountain-town lodging, Sewanee add-ons, and a local feel that does not resemble a packaged resort.',
    hiddenGemAngle: 'Scarce-access King-Collins architecture with enough nearby golf and Chattanooga lodging to turn one cult course into a real group trip.',
    courses: ['Sweetens Cove', 'The Course at Sewanee', 'Bear Trace at Harrison Bay', 'Brainerd Golf Course'],
    lodging: ['Chattanooga hotels', 'South Pittsburg rentals', 'cabins near Sewanee', 'Lookout Mountain vacation homes'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 2,
    strengths: ['hidden-gems', 'course-quality', 'value'],
    lodgingStyles: ['hotel', 'cabin', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['architecture', 'local-culture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'grassroots',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['nightlife', 'outdoors', 'history', 'none'],
    shortCourses: true,
    travelEase: 4,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 5,
    publicAccessQuality: 3,
    teeTimeScarcity: 5,
    courseClusterCount: 4,
    airportDriveMinutes: 35,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 3,
    sourceConfidence: 'verified',
    estimatedCost: '$900-$1,800 per person before flights',
    bookabilityNote: 'Sweetens access is the bottleneck; build the trip once that tee time or pass is secured.',
    plannerNote: 'Best when the group wants to say they found something before it felt fully commercialized.',
    sourceUrl: 'https://sweetenscovegolfclub.com/',
  },
  {
    id: 'landmand-sioux-city',
    name: 'Landmand Prairie Pilgrimage',
    location: 'Homer, Nebraska and Sioux City, Iowa',
    region: 'us',
    summary: 'A maximalist prairie-golf trip for groups willing to trade resort polish for a giant-scale destination course and a simple Midwest base.',
    hiddenGemAngle: 'Landmand has cult architecture energy without the fully mature resort machine around it, which makes the trip feel discovered rather than purchased.',
    courses: ['Landmand Golf Club', 'Old Dane Golf Club', 'Dakota Dunes Country Club', 'Whispering Creek Golf Club'],
    lodging: ['Landmand cabins', 'Sioux City hotels', 'Dakota Dunes rentals'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 2,
    strengths: ['hidden-gems', 'course-quality'],
    lodgingStyles: ['cabin', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['architecture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'grassroots',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['none', 'casino'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 5,
    publicAccessQuality: 3,
    teeTimeScarcity: 4,
    courseClusterCount: 4,
    airportDriveMinutes: 90,
    lodgingCapacityScore: 3,
    groupLogisticsScore: 3,
    sourceConfidence: 'verified',
    estimatedCost: '$1,100-$2,100 per person before flights',
    bookabilityNote: 'Tee times and on-site lodging can be scarce; this is a planning-ahead trip.',
    plannerNote: 'Strongest for golf-architecture sickos who do not need nightlife to validate the trip.',
    sourceUrl: 'https://www.landmandgc.com/',
  },
  {
    id: 'wildhorse-gothenburg',
    name: 'Wild Horse Sandhills Value Run',
    location: 'Gothenburg, Nebraska',
    region: 'us',
    summary: 'Affordable public golf on sandy Nebraska ground, with low-key lodging and enough nearby courses to make a pure golf road trip.',
    hiddenGemAngle: 'Sandhills-style conditions and serious golf value without the private-club or destination-resort friction.',
    courses: ['Wild Horse Golf Club', 'Bayside Golf Club', 'Awarii Dunes', 'Indianhead Golf Club'],
    lodging: ['Wild Horse lodging', 'Gothenburg hotels', 'Lake McConaughy rentals'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'course-quality'],
    lodgingStyles: ['hotel', 'cabin', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['value', 'architecture', 'scenery'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'grassroots',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['none', 'outdoors'],
    shortCourses: true,
    travelEase: 2,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 200,
    lodgingCapacityScore: 3,
    groupLogisticsScore: 3,
    sourceConfidence: 'verified',
    estimatedCost: '$750-$1,500 per person before flights',
    bookabilityNote: 'Works best as a road-trip loop from Omaha, Denver, or regional airports.',
    plannerNote: 'A good answer when the budget matters but the group still cares about golf architecture.',
    sourceUrl: 'https://www.playwildhorse.com/',
  },
  {
    id: 'firekeeper-flint-hills',
    name: 'Flint Hills Casino Golf Base',
    location: 'Mayetta and Manhattan, Kansas',
    region: 'us',
    summary: 'A practical central-US trip with resort lodging, casino amenities, and a compact course mix that is stronger than the region gets credit for.',
    hiddenGemAngle: 'Firekeeper gives the group a real resort base, while the surrounding Kansas loop keeps the trip from feeling like a generic casino weekend.',
    courses: ['Firekeeper Golf Course', 'Colbert Hills', 'Sand Creek Station', 'Cypress Ridge'],
    lodging: ['Prairie Band Casino & Resort', 'Manhattan hotels', 'Topeka hotels'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'easy-travel'],
    lodgingStyles: ['resort', 'hotel', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 80,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 4,
    sourceConfidence: 'verified',
    estimatedCost: '$800-$1,600 per person before flights',
    bookabilityNote: 'The casino base simplifies lodging, meals, and group movement.',
    plannerNote: 'This is a high-utility pick for planners who want hidden value without punishing logistics.',
    sourceUrl: 'https://www.firekeepergolf.com/',
  },
  {
    id: 'circling-raven-idaho',
    name: 'North Idaho Palouse Escape',
    location: 'Worley and Coeur d Alene, Idaho',
    region: 'us',
    summary: 'A lake-and-casino golf trip with Circling Raven as the anchor, Spokane access, and outdoor add-ons that make the trip feel bigger than the tee sheet.',
    hiddenGemAngle: 'A strong resort course with group infrastructure, but outside the standard Western bucket-list path.',
    courses: ['Circling Raven', 'Coeur d Alene Resort Golf Course', 'Indian Canyon', 'The Links Golf Club'],
    lodging: ['Coeur d Alene Casino Resort', 'Coeur d Alene lake hotels', 'Spokane hotels'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['hidden-gems', 'resort-comfort', 'course-quality'],
    lodgingStyles: ['resort', 'hotel', 'villa', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'outdoors', 'nightlife'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 55,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$1,100-$2,100 per person before flights',
    bookabilityNote: 'Spokane access makes this easier than many mountain-style hidden gems.',
    plannerNote: 'A strong fit when the group wants scenery and amenities but not the usual resort names.',
    sourceUrl: 'https://www.cdacasino.com/golf/',
  },
  {
    id: 'giants-ridge-iron-range',
    name: 'Iron Range Wilderness Double',
    location: 'Biwabik, Minnesota',
    region: 'us',
    summary: 'A two-course wilderness resort setup with enough lodging to hold a group and a setting that feels far more remote than the planning actually is.',
    hiddenGemAngle: 'The Quarry and Legend offer a real destination pair in a region many golf searches still overlook.',
    courses: ['The Quarry at Giants Ridge', 'The Legend at Giants Ridge', 'The Wilderness at Fortune Bay'],
    lodging: ['Giants Ridge villas', 'The Lodge at Giants Ridge', 'nearby lake cabins', 'Ely or Virginia hotels'],
    bestMonths: [6, 7, 8, 9],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    lodgingStyles: ['villa', 'cabin', 'hotel', 'resort', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'casino', 'none'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 3,
    airportDriveMinutes: 80,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 4,
    sourceConfidence: 'verified',
    estimatedCost: '$1,000-$2,000 per person before flights',
    bookabilityNote: 'Duluth is the cleanest airport path; Minneapolis turns it into a longer road trip.',
    plannerNote: 'A good summer answer for groups who want trees, lakes, and real golf without resort-name inflation.',
    sourceUrl: 'https://www.giantsridge.com/golf/',
  },
  {
    id: 'upper-peninsula-michigan',
    name: 'Michigan U.P. Rugged Casino Loop',
    location: 'Harris and Marquette, Michigan',
    region: 'us',
    summary: 'A rugged Upper Peninsula route with casino lodging, dramatic landforms, and a mix of resort and adventure golf.',
    hiddenGemAngle: 'Sweetgrass and Sage Run give the trip structure, while Greywalls adds the kind of visual punch most Midwest itineraries lack.',
    courses: ['Sweetgrass Golf Club', 'Sage Run', 'Greywalls', 'TimberStone'],
    lodging: ['Island Resort & Casino', 'Marquette hotels', 'Upper Peninsula cabins'],
    bestMonths: [6, 7, 8, 9],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'value'],
    lodgingStyles: ['resort', 'hotel', 'cabin', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['scenery', 'local-culture', 'value'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'outdoors', 'none'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 110,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 3,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$1,000-$2,000 per person before flights',
    bookabilityNote: 'Best researched with lodging blocks and drive times before recommending exact routing.',
    plannerNote: 'A sleeper pick for groups that enjoy the journey as much as the rounds.',
    sourceUrl: 'https://www.islandresortandcasino.com/golf/',
  },
  {
    id: 'lawsonia-green-lake',
    name: 'Green Lake Classic Architecture Weekend',
    location: 'Green Lake, Wisconsin',
    region: 'us',
    summary: 'A value-heavy Wisconsin trip around Lawsonia, lake rentals, and accessible public golf with classic architecture credibility.',
    hiddenGemAngle: 'The Links at Lawsonia has architecture-community credibility without the high-friction logistics of better-known Wisconsin resorts.',
    courses: ['Lawsonia Links', 'Lawsonia Woodlands', 'Mascoutin Golf Club', 'Tuscumbia Golf Course'],
    lodging: ['Green Lake rentals', 'Heidel House Hotel', 'Ripon hotels', 'lake cabins'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'course-quality'],
    lodgingStyles: ['villa', 'hotel', 'cabin', 'flexible'],
    groupStyles: ['competitive', 'social', 'mixed'],
    hiddenGemTypes: ['architecture', 'value'],
    routeStyles: ['home-base'],
    polish: 'grassroots',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 90,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 4,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$750-$1,500 per person before flights',
    bookabilityNote: 'Lake rentals can make the group experience stronger than a hotel block.',
    plannerNote: 'The right answer for a group that wants architecture value more than service polish.',
    sourceUrl: 'https://www.lawsonia.com/',
  },
  {
    id: 'augusta-patch',
    name: 'Augusta Public Golf Revival',
    location: 'Augusta, Georgia',
    region: 'us',
    summary: 'A public-golf revival trip near Masters country, pairing the redesigned Patch with historic local golf and straightforward city lodging.',
    hiddenGemAngle: 'The story is not private-club Augusta; it is public access, restoration, and a city golf scene being rebuilt in real time.',
    courses: ['The Patch', 'Forest Hills Golf Club', 'Bartram Trail', 'Aiken Golf Club'],
    lodging: ['Downtown Augusta hotels', 'Aiken inns', 'rental houses near Augusta National'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 2,
    strengths: ['hidden-gems', 'easy-travel', 'value'],
    lodgingStyles: ['hotel', 'villa', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['municipal-revival', 'new-restored', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'grassroots',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['history', 'nightlife'],
    shortCourses: true,
    travelEase: 4,
    courseQuality: 3,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 20,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 4,
    sourceConfidence: 'verified',
    estimatedCost: '$800-$1,800 per person before flights',
    bookabilityNote: 'Avoid Masters week unless the whole trip is priced around that event.',
    plannerNote: 'This is a storyline trip: public golf, restoration, and Augusta mythology without pretending you are playing the private one.',
    sourceUrl: 'https://www.golfthepatch.com/',
  },
  {
    id: 'west-palm-muni',
    name: 'West Palm Public Golf Renaissance',
    location: 'West Palm Beach, Florida',
    region: 'us',
    summary: 'A polished public-golf trip anchored by The Park, with easy flights, beach-city lodging, and enough alternatives to tune the budget.',
    hiddenGemAngle: 'It catches the new public-golf movement in a market people usually associate with private clubs.',
    courses: ['The Park West Palm', 'North Palm Beach Country Club', 'Okeeheelee Golf Course', 'Palm Beach Par 3'],
    lodging: ['West Palm Beach hotels', 'Palm Beach vacation rentals', 'Delray Beach hotels'],
    bestMonths: [1, 2, 3, 4, 11, 12],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'easy-travel', 'nightlife'],
    lodgingStyles: ['hotel', 'villa', 'resort', 'flexible'],
    groupStyles: ['social', 'mixed'],
    hiddenGemTypes: ['municipal-revival', 'new-restored'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['nightlife', 'beach'],
    shortCourses: true,
    travelEase: 5,
    courseQuality: 4,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 10,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$1,700-$3,200 per person before flights',
    bookabilityNote: 'Winter pricing can move quickly; value depends on dates and hotel choice.',
    plannerNote: 'Best when the group wants hidden-gem taste but not hidden-gem inconvenience.',
    sourceUrl: 'https://theparkwestpalm.com/',
  },
  {
    id: 'gulf-shores-kiva',
    name: 'Gulf Shores Condo Golf Run',
    location: 'Gulf Shores and Fort Morgan, Alabama',
    region: 'us',
    summary: 'Beach-condo logistics, multiple public courses, and enough nightlife to keep non-architects interested.',
    hiddenGemAngle: 'Kiva Dunes and the nearby public cluster give the trip more golf credibility than a generic beach weekend.',
    courses: ['Kiva Dunes', 'Peninsula Golf & Racquet Club', 'Craft Farms', 'Gulf Shores Golf Club'],
    lodging: ['Kiva Dunes condos', 'Gulf Shores beach houses', 'Orange Beach hotels'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 28,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'nightlife'],
    lodgingStyles: ['villa', 'hotel', 'resort', 'flexible'],
    groupStyles: ['social', 'mixed'],
    hiddenGemTypes: ['value', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['beach', 'nightlife'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 60,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$900-$1,900 per person before flights',
    bookabilityNote: 'Condo inventory is the planning advantage; lock a house before tee times.',
    plannerNote: 'A safer social-group recommendation than remote architecture-only trips.',
    sourceUrl: 'https://www.kivadunes.com/',
  },
  {
    id: 'southern-pines-ross',
    name: 'Southern Pines Ross Restoration Trail',
    location: 'Southern Pines, North Carolina',
    region: 'us',
    summary: 'A Pinehurst-adjacent trip that skips the obvious anchor and focuses on restored Ross-era public-access golf.',
    hiddenGemAngle: 'It borrows the sandhills ecosystem but shifts the recommendation away from the most searched resort names.',
    courses: ['Southern Pines Golf Club', 'Mid Pines', 'Pine Needles', 'Talamore'],
    lodging: ['Southern Pines hotels', 'Pine Needles Lodge', 'Mid Pines Inn', 'rental homes'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    lodgingStyles: ['hotel', 'resort', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: ['architecture', 'new-restored'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['nightlife', 'history'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 5,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 4,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 75,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$1,800-$3,200 per person before flights',
    bookabilityNote: 'Still needs advance planning, but it is more flexible than the top Pinehurst courses.',
    plannerNote: 'Use this when the group wants quality and history but you want to avoid the most obvious answer.',
    sourceUrl: 'https://www.southernpinesgolfclub.com/',
  },
  {
    id: 'cabot-citrus',
    name: 'Cabot Citrus Farms New-Old Florida',
    location: 'Brooksville, Florida',
    region: 'us',
    summary: 'A newly reimagined Florida golf property with multiple courses, short-course energy, cottages, and sandy terrain that feels unlike standard Florida resort golf.',
    hiddenGemAngle: 'The opportunity is timing: it is already credible, but still early enough to feel current and emergent.',
    courses: ['Karoo', 'Roost', 'The Squeeze', 'The Wedge'],
    lodging: ['Cabot cottages', 'Brooksville hotels', 'Crystal River rentals'],
    bestMonths: [1, 2, 3, 4, 11, 12],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 20,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    lodgingStyles: ['resort', 'cabin', 'villa', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: ['new-restored', 'architecture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: true,
    travelEase: 4,
    courseQuality: 5,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 5,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 60,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 5,
    sourceConfidence: 'verified',
    estimatedCost: '$2,000-$3,800 per person before flights',
    bookabilityNote: 'Walking policies and seasonal cart rules matter; check mobility needs before recommending.',
    plannerNote: 'This is the premium hidden-gem lane: less obscure, but still differentiated by timing and design.',
    sourceUrl: 'https://cabot.com/citrusfarms/golf/',
  },
  {
    id: 'new-mexico-desert',
    name: 'New Mexico Desert Public Loop',
    location: 'Hobbs, Las Cruces, and Santa Fe, New Mexico',
    region: 'us',
    summary: 'A wide-open desert route for groups that like exploring and do not need a single resort campus.',
    hiddenGemAngle: 'The courses are spread out, but Rockwind and New Mexico desert golf create a lower-saturation trip with real discovery value.',
    courses: ['Rockwind Community Links', 'New Mexico State University Golf Course', 'Black Mesa', 'Twin Warriors'],
    lodging: ['Hobbs hotels', 'Las Cruces hotels', 'Santa Fe hotels', 'Albuquerque resorts'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'easy-travel'],
    lodgingStyles: ['hotel', 'resort', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['value', 'scenery', 'municipal-revival'],
    routeStyles: ['road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'history'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 1,
    courseClusterCount: 4,
    airportDriveMinutes: 125,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 2,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$800-$1,700 per person before flights',
    bookabilityNote: 'This is a route, not a resort; drive planning is the product.',
    plannerNote: 'Only recommend when the user says remote or exploratory is acceptable.',
    sourceUrl: 'https://www.rockwindgolfcourse.com/',
  },
  {
    id: 'ventura-ojai',
    name: 'Ventura and Ojai Minimalist Loop',
    location: 'Ventura County, California',
    region: 'us',
    summary: 'Southern California public golf with architecture credibility, ocean-town lodging, and a strong alternative to expensive desert resort defaults.',
    hiddenGemAngle: 'Rustic Canyon and Soule Park give architecture fans something specific without sending the group to a luxury resort bubble.',
    courses: ['Rustic Canyon', 'Soule Park', 'Olivas Links', 'Buenaventura Golf Course'],
    lodging: ['Ventura hotels', 'Ojai inns', 'beach rentals'],
    bestMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'nightlife'],
    lodgingStyles: ['hotel', 'villa', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['architecture', 'value', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'grassroots',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['beach', 'nightlife', 'outdoors'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 70,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 4,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$1,200-$2,400 per person before flights',
    bookabilityNote: 'Weekend tee times can be competitive; weekday trips unlock the value.',
    plannerNote: 'Best for West Coast groups who want design-forward golf without Palm Springs predictability.',
    sourceUrl: 'https://www.rusticcanyon.com/',
  },
  {
    id: 'iowa-value-loop',
    name: 'Iowa City and Burlington Value Loop',
    location: 'Eastern Iowa',
    region: 'us',
    summary: 'An underpriced Midwest route with Spirit Hollow, Blue Top Ridge, and college-town lodging options.',
    hiddenGemAngle: 'The trip is not fashionable, which is exactly why the value and access can work for budget-sensitive groups.',
    courses: ['Spirit Hollow', 'Blue Top Ridge', 'Amana Colonies Golf Club', 'Finkbine Golf Course'],
    lodging: ['Burlington hotels', 'Iowa City hotels', 'casino hotels', 'college-town rentals'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'value',
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: 3,
    strengths: ['hidden-gems', 'value', 'easy-travel'],
    lodgingStyles: ['hotel', 'villa', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'casino', 'none'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 1,
    courseClusterCount: 4,
    airportDriveMinutes: 75,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 3,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$650-$1,400 per person before flights',
    bookabilityNote: 'The planner should choose one base; spreading the route too wide weakens the trip.',
    plannerNote: 'Good for groups that care more about total value than destination prestige.',
    sourceUrl: 'https://www.spirithollow.com/',
  },
  {
    id: 'mississippi-coast',
    name: 'Mississippi Gulf Coast Casino Golf',
    location: 'Biloxi and Gulfport, Mississippi',
    region: 'us',
    summary: 'Casino lodging, beach access, nightlife, and a cluster of solid public golf that usually sits below the radar of mainstream golf-trip searches.',
    hiddenGemAngle: 'Grand Bear and The Preserve give the route golf substance, while Biloxi solves lodging and nightlife.',
    courses: ['Grand Bear', 'The Preserve', 'Shell Landing', 'Fallen Oak'],
    lodging: ['Biloxi casino resorts', 'Gulfport hotels', 'beach rentals'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'standard',
    minGroupSize: 4,
    maxGroupSize: 28,
    minRounds: 3,
    strengths: ['hidden-gems', 'nightlife', 'value'],
    lodgingStyles: ['resort', 'hotel', 'villa', 'flexible'],
    groupStyles: ['social', 'mixed'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'nightlife', 'beach'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    publicAccessQuality: 4,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 25,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 5,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$900-$1,900 per person before flights',
    bookabilityNote: 'Confirm casino access rules for any semi-private or guest-linked tee times.',
    plannerNote: 'Best when the group wants a social base and hidden value more than pure architecture.',
    sourceUrl: 'https://www.golfgrandbear.com/',
  },
  {
    id: 'machrihanish-kintyre',
    name: 'Kintyre Remote Links Expedition',
    location: 'Campbeltown, Scotland',
    region: 'international',
    summary: 'A remote Scottish links trip with whisky, coast, small-town lodging, and a much less obvious path than St Andrews or East Lothian.',
    hiddenGemAngle: 'Machrihanish is famous among links people, but still hidden from many first-time Scotland planners because of the travel commitment.',
    courses: ['Machrihanish Golf Club', 'Machrihanish Dunes', 'Dunaverty Golf Club'],
    lodging: ['The Ugadale Hotel', 'The Royal Hotel Campbeltown', 'Campbeltown inns', 'local rentals'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'nightlife'],
    lodgingStyles: ['hotel', 'resort', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: ['scenery', 'architecture', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'grassroots',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['history', 'nightlife', 'outdoors'],
    shortCourses: false,
    travelEase: 1,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 5,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 3,
    airportDriveMinutes: 180,
    lodgingCapacityScore: 3,
    groupLogisticsScore: 2,
    sourceConfidence: 'verified',
    estimatedCost: '$2,400-$4,200 per person before flights',
    bookabilityNote: 'Remote travel is the filter; sell it only to groups that want the adventure.',
    plannerNote: 'A perfect hidden-gem answer for links purists who have already heard the usual Scotland pitches.',
    sourceUrl: 'https://machrihanishdunes.com/golf/',
  },
  {
    id: 'donegal-links',
    name: 'Donegal Wild Atlantic Links',
    location: 'County Donegal, Ireland',
    region: 'international',
    summary: 'A rugged Irish links trip with Rosapenna, Narin & Portnoo, and small-course charm along the Wild Atlantic Way.',
    hiddenGemAngle: 'It shifts Ireland away from the first-time bucket-list circuit and toward a wilder, more exploratory coastline.',
    courses: ['Rosapenna St Patricks Links', 'Narin & Portnoo', 'Cruit Island', 'Portsalon'],
    lodging: ['Rosapenna Hotel', 'Downings rentals', 'Ardara inns', 'Donegal town hotels'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 4,
    strengths: ['hidden-gems', 'course-quality'],
    lodgingStyles: ['hotel', 'villa', 'resort', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['scenery', 'architecture', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'grassroots',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['history', 'outdoors', 'nightlife'],
    shortCourses: true,
    travelEase: 1,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 160,
    lodgingCapacityScore: 3,
    groupLogisticsScore: 2,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$2,400-$4,800 per person before flights',
    bookabilityNote: 'Needs rate, transfer, and lodging verification before this becomes a one-click recommendation.',
    plannerNote: 'Best for international groups who want story, weather, and texture more than predictability.',
    sourceUrl: 'https://www.rosapenna.ie/golf/',
  },
  {
    id: 'mayo-carne',
    name: 'Mayo Remote Dunes Loop',
    location: 'County Mayo, Ireland',
    region: 'international',
    summary: 'A remote west-Ireland trip for players who value dramatic links land and lower gloss over famous-name efficiency.',
    hiddenGemAngle: 'Carne and the surrounding route bring the wild-links feeling without defaulting to Ballybunion, Lahinch, or Portmarnock.',
    courses: ['Carne Golf Links', 'Enniscrone', 'Westport Golf Club', 'Mulranny Golf Links'],
    lodging: ['Belmullet hotels', 'Westport hotels', 'coastal guesthouses'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 4,
    strengths: ['hidden-gems', 'course-quality', 'value'],
    lodgingStyles: ['hotel', 'villa', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['scenery', 'architecture', 'value'],
    routeStyles: ['road-trip'],
    polish: 'grassroots',
    walkingStyles: ['walking'],
    nonGolfAmenities: ['history', 'outdoors'],
    shortCourses: false,
    travelEase: 1,
    courseQuality: 5,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 4,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 180,
    lodgingCapacityScore: 3,
    groupLogisticsScore: 2,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$2,200-$4,300 per person before flights',
    bookabilityNote: 'Needs a transfer plan; this is not a casual airport-to-resort itinerary.',
    plannerNote: 'Recommend only to groups that explicitly choose remote links over comfort.',
    sourceUrl: 'https://www.carnegolflinks.com/',
  },
  {
    id: 'barnbougle-tasmania',
    name: 'Barnbougle Far-End Bucket Trip',
    location: 'Bridport, Tasmania, Australia',
    region: 'international',
    summary: 'A far-flung public-access links resort with multiple courses, on-site lodging, and a true destination feel.',
    hiddenGemAngle: 'It is a bucket-list trip for people tired of the Northern Hemisphere list, not a default recommendation for casual planners.',
    courses: ['Barnbougle Dunes', 'Lost Farm', 'Bougle Run'],
    lodging: ['Barnbougle Dunes cottages', 'Lost Farm Lodge', 'Bridport rentals'],
    bestMonths: [1, 2, 3, 11, 12],
    budget: 'bucket',
    minGroupSize: 4,
    maxGroupSize: 12,
    minRounds: 3,
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    lodgingStyles: ['resort', 'villa', 'hotel', 'flexible'],
    groupStyles: ['competitive', 'mixed'],
    hiddenGemTypes: ['scenery', 'architecture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: true,
    travelEase: 1,
    courseQuality: 5,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    publicAccessQuality: 5,
    teeTimeScarcity: 3,
    courseClusterCount: 3,
    airportDriveMinutes: 90,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 3,
    sourceConfidence: 'verified',
    estimatedCost: '$4,500-$7,500+ per person before flights',
    bookabilityNote: 'This is an international-calendar commitment, not an impulse trip.',
    plannerNote: 'The right answer when the group asks for genuinely different, not just less famous.',
    sourceUrl: 'https://barnbougle.com.au/',
  },
  {
    id: 'portugal-silver-coast',
    name: 'Portugal Silver Coast Value Links',
    location: 'Obidos and Peniche, Portugal',
    region: 'international',
    summary: 'A coastal Portugal trip with several strong courses, lodging flexibility, and better value than many UK and Ireland routes.',
    hiddenGemAngle: 'For US golfers, the Silver Coast can feel undiscovered because Portugal searches often default to the Algarve.',
    courses: ['West Cliffs', 'Royal Obidos', 'Praia D El Rey', 'Bom Sucesso'],
    lodging: ['Obidos resort hotels', 'Peniche rentals', 'Praia D El Rey villas'],
    bestMonths: [3, 4, 5, 6, 9, 10, 11],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 4,
    strengths: ['hidden-gems', 'value', 'resort-comfort'],
    lodgingStyles: ['resort', 'villa', 'hotel', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['value', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['beach', 'history', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    publicAccessQuality: 5,
    teeTimeScarcity: 2,
    courseClusterCount: 4,
    airportDriveMinutes: 60,
    lodgingCapacityScore: 5,
    groupLogisticsScore: 4,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$2,500-$4,500 per person before flights',
    bookabilityNote: 'Package operators may make this easier than self-booking every round.',
    plannerNote: 'A strong international value lane when the group wants Europe without Scotland or Ireland weather risk.',
    sourceUrl: 'https://www.westcliffs.com/en/golf/',
  },
  {
    id: 'silvies-oregon',
    name: 'Silvies High Desert Ranch Golf',
    location: 'Seneca, Oregon',
    region: 'us',
    summary: 'A remote ranch-resort trip with reversible golf, short-course options, and enough on-site structure to make the remoteness manageable.',
    hiddenGemAngle: 'It is unusual in format and setting, which helps it stand apart from both classic resorts and random rural courses.',
    courses: ['Hankins Course', 'Craddock Course', 'Chief Egan', 'McVeighs Gauntlet'],
    lodging: ['The Retreat at Silvies Valley Ranch', 'ranch cabins', 'on-site suites'],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 'premium',
    minGroupSize: 4,
    maxGroupSize: 16,
    minRounds: 3,
    strengths: ['hidden-gems', 'resort-comfort', 'course-quality'],
    lodgingStyles: ['resort', 'cabin', 'flexible'],
    groupStyles: ['social', 'mixed', 'competitive'],
    hiddenGemTypes: ['scenery', 'local-culture', 'architecture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: true,
    travelEase: 1,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    publicAccessQuality: 4,
    teeTimeScarcity: 3,
    courseClusterCount: 4,
    airportDriveMinutes: 170,
    lodgingCapacityScore: 4,
    groupLogisticsScore: 3,
    sourceConfidence: 'hypothesis',
    estimatedCost: '$2,200-$4,000 per person before flights',
    bookabilityNote: 'Remote air and ground logistics need to be validated before pitching it to larger groups.',
    plannerNote: 'A compelling fit for groups that want the lodging itself to feel like part of the discovery.',
    sourceUrl: 'https://silvies.us/golf/',
  },
];

const US_GEO_BY_TRIP_ID: Record<string, { states: string[]; regions: UsRegion[] }> = {
  pinehurst: { states: ['NC'], regions: ['southeast'] },
  bandon: { states: ['OR'], regions: ['west-coast'] },
  streamsong: { states: ['FL'], regions: ['southeast'] },
  kohler: { states: ['WI'], regions: ['midwest'] },
  'myrtle-legends': { states: ['SC'], regions: ['southeast'] },
  'rtj-alabama': { states: ['AL'], regions: ['southeast'] },
  'sweetens-chattanooga': { states: ['TN'], regions: ['southeast'] },
  'landmand-sioux-city': { states: ['NE', 'IA'], regions: ['plains', 'midwest'] },
  'wildhorse-gothenburg': { states: ['NE'], regions: ['plains'] },
  'firekeeper-flint-hills': { states: ['KS'], regions: ['plains'] },
  'circling-raven-idaho': { states: ['ID'], regions: ['mountain-west'] },
  'giants-ridge-iron-range': { states: ['MN'], regions: ['midwest'] },
  'upper-peninsula-michigan': { states: ['MI'], regions: ['midwest'] },
  'lawsonia-green-lake': { states: ['WI'], regions: ['midwest'] },
  'augusta-patch': { states: ['GA'], regions: ['southeast'] },
  'west-palm-muni': { states: ['FL'], regions: ['southeast'] },
  'gulf-shores-kiva': { states: ['AL'], regions: ['southeast'] },
  'southern-pines-ross': { states: ['NC'], regions: ['southeast'] },
  'cabot-citrus': { states: ['FL'], regions: ['southeast'] },
  'new-mexico-desert': { states: ['NM'], regions: ['southwest', 'mountain-west'] },
  'ventura-ojai': { states: ['CA'], regions: ['west-coast'] },
  'iowa-value-loop': { states: ['IA'], regions: ['midwest'] },
  'mississippi-coast': { states: ['MS'], regions: ['southeast'] },
  'silvies-oregon': { states: ['OR'], regions: ['west-coast'] },
};

const ADDITIONAL_US_TRIP_SEEDS: AdditionalUsTripSeed[] = [
  {
    id: 'alaska-midnight-sun',
    name: 'Alaska Midnight Sun Golf Loop',
    location: 'Anchorage and Mat-Su Valley, Alaska',
    states: ['AK'],
    regions: ['west-coast'],
    summary: 'A summer-only frontier trip with long daylight, mountain views, and a very different golf story than the lower-48 resort circuit.',
    hiddenGemAngle: 'This is a novelty-and-scenery recommendation: not the easiest trip, but it gives planners a true once-in-the-group-chat option.',
    courses: ['Anchorage Golf Course', 'Moose Run Creek Course', 'Settlers Bay', 'Palmer Golf Course'],
    lodging: ['Anchorage hotels', 'Mat-Su cabins', 'Girdwood rentals'],
    bestMonths: [6, 7, 8],
    budget: 'premium',
    strengths: ['hidden-gems', 'course-quality'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: false,
    travelEase: 1,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 20,
    estimatedCost: '$2,200-$4,000 per person before flights',
    sourceUrl: 'https://www.anchoragegolfcourse.com/',
  },
  {
    id: 'arkansas-ozarks-lakes',
    name: 'Arkansas Ozarks and Lakes Value Loop',
    location: 'Hot Springs and Bella Vista, Arkansas',
    states: ['AR'],
    regions: ['southeast'],
    summary: 'Mountain and lake golf with cabin-friendly lodging and a lower bill than most polished resort trips.',
    hiddenGemAngle: 'Arkansas gives the app a value-and-scenery answer for groups that want discovery without flying across the country.',
    courses: ['Mystic Creek', 'Granada Golf Club', 'Isabella Golf Club', 'Big Sugar Golf Club'],
    lodging: ['Hot Springs hotels', 'Bella Vista rentals', 'lake cabins'],
    bestMonths: [3, 4, 5, 9, 10, 11],
    budget: 'value',
    strengths: ['hidden-gems', 'value'],
    hiddenGemTypes: ['value', 'scenery'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'history'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 65,
    estimatedCost: '$700-$1,500 per person before flights',
    sourceUrl: 'https://www.mysticcreekgolfclub.com/',
  },
  {
    id: 'tucson-desert',
    name: 'Tucson Desert Winter Run',
    location: 'Tucson and Marana, Arizona',
    states: ['AZ'],
    regions: ['southwest'],
    summary: 'A winter-sun desert trip with resort and casino options, strong public access, and less obviousness than Scottsdale-only searches.',
    hiddenGemAngle: 'Tucson catches the desert-golf appeal while avoiding the most expensive and most searched Phoenix defaults.',
    courses: ['Sewailo Golf Club', 'Ventana Canyon', 'El Conquistador', 'Quarry Pines'],
    lodging: ['Tucson resorts', 'Casino Del Sol', 'Marana rentals'],
    bestMonths: [1, 2, 3, 4, 11, 12],
    budget: 'standard',
    strengths: ['hidden-gems', 'easy-travel', 'resort-comfort'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'outdoors', 'nightlife'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 20,
    estimatedCost: '$1,300-$2,600 per person before flights',
    sourceUrl: 'https://www.casinodelsol.com/golf/sewailo-golf-club/',
  },
  {
    id: 'colorado-mountain-loop',
    name: 'Colorado Mountain Shoulder-Season Loop',
    location: 'Keystone, Breckenridge, and Colorado Springs, Colorado',
    states: ['CO'],
    regions: ['mountain-west'],
    summary: 'A mountain-golf route with altitude, scenery, and condo lodging that works best outside peak ski-season pricing.',
    hiddenGemAngle: 'Colorado is not hidden as a place, but the golf-trip angle is underused compared with ski, hike, and brewery trips.',
    courses: ['Keystone River Course', 'Breckenridge Golf Club', 'Raven Golf Club at Three Peaks', 'The Broadmoor East'],
    lodging: ['Summit County condos', 'Colorado Springs hotels', 'mountain cabins'],
    bestMonths: [6, 7, 8, 9],
    budget: 'premium',
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 95,
    estimatedCost: '$1,700-$3,200 per person before flights',
    sourceUrl: 'https://www.keystoneresort.com/explore-the-resort/activities-and-events/golf.aspx',
  },
  {
    id: 'connecticut-rhode-island-casino-coast',
    name: 'Connecticut and Rhode Island Casino Coast',
    location: 'Mashantucket, Ledyard, and Newport',
    states: ['CT', 'RI'],
    regions: ['northeast'],
    summary: 'A compact Northeast trip with casino lodging, coastal add-ons, and strong public-access course options.',
    hiddenGemAngle: 'This creates a Northeast answer that is more actionable for groups than a generic Boston or Cape Cod search.',
    courses: ['Lake of Isles North', 'Fox Hopyard', 'Newport National', 'Mohegan Sun Golf Club'],
    lodging: ['Foxwoods Resort Casino', 'Mohegan Sun', 'Newport hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'nightlife', 'easy-travel'],
    hiddenGemTypes: ['local-culture', 'scenery'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'nightlife', 'history'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 55,
    estimatedCost: '$1,300-$2,500 per person before flights',
    sourceUrl: 'https://www.lakeofisles.com/',
  },
  {
    id: 'delmarva-bay-loop',
    name: 'Delmarva Bay Golf Weekend',
    location: 'Delaware and Maryland beaches',
    states: ['DE', 'MD'],
    regions: ['southeast'],
    summary: 'A beach-house golf trip with strong public courses, seafood, and simple group lodging along the bay and Atlantic coast.',
    hiddenGemAngle: 'Delmarva is not a default golf-trip search result, but the combination of beach rentals and public courses makes it very bookable.',
    courses: ['Baywood Greens', 'Bayside Resort Golf Club', 'Links at Lighthouse Sound', 'Rum Pointe'],
    lodging: ['Rehoboth rentals', 'Ocean City hotels', 'Bethany Beach houses'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'nightlife', 'value'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['beach', 'nightlife'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 120,
    estimatedCost: '$1,000-$2,100 per person before flights',
    sourceUrl: 'https://baywoodgreens.com/',
  },
  {
    id: 'hawaii-island-maui',
    name: 'Hawaii Resort Golf Split',
    location: 'Kohala Coast and Maui, Hawaii',
    states: ['HI'],
    regions: ['west-coast'],
    summary: 'A premium resort trip built around scenery, beach time, and famous-but-worth-it island golf.',
    hiddenGemAngle: 'This is not a hidden gem on price, but it gives planners a clear island answer when non-golf experience matters as much as the tee sheet.',
    courses: ['Mauna Kea', 'Mauna Lani South', 'Wailea Gold', 'Kapalua Plantation'],
    lodging: ['Kohala Coast resorts', 'Wailea condos', 'Kaanapali hotels'],
    bestMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    budget: 'bucket',
    strengths: ['resort-comfort', 'course-quality', 'nightlife'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['beach', 'outdoors'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 4,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 30,
    estimatedCost: '$4,500-$8,000+ per person before flights',
    sourceUrl: 'https://www.maunakearesort.com/golf/',
  },
  {
    id: 'galena-illinois',
    name: 'Galena and Chicagoland Prairie Loop',
    location: 'Galena, Elgin, and Romeoville, Illinois',
    states: ['IL'],
    regions: ['midwest'],
    summary: 'A Midwest group trip with resort lodging in Galena and accessible public golf closer to Chicago.',
    hiddenGemAngle: 'Illinois gives planners a practical Midwest answer that is easier to assemble than more remote architecture trips.',
    courses: ['The General at Eagle Ridge', 'Highlands of Elgin', 'Mistwood Golf Club', 'Prairie Landing'],
    lodging: ['Eagle Ridge Resort', 'Galena rentals', 'Chicago suburbs hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'easy-travel', 'value'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'history'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 100,
    estimatedCost: '$900-$1,900 per person before flights',
    sourceUrl: 'https://www.eagleridge.com/golf/the-general/',
  },
  {
    id: 'french-lick-indiana',
    name: 'French Lick Championship Resort',
    location: 'French Lick, Indiana',
    states: ['IN'],
    regions: ['midwest'],
    summary: 'A polished resort trip with historic hotels, casino energy, and two strong championship courses.',
    hiddenGemAngle: 'French Lick is known regionally, but still works as a less-obvious national resort option for Midwest groups.',
    courses: ['Pete Dye Course', 'Donald Ross Course', 'Sultan Run', 'Pfau Course at Indiana University'],
    lodging: ['French Lick Springs Hotel', 'West Baden Springs Hotel', 'Bloomington hotels'],
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    budget: 'premium',
    strengths: ['resort-comfort', 'course-quality', 'hidden-gems'],
    hiddenGemTypes: ['architecture', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'history'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 5,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 100,
    estimatedCost: '$1,800-$3,400 per person before flights',
    sourceUrl: 'https://www.frenchlick.com/golf',
  },
  {
    id: 'bourbon-trail-kentucky',
    name: 'Kentucky Bourbon Trail Golf',
    location: 'Louisville and Lexington, Kentucky',
    states: ['KY'],
    regions: ['southeast'],
    summary: 'A social-first golf trip that pairs solid public courses with bourbon, restaurants, and easy lodging.',
    hiddenGemAngle: 'The hook is not a single bucket-list course; it is a group-friendly Kentucky itinerary that has more personality than a generic city golf weekend.',
    courses: ['Heritage Hill', 'Lassing Pointe', 'Kearney Hill', 'Nevel Meade'],
    lodging: ['Louisville hotels', 'Lexington hotels', 'Bourbon Trail rentals'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'nightlife', 'value'],
    hiddenGemTypes: ['local-culture', 'value'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['history', 'nightlife'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 20,
    estimatedCost: '$800-$1,700 per person before flights',
    sourceUrl: 'https://www.heritagehillgolf.com/',
  },
  {
    id: 'louisiana-gulf-casino',
    name: 'Louisiana Gulf and Casino Golf',
    location: 'New Orleans, Baton Rouge, and Lake Charles, Louisiana',
    states: ['LA'],
    regions: ['southeast'],
    summary: 'A food-and-nightlife trip with casino options and enough public golf to keep the rounds credible.',
    hiddenGemAngle: 'Louisiana gives the app a culture-first golf trip instead of another pure-resort recommendation.',
    courses: ['TPC Louisiana', 'Carter Plantation', 'Contraband Bayou', 'Audubon Park'],
    lodging: ['New Orleans hotels', 'Lake Charles casino hotels', 'Baton Rouge hotels'],
    bestMonths: [2, 3, 4, 10, 11],
    budget: 'standard',
    strengths: ['nightlife', 'hidden-gems', 'easy-travel'],
    hiddenGemTypes: ['local-culture', 'value'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'casino', 'history'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 3,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 30,
    estimatedCost: '$900-$1,900 per person before flights',
    sourceUrl: 'https://tpc.com/louisiana/',
  },
  {
    id: 'maine-lakes-coast',
    name: 'Maine Lakes and Coast Summer Golf',
    location: 'Belgrade Lakes, Rockport, and Carrabassett Valley, Maine',
    states: ['ME'],
    regions: ['northeast'],
    summary: 'A summer New England route with lakes, coast, mountain scenery, and lodge-style lodging.',
    hiddenGemAngle: 'Maine produces a true regional-discovery answer for groups that want character and scenery over resort polish.',
    courses: ['Belgrade Lakes', 'Samoset Resort', 'Sugarloaf Golf Club', 'Sunday River Golf Club'],
    lodging: ['Belgrade lake houses', 'Samoset Resort', 'mountain condos'],
    bestMonths: [6, 7, 8, 9],
    budget: 'premium',
    strengths: ['hidden-gems', 'course-quality'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'history'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 4,
    airportDriveMinutes: 75,
    estimatedCost: '$1,600-$3,000 per person before flights',
    sourceUrl: 'https://www.belgradelakesgolf.com/',
  },
  {
    id: 'cape-cod-western-mass',
    name: 'Massachusetts Cape and Valley Loop',
    location: 'Plymouth, Bernardston, and the Berkshires, Massachusetts',
    states: ['MA'],
    regions: ['northeast'],
    summary: 'A public-access architecture loop with coastal lodging options and a stronger course mix than a standard Boston weekend.',
    hiddenGemAngle: 'This adds a Northeast architecture/value answer without relying on private-club access.',
    courses: ['Pinehills Jones Course', 'Pinehills Nicklaus Course', 'Crumpin-Fox', 'Wachusett Country Club'],
    lodging: ['Plymouth hotels', 'Cape rentals', 'Berkshire inns'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'course-quality', 'value'],
    hiddenGemTypes: ['architecture', 'value'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['history', 'beach'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    airportDriveMinutes: 45,
    estimatedCost: '$1,200-$2,400 per person before flights',
    sourceUrl: 'https://www.pinehillsgolf.com/',
  },
  {
    id: 'branson-ozarks',
    name: 'Branson Ozarks Golf Base',
    location: 'Branson, Missouri',
    states: ['MO'],
    regions: ['midwest'],
    summary: 'A course-dense Ozarks trip with resort lodging, lake activities, and enough golf variety for three to five rounds.',
    hiddenGemAngle: 'Branson is not obscure, but it is a high-functioning golf base that can be tuned for value or premium resort comfort.',
    courses: ['Ozarks National', 'Buffalo Ridge', 'Paynes Valley', 'Branson Hills'],
    lodging: ['Big Cedar Lodge', 'Branson hotels', 'lake condos'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'premium',
    strengths: ['resort-comfort', 'course-quality', 'hidden-gems'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'nightlife'],
    shortCourses: true,
    travelEase: 3,
    courseQuality: 5,
    mainstreamSaturationScore: 4,
    grassrootsSignalScore: 4,
    airportDriveMinutes: 20,
    estimatedCost: '$2,000-$4,000 per person before flights',
    sourceUrl: 'https://bigcedar.com/golf/',
  },
  {
    id: 'montana-wilderness',
    name: 'Montana Mountain and Lake Golf',
    location: 'Eureka and Whitefish, Montana',
    states: ['MT'],
    regions: ['mountain-west'],
    summary: 'A summer mountain trip with dramatic scenery, lodge-style lodging, and courses that feel far from standard resort golf.',
    hiddenGemAngle: 'Montana gives the recommendation engine a remote-scenery answer with enough lodging to be viable for a group.',
    courses: ['Wilderness Club', 'Whitefish Lake North', 'Whitefish Lake South', 'Buffalo Hill'],
    lodging: ['Wilderness Club villas', 'Whitefish rentals', 'Kalispell hotels'],
    bestMonths: [6, 7, 8, 9],
    budget: 'premium',
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 70,
    estimatedCost: '$1,900-$3,700 per person before flights',
    sourceUrl: 'https://www.wildernessclubmontana.com/golf/',
  },
  {
    id: 'dakotas-badlands',
    name: 'Dakotas Badlands and Black Hills',
    location: 'Medora, Rapid City, and Spearfish',
    states: ['ND', 'SD'],
    regions: ['plains'],
    summary: 'A scenic road-trip route with public golf, national-park energy, and low mainstream saturation.',
    hiddenGemAngle: 'The Dakotas are a genuine discovery lane: the trip is about landscape, value, and the route as much as the golf.',
    courses: ['Bully Pulpit', 'Elkhorn Ridge', 'Hart Ranch', 'The Golf Club at Red Rock'],
    lodging: ['Medora hotels', 'Spearfish hotels', 'Black Hills cabins'],
    bestMonths: [6, 7, 8, 9],
    budget: 'value',
    strengths: ['hidden-gems', 'value'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'history'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 45,
    estimatedCost: '$800-$1,700 per person before flights',
    sourceUrl: 'https://bullypulpitgolfcourse.com/',
  },
  {
    id: 'new-hampshire-vermont-mountains',
    name: 'New Hampshire and Vermont Mountain Loop',
    location: 'White Mountains and Green Mountains',
    states: ['NH', 'VT'],
    regions: ['northeast'],
    summary: 'A mountain-and-lake New England trip with resort lodging, scenic drives, and summer/fall timing.',
    hiddenGemAngle: 'This route gives Northeast planners a cooler-weather alternative to beach or casino golf.',
    courses: ['Owl’s Nest', 'Omni Mount Washington', 'Green Mountain National', 'Lake Morey'],
    lodging: ['Owl’s Nest Resort', 'White Mountains inns', 'Killington rentals'],
    bestMonths: [6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'resort-comfort'],
    hiddenGemTypes: ['scenery', 'local-culture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'history'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 90,
    estimatedCost: '$1,200-$2,500 per person before flights',
    sourceUrl: 'https://www.owlsnestresort.com/golf/',
  },
  {
    id: 'crystal-springs-atlantic-city',
    name: 'New Jersey Highlands and Shore',
    location: 'Hamburg and Atlantic City, New Jersey',
    states: ['NJ'],
    regions: ['northeast'],
    summary: 'A flexible New Jersey trip that can lean resort, casino, or coastal depending on the group.',
    hiddenGemAngle: 'New Jersey is easy to overlook for golf travel, but the course density and lodging choices make it practical.',
    courses: ['Ballyowen', 'Wild Turkey', 'Twisted Dune', 'Seaview Bay'],
    lodging: ['Crystal Springs Resort', 'Atlantic City casino hotels', 'shore rentals'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'nightlife', 'easy-travel'],
    hiddenGemTypes: ['value', 'scenery'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'nightlife', 'beach'],
    shortCourses: false,
    travelEase: 5,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 70,
    estimatedCost: '$1,100-$2,400 per person before flights',
    sourceUrl: 'https://www.crystalgolfresort.com/',
  },
  {
    id: 'mesquite-nevada',
    name: 'Mesquite Desert Value Run',
    location: 'Mesquite, Nevada and St George, Utah',
    states: ['NV', 'UT'],
    regions: ['southwest', 'mountain-west'],
    summary: 'A desert road-trip base with dramatic courses, casino lodging, and easier pricing than many Scottsdale trips.',
    hiddenGemAngle: 'Mesquite and St George produce the desert scenery payoff without forcing every group into the same Phoenix itinerary.',
    courses: ['Wolf Creek', 'Conestoga', 'Sand Hollow', 'Copper Rock'],
    lodging: ['Mesquite casino hotels', 'St George rentals', 'Hurricane hotels'],
    bestMonths: [2, 3, 4, 5, 9, 10, 11],
    budget: 'standard',
    strengths: ['hidden-gems', 'course-quality', 'value'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'outdoors'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 4,
    airportDriveMinutes: 75,
    estimatedCost: '$1,200-$2,400 per person before flights',
    sourceUrl: 'https://www.golfwolfcreek.com/',
  },
  {
    id: 'turning-stone-finger-lakes',
    name: 'Turning Stone and Finger Lakes',
    location: 'Verona, Cooperstown, and Saratoga, New York',
    states: ['NY'],
    regions: ['northeast'],
    summary: 'A polished casino-resort base with enough nearby golf and culture to support a longer Northeast trip.',
    hiddenGemAngle: 'Turning Stone gives planners a Northeast resort answer that is less obvious nationally than the coastal icons.',
    courses: ['Atunyote', 'Kaluhyat', 'Shenendoah', 'Leatherstocking'],
    lodging: ['Turning Stone Resort Casino', 'Cooperstown inns', 'Saratoga hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'premium',
    strengths: ['resort-comfort', 'course-quality', 'hidden-gems'],
    hiddenGemTypes: ['local-culture', 'value'],
    routeStyles: ['home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'history', 'nightlife'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 40,
    estimatedCost: '$1,600-$3,000 per person before flights',
    sourceUrl: 'https://www.turningstone.com/golf',
  },
  {
    id: 'central-ohio',
    name: 'Central Ohio Public Golf Run',
    location: 'Columbus, Granville, and Akron, Ohio',
    states: ['OH'],
    regions: ['midwest'],
    summary: 'A value-forward Midwest loop with one heavyweight public anchor and easy city logistics.',
    hiddenGemAngle: 'Ohio has enough public-golf depth to support a real trip without needing resort packaging.',
    courses: ['The Virtues', 'Denison Golf Club', 'Firestone Public 9', 'Cumberland Trail'],
    lodging: ['Columbus hotels', 'Granville inns', 'Akron hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'value',
    strengths: ['hidden-gems', 'value', 'easy-travel'],
    hiddenGemTypes: ['value', 'architecture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart', 'walking'],
    nonGolfAmenities: ['nightlife', 'history'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 4,
    airportDriveMinutes: 40,
    estimatedCost: '$800-$1,600 per person before flights',
    sourceUrl: 'https://www.thevirtuesgolfclub.com/',
  },
  {
    id: 'oklahoma-lakes',
    name: 'Oklahoma Lakes and Casino Golf',
    location: 'Tulsa, Grand Lake, and Thackerville, Oklahoma',
    states: ['OK'],
    regions: ['plains'],
    summary: 'A value-and-casino route with lake lodging, public golf, and straightforward regional airport access.',
    hiddenGemAngle: 'Oklahoma is exactly the kind of state filter that needs catalog coverage: overlooked, affordable, and viable for regional groups.',
    courses: ['Shangri-La Golf Club', 'Chickasaw Pointe', 'Forest Ridge', 'Cherokee Hills'],
    lodging: ['Shangri-La Resort', 'Grand Lake rentals', 'Tulsa hotels', 'casino hotels'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'value', 'nightlife'],
    hiddenGemTypes: ['value', 'local-culture'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['casino', 'outdoors'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 75,
    estimatedCost: '$800-$1,700 per person before flights',
    sourceUrl: 'https://shangrilaok.com/golf/',
  },
  {
    id: 'laurel-highlands-pa',
    name: 'Pennsylvania Laurel Highlands',
    location: 'Farmington, Bedford, and Pittsburgh, Pennsylvania',
    states: ['PA'],
    regions: ['northeast'],
    summary: 'A mountain-and-history route with resort lodging, classic architecture, and enough nearby city access.',
    hiddenGemAngle: 'It gives Northeast planners a resort-quality trip without defaulting to New England or New Jersey shore options.',
    courses: ['Mystic Rock', 'Shepherd’s Rock', 'Olde Stonewall', 'Bedford Springs Old Course'],
    lodging: ['Nemacolin', 'Omni Bedford Springs', 'Pittsburgh hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'premium',
    strengths: ['course-quality', 'resort-comfort', 'hidden-gems'],
    hiddenGemTypes: ['architecture', 'scenery'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['history', 'outdoors'],
    shortCourses: false,
    travelEase: 3,
    courseQuality: 4,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 75,
    estimatedCost: '$1,800-$3,600 per person before flights',
    sourceUrl: 'https://www.nemacolin.com/golf/',
  },
  {
    id: 'texas-hill-country',
    name: 'Texas Hill Country Golf Weekend',
    location: 'Austin, San Antonio, and Horseshoe Bay, Texas',
    states: ['TX'],
    regions: ['plains', 'southwest'],
    summary: 'A social golf trip with resort options, barbecue, nightlife, and enough course variety to support big groups.',
    hiddenGemAngle: 'Texas is too large for one answer, but Hill Country is the most group-friendly starting point.',
    courses: ['Omni Barton Creek Fazio Canyons', 'La Cantera Resort Course', 'Horseshoe Bay Slick Rock', 'TPC San Antonio Oaks'],
    lodging: ['Austin hotels', 'La Cantera Resort', 'Horseshoe Bay condos'],
    bestMonths: [3, 4, 5, 10, 11],
    budget: 'premium',
    strengths: ['nightlife', 'resort-comfort', 'easy-travel'],
    hiddenGemTypes: ['local-culture', 'scenery'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['nightlife', 'history', 'outdoors'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 4,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 25,
    estimatedCost: '$1,800-$3,500 per person before flights',
    sourceUrl: 'https://www.omnihotels.com/hotels/austin-barton-creek/golf',
  },
  {
    id: 'virginia-williamsburg-shenandoah',
    name: 'Virginia Williamsburg and Shenandoah',
    location: 'Williamsburg, Richmond, and Meadows of Dan, Virginia',
    states: ['VA'],
    regions: ['southeast'],
    summary: 'A history-and-scenery trip with resort lodging, restored architecture, and a flexible road-trip shape.',
    hiddenGemAngle: 'Virginia can be a more interesting planner answer than another Carolinas itinerary when history and scenery matter.',
    courses: ['Golden Horseshoe Gold', 'Royal New Kent', 'Independence Golf Club', 'Primland Highland Course'],
    lodging: ['Williamsburg resorts', 'Richmond hotels', 'Blue Ridge cabins'],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 'premium',
    strengths: ['hidden-gems', 'course-quality', 'resort-comfort'],
    hiddenGemTypes: ['architecture', 'local-culture', 'scenery'],
    routeStyles: ['home-base', 'road-trip'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['history', 'outdoors'],
    shortCourses: false,
    travelEase: 4,
    courseQuality: 4,
    mainstreamSaturationScore: 2,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 45,
    estimatedCost: '$1,500-$3,300 per person before flights',
    sourceUrl: 'https://www.colonialwilliamsburghotels.com/golf/golden-horseshoe-golf-club/',
  },
  {
    id: 'gamble-sands-washington',
    name: 'Washington Columbia River and Wine Country',
    location: 'Brewster, Walla Walla, and Tacoma, Washington',
    states: ['WA'],
    regions: ['west-coast'],
    summary: 'A Northwest route with big-land golf, wine-country lodging, and one major public bucket-list course.',
    hiddenGemAngle: 'Washington gives the catalog a true Pacific Northwest answer beyond Bandon-adjacent thinking.',
    courses: ['Gamble Sands', 'Wine Valley', 'Chambers Bay', 'Palouse Ridge'],
    lodging: ['Gamble Sands lodging', 'Walla Walla hotels', 'Tacoma hotels'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'premium',
    strengths: ['course-quality', 'hidden-gems'],
    hiddenGemTypes: ['scenery', 'architecture'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['walking', 'cart'],
    nonGolfAmenities: ['outdoors', 'nightlife'],
    shortCourses: true,
    travelEase: 2,
    courseQuality: 5,
    mainstreamSaturationScore: 3,
    grassrootsSignalScore: 5,
    airportDriveMinutes: 160,
    estimatedCost: '$1,900-$3,600 per person before flights',
    sourceUrl: 'https://www.gamblesands.com/',
  },
  {
    id: 'west-virginia-mountains',
    name: 'West Virginia Mountain Value Loop',
    location: 'Roanoke, Stonewall, and Snowshoe-adjacent West Virginia',
    states: ['WV'],
    regions: ['southeast'],
    summary: 'A scenic mountain trip with resort lodging, strong value, and enough non-golf outdoor appeal for a long weekend.',
    hiddenGemAngle: 'West Virginia gives the planner a true under-the-radar mountain answer with real group logistics.',
    courses: ['Stonewall Resort', 'The Raven', 'Oglebay Jones Course', 'Pete Dye Golf Club'],
    lodging: ['Stonewall Resort', 'Snowshoe rentals', 'Oglebay Resort'],
    bestMonths: [5, 6, 7, 8, 9, 10],
    budget: 'standard',
    strengths: ['hidden-gems', 'value'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['road-trip', 'home-base'],
    polish: 'polished',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: false,
    travelEase: 2,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 3,
    airportDriveMinutes: 95,
    estimatedCost: '$800-$1,700 per person before flights',
    sourceUrl: 'https://www.stonewallresort.com/golf',
  },
  {
    id: 'wyoming-high-plains',
    name: 'Wyoming High Plains Golf Run',
    location: 'Casper, Sheridan, and Cheyenne, Wyoming',
    states: ['WY'],
    regions: ['mountain-west'],
    summary: 'A remote-value route with wide-open landscapes, simple lodging, and a trip shape built for groups that enjoy driving.',
    hiddenGemAngle: 'Wyoming is not a standard buddies-trip answer, which makes it useful for the app’s true-discovery lane.',
    courses: ['Three Crowns', 'Kendrick Golf Course', 'Bell Nob', 'Jacoby Golf Course'],
    lodging: ['Casper hotels', 'Sheridan hotels', 'Laramie hotels'],
    bestMonths: [6, 7, 8, 9],
    budget: 'value',
    strengths: ['hidden-gems', 'value'],
    hiddenGemTypes: ['scenery', 'value'],
    routeStyles: ['road-trip'],
    polish: 'grassroots',
    walkingStyles: ['cart'],
    nonGolfAmenities: ['outdoors', 'none'],
    shortCourses: false,
    travelEase: 1,
    courseQuality: 3,
    mainstreamSaturationScore: 1,
    grassrootsSignalScore: 2,
    airportDriveMinutes: 15,
    estimatedCost: '$700-$1,500 per person before flights',
    sourceUrl: 'https://www.threecrownsgolfclub.com/',
  },
];

const ADDITIONAL_TRIP_IDEAS: TripIdea[] = ADDITIONAL_US_TRIP_SEEDS.map(seedToTripIdea);
const ALL_TRIP_IDEAS: TripIdea[] = [...TRIP_IDEAS, ...ADDITIONAL_TRIP_IDEAS];
const ADDITIONAL_US_GEO_BY_TRIP_ID = Object.fromEntries(
  ADDITIONAL_US_TRIP_SEEDS.map((seed) => [seed.id, { states: seed.states, regions: seed.regions }])
) as Record<string, { states: string[]; regions: UsRegion[] }>;

const DEFAULT_FORM: TripIdeaForm = {
  groupSize: 8,
  rounds: 4,
  nights: 3,
  month: '',
  year: String(new Date().getFullYear() + 1),
  budget: 'standard',
  region: 'us',
  usRegion: 'any',
  selectedStates: [],
  priority: 'hidden-gems',
  lodging: 'flexible',
  groupStyle: 'mixed',
  discoveryMode: 'hidden',
  driveTolerance: 'moderate',
  polish: 'either',
  scarcity: 'some',
  routeStyle: 'either',
  hiddenGemType: 'flexible',
  shortCourses: 'flexible',
  walkingPreference: 'either',
  amenity: 'flexible',
};

const BUDGET_ORDER: BudgetRange[] = ['value', 'standard', 'premium', 'bucket'];

export default function TripIdeas() {
  const [form, setForm] = useState<TripIdeaForm>(DEFAULT_FORM);
  const recommendations = useMemo(() => rankTripIdeas(form), [form]);
  const topRecommendations = recommendations.slice(0, 3);

  function updateForm<K extends keyof TripIdeaForm>(field: K, value: TripIdeaForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleRegionPreferenceChange(value: RegionPreference) {
    setForm((current) => ({
      ...current,
      region: value,
      usRegion: value === 'international' ? 'any' : current.usRegion,
      selectedStates: value === 'international' ? [] : current.selectedStates,
    }));
  }

  function handleUsRegionChange(value: UsRegionPreference) {
    const availableStates = stateOptionsForRegion(value).map(([state]) => state);
    setForm((current) => ({
      ...current,
      usRegion: value,
      selectedStates: current.selectedStates.filter((state) => availableStates.includes(state)),
    }));
  }

  function toggleState(state: string) {
    setForm((current) => ({
      ...current,
      selectedStates: current.selectedStates.includes(state)
        ? current.selectedStates.filter((selectedState) => selectedState !== state)
        : [...current.selectedStates, state],
    }));
  }

  function handleNumberChange(field: 'groupSize' | 'rounds' | 'nights', value: string) {
    const limits = {
      groupSize: { min: 2, max: 40 },
      rounds: { min: 1, max: 8 },
      nights: { min: 1, max: 10 },
    };
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const bounded = Math.max(limits[field].min, Math.min(limits[field].max, Math.round(parsed)));
    updateForm(field, bounded);
  }

  return (
    <Layout contentWidth="wide">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-emerald-900 bg-slate-950 shadow-2xl">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                Hidden Gem Finder
              </div>
              <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
                Find the trip Google misses.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                Recommendations now reward credible obscurity: public access, real course quality, group logistics, grassroots buzz, and a reason the destination is not the obvious answer.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-lg font-black text-white">Planning Snapshot</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <SummaryStat label="Group" value={`${form.groupSize} players`} />
                <SummaryStat label="Golf" value={`${form.rounds} rounds`} />
                <SummaryStat label="Discovery" value={form.discoveryMode === 'hidden' ? 'Hidden first' : form.discoveryMode === 'balanced' ? 'Balanced' : 'Known anchors'} />
                <SummaryStat label="Area" value={tripAreaSummary(form)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
          <form className="card h-fit space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <h2 className="text-xl font-black">Trip Inputs</h2>
              <p className="mt-1 text-sm text-slate-400">
                The extra questions separate credible hidden gems from random cheap golf.
              </p>
            </div>

            <RadioGroup
              label="Discovery style"
              value={form.discoveryMode}
              options={[
                ['hidden', 'Hidden gems first'],
                ['balanced', 'Balance gem + comfort'],
                ['classic', 'Famous resort trips'],
              ]}
              onChange={(value) => updateForm('discoveryMode', value as DiscoveryMode)}
            />

            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Players" value={form.groupSize} min={2} max={40} onChange={(value) => handleNumberChange('groupSize', value)} />
              <NumberField label="Rounds" value={form.rounds} min={1} max={8} onChange={(value) => handleNumberChange('rounds', value)} />
              <NumberField label="Nights" value={form.nights} min={1} max={10} onChange={(value) => handleNumberChange('nights', value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select className="input" value={form.month} onChange={(e) => updateForm('month', e.target.value)}>
                  {MONTHS.map((month) => (
                    <option key={month.value || 'flex'} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input
                  className="input"
                  type="number"
                  min="2026"
                  max="2035"
                  value={form.year}
                  onChange={(e) => updateForm('year', e.target.value)}
                />
              </div>
            </div>

            <RadioGroup
              label="Budget per person"
              value={form.budget}
              options={[
                ['value', BUDGET_LABELS.value],
                ['standard', BUDGET_LABELS.standard],
                ['premium', BUDGET_LABELS.premium],
                ['bucket', BUDGET_LABELS.bucket],
              ]}
              onChange={(value) => updateForm('budget', value as BudgetRange)}
            />

            <RadioGroup
              label="Geography"
              value={form.region}
              options={[
                ['us', 'United States'],
                ['international', 'International'],
                ['either', 'Either'],
              ]}
              onChange={(value) => handleRegionPreferenceChange(value as RegionPreference)}
            />

            {form.region !== 'international' && (
              <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
                <SelectField
                  label="US region"
                  value={form.usRegion}
                  options={[
                    ['any', US_REGION_LABELS.any],
                    ['northeast', US_REGION_LABELS.northeast],
                    ['southeast', US_REGION_LABELS.southeast],
                    ['midwest', US_REGION_LABELS.midwest],
                    ['plains', US_REGION_LABELS.plains],
                    ['mountain-west', US_REGION_LABELS['mountain-west']],
                    ['southwest', US_REGION_LABELS.southwest],
                    ['west-coast', US_REGION_LABELS['west-coast']],
                  ]}
                  onChange={(value) => handleUsRegionChange(value as UsRegionPreference)}
                />
                <StateSelector
                  stateOptions={stateOptionsForRegion(form.usRegion)}
                  selectedStates={form.selectedStates}
                  onToggle={toggleState}
                  onClear={() => updateForm('selectedStates', [])}
                />
              </div>
            )}

            <div>
              <label className="label">Main decision driver</label>
              <select className="input" value={form.priority} onChange={(e) => updateForm('priority', e.target.value as TripPriority)}>
                <option value="hidden-gems">{PRIORITY_LABELS['hidden-gems']}</option>
                <option value="course-quality">{PRIORITY_LABELS['course-quality']}</option>
                <option value="easy-travel">{PRIORITY_LABELS['easy-travel']}</option>
                <option value="value">{PRIORITY_LABELS.value}</option>
                <option value="nightlife">{PRIORITY_LABELS.nightlife}</option>
                <option value="resort-comfort">{PRIORITY_LABELS['resort-comfort']}</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SelectField
                label="Hidden-gem type"
                value={form.hiddenGemType}
                options={[
                  ['flexible', HIDDEN_GEM_LABELS.flexible],
                  ['architecture', HIDDEN_GEM_LABELS.architecture],
                  ['value', HIDDEN_GEM_LABELS.value],
                  ['scenery', HIDDEN_GEM_LABELS.scenery],
                  ['municipal-revival', HIDDEN_GEM_LABELS['municipal-revival']],
                  ['new-restored', HIDDEN_GEM_LABELS['new-restored']],
                  ['local-culture', HIDDEN_GEM_LABELS['local-culture']],
                ]}
                onChange={(value) => updateForm('hiddenGemType', value as HiddenGemType)}
              />
              <SelectField
                label="Airport drive"
                value={form.driveTolerance}
                options={[
                  ['easy', DRIVE_LABELS.easy],
                  ['moderate', DRIVE_LABELS.moderate],
                  ['remote', DRIVE_LABELS.remote],
                ]}
                onChange={(value) => updateForm('driveTolerance', value as DriveTolerance)}
              />
              <SelectField
                label="Trip shape"
                value={form.routeStyle}
                options={[
                  ['either', 'Either'],
                  ['home-base', 'One home base'],
                  ['road-trip', 'Road-trip loop'],
                ]}
                onChange={(value) => updateForm('routeStyle', value as RouteStyle)}
              />
              <SelectField
                label="Tee-time scarcity"
                value={form.scarcity}
                options={[
                  ['some', 'Some is okay'],
                  ['avoid', 'Avoid scarce access'],
                  ['embrace', 'Worth planning ahead'],
                ]}
                onChange={(value) => updateForm('scarcity', value as ScarcityTolerance)}
              />
              <SelectField
                label="Polish level"
                value={form.polish}
                options={[
                  ['either', 'Either'],
                  ['polished', 'Polished resort/base'],
                  ['grassroots', 'Local/grassroots'],
                ]}
                onChange={(value) => updateForm('polish', value as PolishPreference)}
              />
              <SelectField
                label="Lodging style"
                value={form.lodging}
                options={[
                  ['flexible', 'Flexible'],
                  ['resort', 'Full resort'],
                  ['villa', 'Villas or condos'],
                  ['hotel', 'Hotel rooms'],
                  ['cabin', 'Cabins'],
                ]}
                onChange={(value) => updateForm('lodging', value as LodgingPreference)}
              />
              <SelectField
                label="Short courses"
                value={form.shortCourses}
                options={[
                  ['flexible', 'Flexible'],
                  ['yes', 'Welcome them'],
                  ['no', 'Full rounds only'],
                ]}
                onChange={(value) => updateForm('shortCourses', value as ShortCoursePreference)}
              />
              <SelectField
                label="Walking or carts"
                value={form.walkingPreference}
                options={[
                  ['either', 'Either'],
                  ['walking', 'Walking/caddie feel'],
                  ['cart', 'Cart-friendly'],
                ]}
                onChange={(value) => updateForm('walkingPreference', value as WalkCartPreference)}
              />
              <SelectField
                label="Non-golf hook"
                value={form.amenity}
                options={[
                  ['flexible', 'Flexible'],
                  ['nightlife', 'Nightlife'],
                  ['casino', 'Casino'],
                  ['beach', 'Beach'],
                  ['outdoors', 'Outdoors'],
                  ['history', 'History/culture'],
                  ['none', 'Golf only'],
                ]}
                onChange={(value) => updateForm('amenity', value as AmenityPreference)}
              />
              <SelectField
                label="Group vibe"
                value={form.groupStyle}
                options={[
                  ['mixed', 'Mixed'],
                  ['competitive', 'Competition first'],
                  ['social', 'Social first'],
                ]}
                onChange={(value) => updateForm('groupStyle', value as GroupStyle)}
              />
            </div>
          </form>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Recommended Trips</h2>
                <p className="text-sm text-slate-400">Ranked for fit, golf evidence, differentiation, and bookability.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setForm(DEFAULT_FORM)}>
                Reset
              </button>
            </div>

            <div className="grid gap-4">
              {topRecommendations.map((idea, index) => (
                <TripIdeaCard key={idea.id} idea={idea} rank={index + 1} form={form} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function rankTripIdeas(form: TripIdeaForm): RankedTripIdea[] {
  const month = Number(form.month);
  const leadMonths = tripLeadMonths(form);

  return ALL_TRIP_IDEAS.map((idea) => {
    let score = 0;
    const matchReasons: string[] = [];
    const usGeo = usGeoForTrip(idea);
    const viabilityScore = idea.publicAccessQuality + idea.lodgingCapacityScore + idea.groupLogisticsScore + Math.min(5, idea.courseClusterCount);
    const differentiationScore = (6 - idea.mainstreamSaturationScore) + idea.grassrootsSignalScore;

    if (form.region === 'either' || form.region === idea.region) {
      score += 18;
      matchReasons.push(form.region === 'either' ? 'Fits either geography' : `Matches ${form.region === 'us' ? 'US' : 'international'} preference`);
    } else {
      score -= 22;
    }

    if (form.region !== 'international' && form.usRegion !== 'any') {
      if (idea.region === 'us' && usGeo?.regions.includes(form.usRegion)) {
        score += 38;
        matchReasons.push(`${US_REGION_LABELS[form.usRegion]} match`);
      } else if (idea.region === 'us') {
        score -= 40;
      } else {
        score -= 24;
      }
    }

    if (form.region !== 'international' && form.selectedStates.length > 0) {
      if (idea.region === 'us' && usGeo && hasStateOverlap(usGeo.states, form.selectedStates)) {
        score += 90;
        matchReasons.push(`${stateListLabel(form.selectedStates)} state fit`);
      } else if (idea.region === 'us') {
        score -= 95;
      } else {
        score -= 70;
      }
    }

    if (!form.month) {
      score += 6;
      matchReasons.push('Flexible dates improve booking options');
    } else if (idea.bestMonths.includes(month)) {
      score += 14;
      matchReasons.push('Strong seasonal fit');
    } else {
      score -= 9;
    }

    if (leadMonths !== null) {
      if (leadMonths < 0) {
        score -= 24;
      } else if (leadMonths < 4 && idea.teeTimeScarcity >= 4) {
        score -= 14;
      } else if (leadMonths >= 9 && idea.teeTimeScarcity >= 4) {
        score += 8;
        matchReasons.push('Advance planning helps unlock scarce tee times');
      } else if (leadMonths >= 3) {
        score += 2;
      }
    }

    const budgetGap = Math.abs(BUDGET_ORDER.indexOf(form.budget) - BUDGET_ORDER.indexOf(idea.budget));
    score += Math.max(0, 14 - budgetGap * 7);
    if (budgetGap === 0) {
      matchReasons.push('Budget range aligns');
    } else if (budgetGap === 1) {
      matchReasons.push('Budget is close with planning tradeoffs');
    }

    if (form.groupSize >= idea.minGroupSize && form.groupSize <= idea.maxGroupSize) {
      score += 10;
      matchReasons.push('Group size fits available lodging');
    } else {
      score -= 10;
    }

    if (form.rounds >= idea.minRounds && form.rounds <= idea.courseClusterCount + 1) {
      score += 8;
      matchReasons.push('Course cluster supports the round count');
    } else if (form.rounds < idea.minRounds) {
      score -= 5;
    } else {
      score -= 8;
    }

    const recommendedNights = recommendedNightCount(form.rounds, idea.airportDriveMinutes, idea.routeStyles.includes('road-trip'));
    const nightGap = form.nights - recommendedNights;
    if (nightGap >= 0) {
      score += Math.max(2, 8 - Math.min(nightGap, 3) * 2);
      matchReasons.push('Trip length fits the route');
      if (form.nights >= 5 && idea.nonGolfAmenities.length >= 3) {
        score += 4;
      }
    } else {
      score -= Math.min(18, Math.abs(nightGap) * 6);
    }

    if (idea.strengths.includes(form.priority)) {
      score += 16;
      matchReasons.push(`${PRIORITY_LABELS[form.priority]} is a core strength`);
    } else {
      score -= 4;
    }

    if (form.discoveryMode === 'hidden') {
      score += differentiationScore * 3;
      if (idea.mainstreamSaturationScore <= 2) {
        matchReasons.push('Low mainstream saturation');
      }
      if (idea.mainstreamSaturationScore >= 4) {
        score -= 18;
      }
    } else if (form.discoveryMode === 'balanced') {
      score += differentiationScore * 1.5 + viabilityScore;
    } else {
      score += idea.mainstreamSaturationScore * 5 + viabilityScore * 1.5 - idea.teeTimeScarcity;
      if (idea.mainstreamSaturationScore >= 4) {
        matchReasons.push('Proven popular destination');
      }
      if (idea.polish === 'polished') {
        score += 8;
      } else {
        score -= 4;
      }
      if (idea.mainstreamSaturationScore < 4) {
        score -= 24;
      }
    }

    if (form.hiddenGemType === 'flexible' || idea.hiddenGemTypes.includes(form.hiddenGemType)) {
      score += 10;
      if (form.hiddenGemType !== 'flexible') {
        matchReasons.push(`${HIDDEN_GEM_LABELS[form.hiddenGemType]} angle matches`);
      }
    } else {
      score -= 8;
    }

    if (driveFits(form.driveTolerance, idea.airportDriveMinutes)) {
      score += 9;
      matchReasons.push('Drive tolerance fits');
    } else {
      score -= form.driveTolerance === 'easy' ? 12 : 6;
    }

    if (form.lodging === 'flexible') {
      score += 2;
    } else if (idea.lodgingStyles.includes(form.lodging)) {
      score += 10;
      matchReasons.push('Lodging preference fits');
    } else {
      score -= 8;
    }

    if (form.polish === 'either') {
      score += 2;
    } else if (form.polish === idea.polish) {
      score += 9;
      matchReasons.push('Polish level matches');
    } else {
      score -= 7;
    }

    if (form.routeStyle === 'either') {
      score += 2;
    } else if (idea.routeStyles.includes(form.routeStyle)) {
      score += 8;
      matchReasons.push('Trip shape matches');
    } else {
      score -= 10;
    }

    if (scarcityFits(form.scarcity, idea.teeTimeScarcity)) {
      score += 6;
    } else {
      score -= 8;
    }

    if (form.shortCourses === 'yes') {
      if (idea.shortCourses) {
        score += 7;
        matchReasons.push('Short-course option available');
      } else {
        score -= 6;
      }
    } else if (form.shortCourses === 'no') {
      if (idea.shortCourses) {
        score -= 5;
      } else {
        score += 4;
      }
    }

    if (form.walkingPreference === 'either') {
      score += 1;
    } else if (idea.walkingStyles.includes(form.walkingPreference)) {
      score += 7;
      matchReasons.push('Walking/cart preference fits');
    } else {
      score -= 7;
    }

    if (form.amenity === 'flexible') {
      score += 1;
    } else if (idea.nonGolfAmenities.includes(form.amenity)) {
      score += 13;
      matchReasons.push('Non-golf hook matches');
    } else {
      score -= 12;
    }

    if (idea.groupStyles.includes(form.groupStyle)) {
      score += 7;
    } else {
      score -= 5;
    }

    if (idea.sourceConfidence === 'verified') {
      score += 3;
    }

    score += form.priority === 'easy-travel' ? idea.travelEase * 2 : idea.courseQuality * 1.5;

    return {
      ...idea,
      score,
      tripViabilityScore: viabilityScore,
      differentiationScore,
      matchReasons: matchReasons.slice(0, 5),
      coursesForPlan: idea.courses.slice(0, Math.max(1, Math.min(form.rounds, idea.courses.length))),
    };
  }).sort((a, b) => b.score - a.score);
}

function driveFits(tolerance: DriveTolerance, airportDriveMinutes: number) {
  if (tolerance === 'easy') return airportDriveMinutes <= 75;
  if (tolerance === 'moderate') return airportDriveMinutes <= 150;
  return true;
}

function scarcityFits(tolerance: ScarcityTolerance, scarcity: number) {
  if (tolerance === 'avoid') return scarcity <= 2;
  if (tolerance === 'some') return scarcity <= 4;
  return true;
}

function usGeoForTrip(idea: TripIdea) {
  if (idea.region !== 'us') return undefined;
  return US_GEO_BY_TRIP_ID[idea.id] ?? ADDITIONAL_US_GEO_BY_TRIP_ID[idea.id];
}

function seedToTripIdea(seed: AdditionalUsTripSeed): TripIdea {
  return {
    id: seed.id,
    name: seed.name,
    location: seed.location,
    region: 'us',
    summary: seed.summary,
    hiddenGemAngle: seed.hiddenGemAngle,
    courses: seed.courses,
    lodging: seed.lodging,
    bestMonths: seed.bestMonths,
    budget: seed.budget,
    minGroupSize: 4,
    maxGroupSize: 24,
    minRounds: Math.min(3, seed.courses.length),
    strengths: seed.strengths,
    lodgingStyles: ['hotel', 'villa', 'resort', 'cabin', 'flexible'],
    groupStyles: ['competitive', 'mixed', 'social'],
    hiddenGemTypes: seed.hiddenGemTypes,
    routeStyles: seed.routeStyles,
    polish: seed.polish,
    walkingStyles: seed.walkingStyles,
    nonGolfAmenities: seed.nonGolfAmenities,
    shortCourses: seed.shortCourses,
    travelEase: seed.travelEase,
    courseQuality: seed.courseQuality,
    mainstreamSaturationScore: seed.mainstreamSaturationScore,
    grassrootsSignalScore: seed.grassrootsSignalScore,
    publicAccessQuality: 4,
    teeTimeScarcity: seed.mainstreamSaturationScore >= 4 ? 4 : 2,
    courseClusterCount: seed.courses.length,
    airportDriveMinutes: seed.airportDriveMinutes,
    lodgingCapacityScore: seed.polish === 'polished' ? 5 : 4,
    groupLogisticsScore: seed.routeStyles.includes('home-base') ? 4 : 3,
    sourceConfidence: 'hypothesis',
    estimatedCost: seed.estimatedCost,
    bookabilityNote: 'Starter recommendation: verify current tee-time access, lodging blocks, and seasonal pricing before booking.',
    plannerNote: 'Added for broader state and region coverage; refine after live planner feedback and source checks.',
    sourceUrl: seed.sourceUrl,
  };
}

function hasStateOverlap(tripStates: string[], selectedStates: string[]) {
  return selectedStates.some((state) => tripStates.includes(state));
}

function stateListLabel(states: string[]) {
  if (states.length === 0) return 'Any state';
  if (states.length === 1) return STATE_LABELS[states[0]] ?? states[0];
  if (states.length === 2) {
    return states.map((state) => STATE_LABELS[state] ?? state).join(' / ');
  }
  return `${states.length} selected states`;
}

function tripAreaSummary(form: TripIdeaForm) {
  if (form.region === 'international') return 'International';
  if (form.selectedStates.length > 0) return stateListLabel(form.selectedStates);
  if (form.usRegion !== 'any') return US_REGION_LABELS[form.usRegion];
  return form.region === 'either' ? 'Any geography' : 'Any US area';
}

function stateOptionsForRegion(region: UsRegionPreference) {
  if (region === 'any') return US_STATE_OPTIONS;
  return US_STATE_OPTIONS.filter(([state]) => STATE_REGION_BY_CODE[state] === region);
}

function tripLeadMonths(form: TripIdeaForm) {
  const year = Number(form.year);
  const month = form.month ? Number(form.month) : 12;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  const now = new Date();
  return (year - now.getFullYear()) * 12 + (month - 1) - now.getMonth();
}

function recommendedNightCount(rounds: number, airportDriveMinutes: number, isRoadTrip: boolean) {
  let nights = Math.max(1, Math.ceil(rounds / 2));
  if (rounds >= 5) nights += 1;
  if (airportDriveMinutes > 150) nights += 1;
  if (isRoadTrip) nights += 1;
  return Math.min(10, nights);
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <label
            key={optionValue}
            className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              value === optionValue
                ? 'border-emerald-500 bg-emerald-950 text-white'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
            }`}
          >
            <span>{optionLabel}</span>
            <input
              className="sr-only"
              type="radio"
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function StateSelector({
  stateOptions,
  selectedStates,
  onToggle,
  onClear,
}: {
  stateOptions: Array<[string, string]>;
  selectedStates: string[];
  onToggle: (state: string) => void;
  onClear: () => void;
}) {
  return (
    <fieldset>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="label mb-0">State(s)</legend>
        {selectedStates.length > 0 && (
          <button
            type="button"
            className="text-xs font-bold text-emerald-300 hover:text-emerald-200"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stateOptions.map(([state, label]) => {
          const selected = selectedStates.includes(state);
          return (
            <label
              key={state}
              className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-xs font-black transition-colors ${
                selected
                  ? 'border-emerald-500 bg-emerald-950 text-white'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
              }`}
              title={label}
            >
              <span>{state}</span>
              <input
                className="sr-only"
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(state)}
              />
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Leave empty for any state. Pick multiple states for flexible regional planning.
      </p>
    </fieldset>
  );
}

function TripIdeaCard({ idea, rank, form }: { idea: RankedTripIdea; rank: number; form: TripIdeaForm }) {
  const confidenceLabel = idea.sourceConfidence === 'verified' ? 'Verified starter' : 'Needs source check';
  const angleHeading = idea.mainstreamSaturationScore >= 4 ? 'Why This Is Here' : 'Why This Is Not Obvious';

  return (
    <article className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_16rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">#{rank}</span>
            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300">{idea.location}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${idea.sourceConfidence === 'verified' ? 'bg-sky-950 text-sky-200' : 'bg-yellow-950 text-yellow-200'}`}>
              {confidenceLabel}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-black text-white">{idea.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{idea.summary}</p>
          <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-300">{angleHeading}</div>
            <p className="mt-1 text-sm leading-relaxed text-emerald-50">{idea.hiddenGemAngle}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <DetailList title={`${idea.coursesForPlan.length} Course Plan`} items={idea.coursesForPlan} />
            <DetailList title="Lodging Ideas" items={idea.lodging} />
          </div>
        </div>

        <aside className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Estimated Fit</div>
          <div className="mt-2 text-3xl font-black text-emerald-300">{Math.round(idea.score)}</div>
          <div className="mt-1 text-xs text-slate-400">planning score</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <ScorePill label="Gem" value={idea.differentiationScore} />
            <ScorePill label="Viable" value={idea.tripViabilityScore} />
          </div>
          <div className="mt-4 border-t border-slate-700 pt-4">
            <div className="text-sm font-bold text-white">{idea.estimatedCost}</div>
            <div className="mt-1 text-xs text-slate-400">
              For {form.groupSize} players, {form.rounds} rounds, {form.nights} nights{form.month ? ` in ${monthName(form.month)} ${form.year}` : form.year ? ` around ${form.year}` : ''}.
            </div>
          </div>
          <a href={idea.sourceUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-flex w-full justify-center text-center">
            Planner Link
          </a>
        </aside>
      </div>

      <div className="grid gap-4 border-t border-slate-700 bg-slate-900/70 p-5 md:grid-cols-[1fr_1fr_1fr]">
        <div>
          <h4 className="text-sm font-black text-white">Why It Matched</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {idea.matchReasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Bookability</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{idea.bookabilityNote}</p>
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Planner Note</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{idea.plannerNote}</p>
        </div>
      </div>
    </article>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-black text-emerald-300">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-2">
      <div className="font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function monthName(value: string) {
  return MONTHS.find((month) => month.value === value)?.label ?? 'selected month';
}
