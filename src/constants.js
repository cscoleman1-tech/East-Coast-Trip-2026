export const TRIP_START = '2026-07-09'
export const TRIP_END = '2026-07-24'

export const BIN_ID = '6850fa418561e97a50fb3889'

export const TYPE_ICONS = {
  booking: '🎟️', confirm: '📞', pack: '🎒', priority: '⭐',
  transport: '🚌', activity: '🎯', food: '🍽️', optional: '💡', tip: '💡',
}

export const TYPE_COLORS = {
  booking:   { bg: '#fef0ff', border: '#e8b4f5', text: '#7b2fa0' },
  confirm:   { bg: '#e8f4fd', border: '#93c9ee', text: '#1a5a8a' },
  pack:      { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  priority:  { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  transport: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  activity:  { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  food:      { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  optional:  { bg: '#f9fafb', border: '#d1d5db', text: '#6b7280' },
  tip:       { bg: '#fefce8', border: '#fde047', text: '#854d0e' },
}

export const TRIP_CONTEXT = `You are a friendly trip assistant for Chris's family East Coast trip July 2026.
Family: Chris, McKenna (wife), sons Sawyer (14), Pierce (11), Bennett (10). They have a dog.
CONFIRMED: Flights IN Jul 9 SLC→LGA 11pm SW 3750+4120 via MDW. Flights OUT Jul 24 ORF→SLC 3:30pm SW 3187+2660 via MDW arrives 12:35am Jul 25. Amtrak 667 Jul 11 NYC→Philly 3:13pm→4:38pm conf 594764. Amtrak 649 Jul 13 Philly→Harrisburg 4:40pm→6:39pm conf 594C90. Enterprise Chrysler Pacifica pickup Jul 17 11am Harrisburg drop Jul 24 11am Norfolk ORF. OBX JMJ Seascape South Nags Head milepost 19 Jul 18-24 ~13 people. NYC Brooklyn VRBO Herkimer St & Nostrand Ave. Philly Lynn's house 512 Court Circle West Chester PA. Harrisburg Ramada by Wyndham. Williamsburg Woodlands Hotel.
STILL TO BOOK: Statue Cruises, 9/11 Museum timed entry, Independence Hall timed entry, OBX beach gear rentals, Williamsburg dog weight limit.
Respond helpfully and concisely. Brief for simple questions, organized for planning. No walls of text.`

export const MASTER_PACKING = {
  '👕 Clothes & Personal Care': [
    'T-shirts (2 per day)', 'Shorts', 'Pants/jeans (2-3 pairs)', 'Underwear & socks', 'Pajamas',
    'Swimsuits (2 each)', 'Light jacket or hoodie', 'Rain jacket', 'Walking shoes / sneakers',
    'Sandals / flip flops', 'Dress clothes (1 outfit)', 'Sunglasses', 'Hat / baseball cap',
    'Toothbrush & toothpaste', 'Shampoo & conditioner', 'Body wash / soap', 'Deodorant',
    'Sunscreen (SPF 50+)', 'After-sun lotion / aloe vera', 'Razor & shaving supplies',
    'Hair products', 'Feminine hygiene products', 'Nail clippers', 'First aid kit',
    'Prescription medications', 'Pain relievers (Tylenol/Advil)', 'Allergy medicine',
    'Motion sickness meds', 'Hand sanitizer', 'Face masks',
  ],
  '🔌 Electronics & Chargers': [
    'Phone chargers (everyone)', 'Portable battery banks', 'Headphones / earbuds',
    'iPad or tablet', 'Tablet charger', 'Camera + memory cards', 'Camera charger',
    'Laptop (if needed)', 'Laptop charger', 'Car phone mount', 'USB car charger adapter',
    'Power strip (for hotel rooms)', 'Waterproof phone case (beach)',
  ],
  '🏖️ Beach & Outdoor Gear': [
    'Beach towels (large)', 'Sand toys / buckets', 'Boogie boards', 'Snorkel gear (optional)',
    'Beach bag / tote', 'Waterproof dry bags', 'Sunscreen (extra supply)', 'Bug spray / DEET',
    'Reusable water bottles', 'Cooler or insulated bag (Costco run)',
    'Beach tent or pop-up canopy', 'Chairs (or book Farmdog/Beach EZ/Ocean Atlantic)',
    'Kite (optional — Kitty Hawk area!)', 'Frisbee / beach games',
  ],
  "👦 Kids' Stuff": [
    'Books / activity books for travel', 'Card games (Uno, etc.)', 'Small backpack for each kid',
    'Earbuds / headphones each kid', 'Tablet / device for travel days', 'Charger for each kid device',
    'Favorite snacks for car/train', 'Small cash for each kid', 'Sunglasses for kids',
    'Swimsuits (2 each)', 'Hershey Park comfortable shoes',
  ],
  '📄 Documents & Travel Info': [
    'IDs / driver\'s license', 'Southwest boarding passes (Jul 9 & Jul 24)',
    'Amtrak tickets #594764 & #594C90', 'Enterprise car rental confirmation',
    'OBX house address & check-in info', 'All hotel confirmations (offline)',
    'Health insurance cards', 'Credit cards + debit cards', 'Emergency cash',
    'Passport (just in case)', 'Pet vaccination records', 'Key addresses & contacts list',
    'Offline NYC subway map downloaded', 'Southwest app — flights checked in',
  ],
}

export const INDIVIDUAL_PACKING = {
  Chris:   ['Dress shirt for church Sundays', 'Journal or notebook', 'Wallet + IDs', 'Personal meds', 'Shaving kit', 'Personal toiletries'],
  McKenna: ['Dress for church / nicer occasion', 'Personal toiletries & cosmetics', 'Hair styling tools', 'Jewelry', 'Personal meds'],
  Sawyer:  ['Entertainment for travel days', 'Extra spending money', 'Charger', 'Deodorant (teen)', 'Personal hygiene items'],
  Pierce:  ['Activity book or sketchpad', 'Favorite toy or card game', 'Charger', 'Comfortable shoes for walking'],
  Bennett: ['Activity book or sketchpad', 'Favorite toy or card game', 'Charger', 'Comfortable shoes for walking'],
}

export const DEFAULT_PRETRIP = {
  '2026-06-13': [
    { text: 'Book Statue Cruises (Statue of Liberty ferry) — sells out fast!', type: 'booking' },
    { text: 'Book 9/11 Museum timed entry tickets', type: 'booking' },
    { text: 'Book Independence Hall timed entry (free via recreation.gov)', type: 'booking' },
  ],
  '2026-06-20': [
    { text: 'Call Williamsburg Woodlands to confirm dog weight limit', type: 'confirm' },
    { text: 'Book OBX beach gear rentals (Farmdog, Beach EZ, or Ocean Atlantic)', type: 'booking' },
    { text: 'Decide: Colonial Williamsburg vs Jamestown for Jul 18 morning', type: 'confirm' },
  ],
  '2026-06-27': [
    { text: 'Buy Luna Park wristbands online if doing Coney Island (cheaper in advance)', type: 'booking' },
    { text: "Check Hershey Park accessibility pass process for Tourette's", type: 'confirm' },
    { text: 'Start packing list — 5 people, 16 days', type: 'pack' },
  ],
  '2026-07-01': [
    { text: 'Confirm OBX private chef birthday dinner details (Jul 19)', type: 'confirm' },
    { text: 'Coordinate Costco run — who brings coolers/insulated bags?', type: 'confirm' },
    { text: 'Text Steve & Tina to confirm Hershey Park plan (Jul 14)', type: 'confirm' },
    { text: 'Reach out to cousin Allie to set a time (Jul 15)', type: 'confirm' },
    { text: 'Reach out to Jeana to set a time (Jul 16)', type: 'confirm' },
  ],
  '2026-07-04': [
    { text: 'Pack sunscreen, beach towels, boogie boards', type: 'pack' },
    { text: 'Download Amtrak app & save tickets (594764 & 594C90)', type: 'confirm' },
    { text: 'Download Southwest app & note check-in window (24 hrs before)', type: 'confirm' },
  ],
  '2026-07-07': [
    { text: "Pack everyone's bags — check weather for each city", type: 'pack' },
    { text: 'Charge all devices & portable battery banks', type: 'pack' },
    { text: 'Print or save all confirmations offline', type: 'confirm' },
    { text: 'Download NYC subway map for offline use', type: 'confirm' },
    { text: 'Confirm ride to SLC airport on Jul 9', type: 'confirm' },
  ],
  '2026-07-08': [
    { text: 'Check in to Southwest flight! (opens 24 hrs before Jul 9 departure)', type: 'booking' },
    { text: 'Final bag check — all 5 people packed?', type: 'pack' },
    { text: 'Snacks & drinks for travel day', type: 'pack' },
    { text: 'Cash on hand for tips, markets, small vendors', type: 'pack' },
  ],
}

export const ITINERARY = [
  {
    date: '2026-07-09', label: 'Thu Jul 9', city: 'NYC', emoji: '✈️', title: 'Arrive New York',
    summary: 'Land LGA 11pm · Rideshare to Brooklyn',
    lodging: 'Brooklyn VRBO · Herkimer St & Nostrand Ave', transit: '', confirmations: [],
    items: [
      { text: 'SW 3750 departs SLC 2:05pm', type: 'transport' },
      { text: 'Connect MDW → SW 4120', type: 'transport' },
      { text: 'Land LGA ~11pm', type: 'transport' },
      { text: 'Rideshare to Brooklyn VRBO (~$45-60, 30-45 min)', type: 'tip' },
    ],
  },
  {
    date: '2026-07-10', label: 'Fri Jul 10', city: 'NYC', emoji: '🗽', title: 'New York City',
    summary: 'Statue of Liberty · 9/11 · Central Park',
    lodging: 'Brooklyn VRBO · Herkimer St & Nostrand Ave',
    transit: 'OMNY tap-to-pay subway (no MetroCard). A/C/E → Penn Station.', confirmations: [],
    items: [
      { text: 'Statue of Liberty — ferry from Battery Park', type: 'priority' },
      { text: '9/11 Memorial & Museum (timed entry)', type: 'priority' },
      { text: 'Central Park', type: 'activity' },
      { text: 'Brooklyn Bridge photos', type: 'activity' },
      { text: 'Times Square at night', type: 'activity' },
      { text: "Joe's Pizza 🍕", type: 'food' },
      { text: 'Coney Island (optional)', type: 'optional' },
    ],
  },
  {
    date: '2026-07-11', label: 'Sat Jul 11', city: 'NYC→Philly', emoji: '🚂', title: 'NYC → Philadelphia',
    summary: 'Morning NYC · Train 3:13pm · Arrive 4:38pm',
    lodging: "Lynn's house · 512 Court Circle, West Chester PA", transit: '',
    confirmations: [{ label: 'Amtrak #594764', detail: 'Keystone 667 · 5 Coach seats · Departs 3:13pm' }],
    items: [
      { text: 'Morning: wrap up NYC', type: 'activity' },
      { text: 'Subway A/C/E → Penn Station (Moynihan Hall)', type: 'transport' },
      { text: 'Amtrak Keystone 667 departs 3:13pm', type: 'transport' },
      { text: 'Arrive Philadelphia 30th St 4:38pm', type: 'transport' },
      { text: "Rideshare or pickup → Lynn's, West Chester PA (~30 min)", type: 'transport' },
    ],
  },
  {
    date: '2026-07-12', label: 'Sun Jul 12', city: 'Philly', emoji: '🔔', title: 'Philadelphia',
    summary: 'Liberty Bell · Cheesesteak · Ice Cream',
    lodging: "Lynn's house · 512 Court Circle, West Chester PA", transit: "Borrow Lynn's car", confirmations: [],
    items: [
      { text: 'Liberty Bell & Independence Hall (timed entry)', type: 'priority' },
      { text: "Cheesesteak (Pat's, Geno's, or Jim's)", type: 'food' },
      { text: 'LDS Temple exterior view', type: 'activity' },
      { text: 'Scoops DeVille ice cream 🍦', type: 'food' },
      { text: 'Reading Terminal Market (if time)', type: 'optional' },
    ],
  },
  {
    date: '2026-07-13', label: 'Mon Jul 13', city: 'Philly→Harrisburg', emoji: '🚂', title: 'Philadelphia → Harrisburg',
    summary: 'Morning Philly · Train 4:40pm · Arrive 6:39pm',
    lodging: 'Ramada by Wyndham Harrisburg/Hershey', transit: '',
    confirmations: [{ label: 'Amtrak #594C90', detail: 'Keystone 649 · 5 Unreserved Coach seats · Departs 4:40pm' }],
    items: [
      { text: 'Morning: anything left in Philly', type: 'activity' },
      { text: 'Drive to Philly 30th St Station (~30-40 min from West Chester)', type: 'transport' },
      { text: 'Amtrak Keystone 649 departs 4:40pm', type: 'transport' },
      { text: 'Arrive Harrisburg 6:39pm', type: 'transport' },
      { text: 'Check in: Ramada by Wyndham Harrisburg/Hershey', type: 'transport' },
    ],
  },
  {
    date: '2026-07-14', label: 'Tue Jul 14', city: 'Harrisburg', emoji: '🍫', title: 'Hershey Park Day!',
    summary: 'Hershey Park & Chocolate World with Steve & Tina',
    lodging: 'Ramada by Wyndham Harrisburg/Hershey', transit: "Borrow parents' car", confirmations: [],
    items: [
      { text: 'Hershey Park — arrive early!', type: 'priority' },
      { text: "Tourette's accessibility pass (4 per ride)", type: 'tip' },
      { text: 'All Day Drink Pass (every 15 min)', type: 'tip' },
      { text: 'All Day Dining Pass (every 90 min)', type: 'tip' },
      { text: 'Chocolate World 🍫', type: 'activity' },
    ],
  },
  {
    date: '2026-07-15', label: 'Wed Jul 15', city: 'Harrisburg', emoji: '🐎', title: 'Harrisburg Free Day',
    summary: 'Amish country · Visit Allie',
    lodging: 'Ramada by Wyndham Harrisburg/Hershey', transit: "Borrow parents' car", confirmations: [],
    items: [
      { text: 'Amish country — Intercourse PA (optional)', type: 'optional' },
      { text: 'Visit cousin Allie (lunch or dinner TBD)', type: 'activity' },
      { text: 'Visit parents in Linglestown', type: 'activity' },
      { text: 'Try teaberry ice cream! (3 B\'s in Harrisburg) 🍦', type: 'food' },
      { text: 'Find Middleswarth BBQ chips at grocery', type: 'food' },
      { text: 'Hit a Sheetz or Wawa! ⛽', type: 'food' },
    ],
  },
  {
    date: '2026-07-16', label: 'Thu Jul 16', city: 'Harrisburg', emoji: '🛒', title: 'Markets & Friends',
    summary: 'Broad Street Market · City Island · Jeana',
    lodging: 'Ramada by Wyndham Harrisburg/Hershey', transit: "Borrow parents' car", confirmations: [],
    items: [
      { text: 'Broad Street Market for lunch 🥙', type: 'priority' },
      { text: 'City Island', type: 'activity' },
      { text: 'Visit Jeana (TBD)', type: 'activity' },
    ],
  },
  {
    date: '2026-07-17', label: 'Fri Jul 17', city: 'Harrisburg→Williamsburg', emoji: '🚗', title: 'Drive to Williamsburg',
    summary: 'Pick up rental 11am · ~4.5 hrs · Stops along way',
    lodging: 'Williamsburg Woodlands Hotel & Suites', transit: '',
    confirmations: [{ label: 'Enterprise Rental', detail: 'Chrysler Pacifica · 7 passengers · Unlimited miles · Pickup 11am' }],
    items: [
      { text: 'Pick up Enterprise Pacifica 11am — 112 N Mountain Rd, Harrisburg', type: 'transport' },
      { text: 'Stop: Gateway Candyland 🍬', type: 'activity' },
      { text: 'Stop: DC LDS Temple (exterior)', type: 'activity' },
      { text: 'Lunch near DC', type: 'food' },
      { text: 'Dog potty breaks every ~2 hrs 🐕', type: 'tip' },
      { text: 'Check in: Williamsburg Woodlands Hotel', type: 'transport' },
    ],
  },
  {
    date: '2026-07-18', label: 'Sat Jul 18', city: 'Williamsburg→OBX', emoji: '🏖️', title: 'Williamsburg → Outer Banks!',
    summary: 'Morning sightseeing · Costco · Arrive OBX',
    lodging: 'JMJ Seascape · South Nags Head ~Milepost 19', transit: '', confirmations: [],
    items: [
      { text: 'Morning: Colonial Williamsburg OR Jamestown Settlement', type: 'priority' },
      { text: 'Stop: Costco Newport News 🛒 (bring coolers!)', type: 'priority' },
      { text: 'Drive to OBX South Nags Head (~3.5 hrs)', type: 'transport' },
      { text: 'Check in: JMJ Seascape', type: 'transport' },
    ],
  },
  {
    date: '2026-07-19', label: 'Sun Jul 19', city: 'OBX', emoji: '🎂', title: "Mom's Birthday! 🎉",
    summary: 'Church 10am · Beach · Private Chef Dinner',
    lodging: 'JMJ Seascape · South Nags Head', transit: '', confirmations: [],
    items: [
      { text: 'LDS Church 10am — 3342 W Windjammer Rd, Nags Head', type: 'priority' },
      { text: 'Beach day + cabana setup', type: 'activity' },
      { text: 'Boogie boards! 🏄', type: 'activity' },
      { text: 'Private chef birthday dinner (CONFIRMED) 🎂', type: 'priority' },
    ],
  },
  {
    date: '2026-07-20', label: 'Mon Jul 20', city: 'OBX', emoji: '🌊', title: 'OBX Beach Day',
    summary: "Wright Bros · Jockey's Ridge · Beach",
    lodging: 'JMJ Seascape · South Nags Head', transit: '', confirmations: [],
    items: [
      { text: 'Kill Devil Hills / Wright Brothers Memorial (free) ✈️', type: 'activity' },
      { text: "Jockey's Ridge State Park — tallest East Coast dunes (free)", type: 'activity' },
      { text: 'Beach & pool', type: 'activity' },
      { text: 'Roanoke Settlement (free, if time)', type: 'optional' },
    ],
  },
  {
    date: '2026-07-21', label: 'Tue Jul 21', city: 'OBX', emoji: '⛵', title: 'OBX History & Markets',
    summary: 'First Flight Market · Roanoke Island · Aquarium',
    lodging: 'JMJ Seascape · South Nags Head', transit: '', confirmations: [],
    items: [
      { text: 'First Flight Market at Aviation Park (Tuesday) 🛍️', type: 'activity' },
      { text: 'Roanoke Island Festival Park — replica ship ($11/$8)', type: 'activity' },
      { text: 'NC Aquarium ($15/$13)', type: 'optional' },
      { text: 'Beach time', type: 'activity' },
    ],
  },
  {
    date: '2026-07-22', label: 'Wed Jul 22', city: 'OBX', emoji: '🌊', title: 'OBX Adventure Day',
    summary: 'Ocracoke · Cape Hatteras · Wild Horses',
    lodging: 'JMJ Seascape · South Nags Head', transit: '', confirmations: [],
    items: [
      { text: 'Ocracoke Island (free shuttle from Cape Hatteras)', type: 'activity' },
      { text: 'Cape Hatteras Lighthouse — tallest brick lighthouse in US (~1 hr)', type: 'activity' },
      { text: 'Corolla: 4-wheelers & wild horses (optional)', type: 'optional' },
      { text: 'Beach / pool', type: 'activity' },
    ],
  },
  {
    date: '2026-07-23', label: 'Thu Jul 23', city: 'OBX', emoji: '🌅', title: 'Last Full OBX Day',
    summary: 'Dowdy Park Market · Beach · Pack up',
    lodging: 'JMJ Seascape · South Nags Head', transit: '', confirmations: [],
    items: [
      { text: 'Dowdy Park Farmers Market (Thursday) 🌽', type: 'activity' },
      { text: 'H2OBX Water Park ($30-40/person, optional)', type: 'optional' },
      { text: 'Final beach / pool / hot tub time', type: 'activity' },
      { text: 'Start packing up the house', type: 'tip' },
    ],
  },
  {
    date: '2026-07-24', label: 'Fri Jul 24', city: 'Fly Home', emoji: '✈️', title: 'Fly Home to SLC',
    summary: 'Drop car 11am · Depart ORF 3:30pm',
    lodging: '', transit: '', confirmations: [],
    items: [
      { text: 'Check out JMJ Seascape', type: 'transport' },
      { text: 'Drop Enterprise at ORF by 11am — 2200 Norview Ave, Norfolk', type: 'transport' },
      { text: 'SW 3187 departs ORF 3:30pm', type: 'transport' },
      { text: 'Connect MDW → SW 2660', type: 'transport' },
      { text: 'Arrive SLC 12:35am (July 25) 🏠', type: 'transport' },
    ],
  },
]

export const STILL_NEEDED_ITEMS = [
  'Statue Cruises (Statue of Liberty ferry) — book NOW',
  '9/11 Museum timed entry — book NOW',
  'Independence Hall timed entry — book NOW',
  'OBX beach gear rentals (Farmdog / Beach EZ / Ocean Atlantic)',
  'Williamsburg Woodlands — call to confirm dog weight limit',
  'Decide: Colonial Williamsburg vs Jamestown (Jul 18 morning)',
]
