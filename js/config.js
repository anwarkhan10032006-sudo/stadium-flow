/**
 * Static Configuration and Mapping Definitions
 */

/**
 * Pre-defined stadiums configuration representing the structured data
 * that would typically be fetched via Firestore in a production scaling environment.
 */export const STADIUMS = {
  bangalore: {
    id: 'bangalore',
    name: 'M. Chinnaswamy Stadium',
    locationQuery: 'M. Chinnaswamy Stadium Bangalore',
    match: { status: 'Live', title: 'RCB vs CSK', time: '7:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 1 (Cubbon Pk)', type: 'Entry / Exit', emoji: '🚪', base: 75 },
      { key: 'gateB', name: 'Gate 7 (Queens Rd)', type: 'Entry / Exit', emoji: '🚪', base: 45 },
      { key: 'foodCourt', name: 'P Pavilion Food', type: 'Concession', emoji: '🍕', base: 85 },
      { key: 'exitA', name: 'Exit 1', type: 'Exit Gate', emoji: '🟢', base: 20 },
      { key: 'exitB', name: 'Exit 7', type: 'Exit Gate', emoji: '🔴', base: 80 },
      { key: 'northStand', name: 'P Pavilion', type: 'Seating', emoji: '💺', base: 65 },
      { key: 'southStand', name: 'Corporate Box', type: 'Premium', emoji: '⭐', base: 45 },
      { key: 'vipLounge', name: 'KSCA Lounge', type: 'Premium', emoji: '⭐', base: 35 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 60 },
      { key: 'parking', name: 'UB City Parking', type: 'Lot', emoji: '🅿️', base: 90 },
    ],
    stalls: [
      { key: 'pizza', emoji: '🍕', name: 'Oven Story', location: 'Gate 1', baseWait: 15 },
      { key: 'burger', emoji: '🍔', name: 'Burger Station', location: 'P Pavilion', baseWait: 10 },
      { key: 'biryani', emoji: '🍛', name: 'Nandhana Palace', location: 'Corporate Box', baseWait: 18 },
      { key: 'drinks', emoji: '🥤', name: 'Fresh Juice', location: 'Gate 7', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Corner House', location: 'East Stand', baseWait: 12 },
      { key: 'snacks', emoji: '🥨', name: 'Quick Bites', location: 'Gate 1', baseWait: 6 },
    ]
  },
  mumbai: {
    id: 'mumbai',
    name: 'Wankhede Stadium',
    locationQuery: 'Wankhede Stadium Mumbai',
    match: { status: 'Live', title: 'MI vs DC', time: '8:00 PM' },
    zones: [
      { key: 'gateA', name: 'Vinoo Mankad Gate', type: 'Entry / Exit', emoji: '🚪', base: 80 },
      { key: 'gateB', name: 'University Gate', type: 'Entry / Exit', emoji: '🚪', base: 55 },
      { key: 'foodCourt', name: 'Marine Concourse', type: 'Concession', emoji: '🍕', base: 92 },
      { key: 'exitA', name: 'North Exit', type: 'Exit Gate', emoji: '🟢', base: 40 },
      { key: 'exitB', name: 'South Exit', type: 'Exit Gate', emoji: '🔴', base: 85 },
      { key: 'northStand', name: 'North Stand', type: 'Seating', emoji: '💺', base: 75 },
      { key: 'southStand', name: 'Garware Pavilion', type: 'Premium', emoji: '⭐', base: 60 },
      { key: 'vipLounge', name: 'MCA Lounge', type: 'Premium', emoji: '⭐', base: 40 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 70 },
      { key: 'parking', name: 'Churchgate Parking', type: 'Lot', emoji: '🅿️', base: 95 },
    ],
    stalls: [
      { key: 'vadapav', emoji: '🧆', name: 'Jumbo King', location: 'University Gate', baseWait: 10 },
      { key: 'burger', emoji: '🍔', name: 'Burger King', location: 'North Stand', baseWait: 15 },
      { key: 'biryani', emoji: '🍛', name: 'Zaffran', location: 'Garware Pavilion', baseWait: 20 },
      { key: 'drinks', emoji: '🥤', name: 'Chilled Bev', location: 'All Stands', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Naturals', location: 'MCA Lounge', baseWait: 8 },
      { key: 'snacks', emoji: '🥨', name: 'Bhel Puri Kiosk', location: 'Marine Concourse', baseWait: 6 },
    ]
  },
  ahmedabad: {
    id: 'ahmedabad',
    name: 'Narendra Modi Stadium',
    locationQuery: 'Narendra Modi Stadium Ahmedabad',
    match: { status: 'Closed', title: 'No Event', time: '--' },
    zones: [
      { key: 'gateA', name: 'Gate 1', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'gateB', name: 'Gate 2', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'foodCourt', name: 'Food Court', type: 'Concession', emoji: '🍕', base: 5 },
      { key: 'exitA', name: 'Exit 1', type: 'Exit Gate', emoji: '🟢', base: 5 },
      { key: 'exitB', name: 'Exit 2', type: 'Exit Gate', emoji: '🔴', base: 5 },
      { key: 'northStand', name: 'North Stand', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'southStand', name: 'South Stand', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'vipLounge', name: 'Presidential', type: 'Premium', emoji: '⭐', base: 5 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 5 },
      { key: 'parking', name: 'Main Parking', type: 'Lot', emoji: '🅿️', base: 5 }
    ],
    stalls: [
      { key: 'dhokla', emoji: '🧆', name: 'Gujarati Snacks', location: 'Food Court', baseWait: 1 },
      { key: 'burger', emoji: '🍔', name: 'Fast Food', location: 'North', baseWait: 1 },
      { key: 'pizza', emoji: '🍕', name: 'Pizza', location: 'South', baseWait: 1 },
      { key: 'drinks', emoji: '🥤', name: 'Drinks', location: 'Gate 1', baseWait: 1 },
      { key: 'iceCream', emoji: '🍦', name: 'Ice Cream', location: 'Gate 2', baseWait: 1 },
      { key: 'snacks', emoji: '🥨', name: 'Snacks', location: 'All Stands', baseWait: 1 }
    ]
  },
  kolkata: {
    id: 'kolkata',
    name: 'Eden Gardens',
    locationQuery: 'Eden Gardens Kolkata',
    match: { status: 'Upcoming', title: 'KKR vs RR', time: 'Tomorrow 3:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 3', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'gateB', name: 'Gate 4', type: 'Entry / Exit', emoji: '🚪', base: 5 },
      { key: 'foodCourt', name: 'Club House Food', type: 'Concession', emoji: '🍕', base: 5 },
      { key: 'exitA', name: 'Exit 3', type: 'Exit Gate', emoji: '🟢', base: 5 },
      { key: 'exitB', name: 'Exit 4', type: 'Exit Gate', emoji: '🔴', base: 5 },
      { key: 'northStand', name: 'BC Roy Club', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'southStand', name: 'K Block', type: 'Seating', emoji: '💺', base: 5 },
      { key: 'vipLounge', name: 'CAB Lounge', type: 'Premium', emoji: '⭐', base: 5 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 5 },
      { key: 'parking', name: 'Maidan Parking', type: 'Lot', emoji: '🅿️', base: 5 }
    ],
    stalls: [
      { key: 'rolls', emoji: '🌯', name: 'Kathi Rolls', location: 'Club House', baseWait: 1 },
      { key: 'burger', emoji: '🍔', name: 'Burgers', location: 'Gate 3', baseWait: 1 },
      { key: 'biryani', emoji: '🍛', name: 'Aminia Biryani', location: 'K Block', baseWait: 1 },
      { key: 'drinks', emoji: '🥤', name: 'Drinks', location: 'Gate 4', baseWait: 1 },
      { key: 'iceCream', emoji: '🍦', name: 'Ice Cream', location: 'Club House', baseWait: 1 },
      { key: 'snacks', emoji: '🥨', name: 'Snacks', location: 'All Stands', baseWait: 1 }
    ]
  },
  chennai: {
    id: 'chennai',
    name: 'MA Chidambaram Stadium',
    locationQuery: 'MA Chidambaram Stadium Chennai',
    match: { status: 'Live', title: 'CSK vs SRH', time: '7:30 PM' },
    zones: [
      { key: 'gateA', name: 'Gate 11', type: 'Entry / Exit', emoji: '🚪', base: 85 },
      { key: 'gateB', name: 'Gate 2', type: 'Entry / Exit', emoji: '🚪', base: 60 },
      { key: 'foodCourt', name: 'Pavilion Food', type: 'Concession', emoji: '🍕', base: 88 },
      { key: 'exitA', name: 'Exit 11', type: 'Exit Gate', emoji: '🟢', base: 30 },
      { key: 'exitB', name: 'Exit 2', type: 'Exit Gate', emoji: '🔴', base: 75 },
      { key: 'northStand', name: 'I Stand', type: 'Seating', emoji: '💺', base: 80 },
      { key: 'southStand', name: 'C Stand', type: 'Seating', emoji: '💺', base: 85 },
      { key: 'vipLounge', name: 'MCC Lounge', type: 'Premium', emoji: '⭐', base: 50 },
      { key: 'restrooms', name: 'Restrooms', type: 'Facilities', emoji: '🚻', base: 65 },
      { key: 'parking', name: 'MRTS Parking', type: 'Lot', emoji: '🅿️', base: 90 },
    ],
    stalls: [
      { key: 'filterCoffee', emoji: '☕', name: 'Mylapore Coffee', location: 'Pavilion', baseWait: 8 },
      { key: 'dosa', emoji: '🥞', name: 'Saravana Bhavan', location: 'C Stand', baseWait: 15 },
      { key: 'biryani', emoji: '🍛', name: 'Buhari Biryani', location: 'Gate 2', baseWait: 22 },
      { key: 'drinks', emoji: '🥤', name: 'Cold Drinks', location: 'All Stands', baseWait: 5 },
      { key: 'iceCream', emoji: '🍦', name: 'Arun Icecreams', location: 'I Stand', baseWait: 10 },
      { key: 'snacks', emoji: '🥨', name: 'Murukku Kiosk', location: 'Gate 11', baseWait: 4 },
    ]
  }
};

export const EXIT_MODEL = [
  { label: 'Leave Now',       desc: 'Match in progress — exits nearly empty',          level: 1, tone: 'green'  },
  { label: '10 min before',   desc: 'Mild crowd forming — still comfortable to exit',  level: 2, tone: 'green'  },
  { label: 'At Final Whistle',desc: 'Rush begins — all gates surge simultaneously',    level: 4, tone: 'red'    },
  { label: '15 min after',    desc: 'Peak rush — expect 30–40 min wait at exits',      level: 5, tone: 'red'    },
  { label: '30 min after',    desc: 'Crowd dispersing — flow returning to normal',     level: 2, tone: 'yellow' },
];

export const ALERT_POOL = [
  { type: 'danger',  icon: '🚨', msg: 'Gate B is overcrowded. Use Gate A or Gate C.' },
  { type: 'warning', icon: '⚠️', msg: 'Food Court wait >20 min. Try North Wing stalls.' },
  { type: 'success', icon: '✅', msg: 'Exit A is currently clear — smooth flow confirmed.' },
  { type: 'info',    icon: 'ℹ️', msg: 'VIP parking access opens at Gate 7 in 15 min.' },
  { type: 'danger',  icon: '🔴', msg: 'North Stand restrooms at capacity. Use South Stand.' },
  { type: 'warning', icon: '⚡', msg: 'High crowd expected at Exit B post-match.' },
  { type: 'success', icon: '🟢', msg: 'Medical Bay fully available — no queue.' },
  { type: 'info',    icon: '📍', msg: 'Shuttle from Gate C running every 5 minutes.' },
  { type: 'danger',  icon: '🚧', msg: 'Elevator 3 (North Stand) is temporarily out of service.' },
  { type: 'success', icon: '🎯', msg: 'Quick Bites kiosk (Gate A) has shortest wait — only 3 min.' },
];

export const TICKER_MSGS = [
  '🚨 Gate B overcrowded · Use Gate A',
  '✅ Exit A clear · Smooth flow now',
  '⚠️ Food Court: 20 min wait',
  '📍 Shuttle at Gate C every 5 min',
  '🔴 North restrooms at capacity',
  '🟢 Medical Bay open · No queue',
  '⚡ Exit rush expected after match',
  '🅿️ Lot 3 full · Use Lot 5',
  '🎯 Quick Bites: Best option right now',
];

export const NEARBY_SERVICES = [
  { emoji: '🏥', label: 'Hospitals',  sub: 'Emergency care',    query: 'hospitals near me' },
  { emoji: '🅿️', label: 'Parking',    sub: 'Available lots',    query: 'parking near stadium' },
  { emoji: '🍽️', label: 'Restaurants',sub: 'Nearby dining',     query: 'restaurants near me' },
  { emoji: '🚌', label: 'Transit',    sub: 'Bus & Metro stops',  query: 'bus stop near me' },
  { emoji: '💳', label: 'ATMs',       sub: 'Nearest cashpoints', query: 'ATM near me' },
  { emoji: '🚖', label: 'Cab Pickup', sub: 'Ride-hailing zone',  query: 'taxi cab near me' },
];
