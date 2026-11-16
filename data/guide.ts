// Plain-English explanations of the things a first-timer won't know.
// Our own wording, written as guidance; rules change, so every entry shows the pack's
// "last checked" date and points to the official site. Later this moves into the
// reference packs so each resort has its own guide.

export interface GuideEntry {
  id: string;
  title: string;
  /** One line: what it is. Shown in lists and at the top of the explainer. */
  short: string;
  /** Paragraphs; a line starting with "• " becomes a bullet. */
  body: string[];
  category: Category;
  /** Short tip in our own voice. */
  tip?: string;
}

export type Category = "Skipping queues" | "Eating" | "Hotels and getting around" | "Tickets and park days" | "Before you go" | "Using this planner";
export const CATEGORIES: Category[] = ["Skipping queues", "Eating", "Hotels and getting around", "Tickets and park days", "Before you go", "Using this planner"];

export const OFFICIAL_SITE = "https://disneyworld.disney.go.com/";

export const GUIDE: GuideEntry[] = [
  // ---- skipping queues ----
  {
    id: "lightning-lane", category: "Skipping queues", title: "Lightning Lane",
    short: "Paid, shorter queues for rides, booked as a time slot in the app.",
    body: [
      "Most big rides have two queues: the normal standby queue and a Lightning Lane, which is much shorter. To use the Lightning Lane you book a one-hour return window in the My Disney Experience app, then turn up any time in that hour.",
      "There are three ways to pay for it:",
      "• Multi Pass: a bundle for one park day that lets you book several rides.",
      "• Single Pass: pay per ride, for the few headline rides not in Multi Pass.",
      "• Premier Pass: one go on each Lightning Lane ride in a park, no booking times. Pricey and limited.",
      "None of it is required. Plenty of people do a whole trip on standby queues, early starts and good timing.",
    ],
    tip: "Prices change by date and park, and are per person, per day. Add them to your budget once you've picked days.",
  },
  {
    id: "multi-pass", category: "Skipping queues", title: "Lightning Lane Multi Pass",
    short: "Pay once per person per day, then book up to three rides ahead in one park.",
    body: [
      "You buy Multi Pass for a specific park day. Before the day you pick three rides and get a return time for each, all in the same park.",
      "• At Magic Kingdom, EPCOT and Hollywood Studios, rides are split into tiers. Only one of your three can be Tier 1 (the busiest rides).",
      "• Once you've used one (or its time has passed), you can book another, from any tier, one at a time for the rest of the day.",
      "• Booking opens 7 days before check-in for the whole stay if you're in an on-site hotel, or 3 days before each park day if you're not.",
    ],
    tip: "Tick the rides you want on the Lightning Lanes tab so you're ready the second booking opens.",
  },
  {
    id: "single-pass", category: "Skipping queues", title: "Lightning Lane Single Pass",
    short: "Pay per person, per ride, for the most popular rides.",
    body: [
      "A handful of headline rides aren't in Multi Pass. For those you can buy a Single Pass: one ride, one return time, priced per person.",
      "You can buy it on the same booking schedule as Multi Pass. There's a daily limit on how many different Single Pass rides you can buy, so check the app on the day.",
    ],
  },
  {
    id: "tiers", category: "Skipping queues", title: "Ride tiers",
    short: "How rides are grouped for Multi Pass booking.",
    body: [
      "Tier 1 rides are the ones everyone wants. When you make your first three Multi Pass bookings, only one can be Tier 1; the other two come from Tier 2.",
      "Animal Kingdom doesn't split its rides into tiers. Disney moves rides between tiers and closes some for refurbishment, so we mark when our list was last checked.",
    ],
  },
  {
    id: "virtual-queue", category: "Skipping queues", title: "Virtual queue",
    short: "A free place in line for a very popular ride, joined in the app at set times.",
    body: [
      "Some brand-new or very popular rides use a virtual queue instead of (or as well as) a normal one. It's free, but places go in seconds.",
      "You join in the app at set times (usually first thing in the morning, sometimes again in the afternoon). When your group is called, you head to the ride.",
    ],
    tip: "Set an alarm a minute before it opens and have everyone's tickets linked in the app first.",
  },
  {
    id: "standby", category: "Skipping queues", title: "Standby queue",
    short: "The normal, free queue. Wait times show in the app.",
    body: [
      "Every ride has a standby queue. Waits are usually shortest first thing in the morning, during the evening fireworks and in the last hour before close.",
    ],
  },
  {
    id: "rope-drop", category: "Skipping queues", title: "Rope drop",
    short: "Being at the gate before the park opens, to ride the big ones with short waits.",
    body: [
      "Parks often let people in a little before the official opening time. Arriving 30 to 60 minutes early means you can do one or two big rides before the queues build.",
      "If you're staying on site, Early Theme Park Entry makes this even easier.",
    ],
  },

  // ---- eating ----
  {
    id: "dining-plan", category: "Eating", title: "Disney Dining Plan",
    short: "Prepaid meals as credits, bought with a Disney hotel package.",
    body: [
      "You pay for your food up front as part of a Disney hotel package. Each night of your stay gives everyone aged 3 and over a set number of credits:",
      "• Disney Dining Plan: 1 table-service meal, 1 quick-service meal and 1 snack per person, per night.",
      "• Quick-Service Dining Plan: 2 quick-service meals and 1 snack per person, per night.",
      "Credits are pooled for your group and can be used any day of the stay. Children under 3 eat from an adult's plate and don't get credits.",
      "Whether it saves money depends on how you eat. It's mostly about not watching prices on holiday.",
    ],
    tip: "The Dining credits tab counts what's planned, what's loose and what's used, so you don't run out on the last day.",
  },
  {
    id: "credit-ts", category: "Eating", title: "Table-service credit (TS)",
    short: "A sit-down restaurant meal with a server.",
    body: [
      "One table-service credit covers a sit-down meal at most restaurants. Some special restaurants, including many character meals at dinner and the fancier ‘signature’ restaurants, cost 2 credits.",
      "Table-service meals need booking, usually 60 days ahead.",
    ],
  },
  {
    id: "credit-qs", category: "Eating", title: "Quick-service credit (QS)",
    short: "A counter-service meal: order, pay with the credit, sit where you like.",
    body: [
      "One quick-service credit covers a main and a drink at a counter-service spot. Most can be ordered ahead with mobile order in the app, which skips the queue at the till.",
    ],
  },
  {
    id: "credit-sn", category: "Eating", title: "Snack credit",
    short: "A snack or non-alcoholic drink from a cart, kiosk or counter.",
    body: [
      "Snack credits cover things like ice creams, popcorn, pretzels and soft drinks. Look for the dining-plan symbol on menus to see what counts.",
    ],
  },
  {
    id: "loose-credit", category: "Using this planner", title: "Loose credits",
    short: "A meal you've earmarked but not given a day yet.",
    body: [
      "Add a loose credit when you know you want to eat somewhere but haven't worked out which day. It still counts towards your allowance, so the totals stay honest.",
      "When you decide, open it and pick a day and time, or drag it on the Calendar.",
    ],
  },
  {
    id: "dining-reservations", category: "Eating", title: "Booking restaurants",
    short: "Table-service restaurants book up, so reserve as soon as your window opens.",
    body: [
      "Restaurant bookings open 60 days ahead, at 6am Orlando time (11:00 in the UK).",
      "Staying in an on-site hotel, you can book the first 10 days of your stay all at once, 60 days before check-in. That's a real advantage for popular places.",
      "Bookings need a card and there's usually a no-show fee if you cancel late.",
    ],
    tip: "The Reservations tab works out the date each booking opens and counts down to the next one.",
  },
  {
    id: "character-dining", category: "Eating", title: "Character dining",
    short: "Meals where characters come round to your table.",
    body: [
      "A relaxed way to meet characters without queueing. They're popular, so book at 60 days. Many count as 2 table-service credits at dinner.",
    ],
  },
  {
    id: "mobile-order", category: "Eating", title: "Mobile order",
    short: "Order quick-service food in the app and collect it when it's ready.",
    body: ["Pick a pickup window, tap ‘I'm here’ when you arrive, and skip the till queue. Dining-plan credits work with it."],
  },

  // ---- hotels and getting around ----
  {
    id: "on-site", category: "Hotels and getting around", title: "Staying on site",
    short: "Disney-owned hotels inside the resort, with a few perks.",
    body: [
      "On-site hotels range from Value to Deluxe and Deluxe Villa. Perks for every on-site guest include:",
      "• Early Theme Park Entry at every park, every day.",
      "• Lightning Lane booking 7 days before check-in for the whole stay.",
      "• Restaurant booking for the first 10 days of your stay at 60 days out.",
      "• Free buses, plus the Skyliner, monorail or boats from some hotels.",
      "Deluxe and Deluxe Villa guests also get Extended Evening Hours.",
    ],
  },
  {
    id: "early-entry", category: "Hotels and getting around", title: "Early Theme Park Entry",
    short: "On-site guests get into every park 30 minutes before everyone else.",
    body: ["Every day, at every park. Use it to ride one or two of the busiest rides before the gates open to day guests."],
    tip: "It pairs well with rope drop: be there for the early-entry opening time, not the official one.",
  },
  {
    id: "extended-evening", category: "Hotels and getting around", title: "Extended Evening Hours",
    short: "Two extra hours at one park after it closes, for Deluxe hotel guests.",
    body: ["On selected nights, one park stays open about two hours later just for guests at Deluxe and Deluxe Villa hotels (and a few partner hotels). Queues are usually very short."],
  },
  {
    id: "split-stay", category: "Hotels and getting around", title: "Split stay",
    short: "Staying at more than one hotel on the same trip.",
    body: ["Common on longer trips: a few nights on site for the perks, then a villa or cheaper hotel. Your booking windows follow your on-site check-in date, which the planner works out for you."],
  },
  {
    id: "skyliner", category: "Hotels and getting around", title: "Skyliner",
    short: "A cable car linking some hotels with EPCOT and Hollywood Studios.",
    body: ["Free for everyone. It's quick and calm, but it can pause in lightning storms, so have a bus back-up in summer."],
  },
  {
    id: "monorail", category: "Hotels and getting around", title: "Monorail",
    short: "The elevated train linking Magic Kingdom, its nearby hotels and EPCOT.",
    body: ["Free. Hotels on the monorail loop are the quickest way to and from Magic Kingdom."],
  },
  {
    id: "journey-times", category: "Hotels and getting around", title: "Journey times",
    short: "Our rough door-to-gate estimates from each hotel.",
    body: ["Times include a typical wait for the bus, boat or Skyliner and the walk to the gate. Early mornings and park closing can be much busier, so leave extra time."],
  },

  // ---- tickets and park days ----
  {
    id: "park-tickets", category: "Tickets and park days", title: "Park tickets",
    short: "Dated tickets for a set number of park days.",
    body: [
      "Tickets are for a number of days, used within a set window. Longer tickets cost less per day.",
      "With a basic ticket you visit one park a day. Add Park Hopper to visit more than one.",
      "You also need a park reservation for some ticket types, so check when you buy.",
    ],
  },
  {
    id: "park-hopper", category: "Tickets and park days", title: "Park Hopper",
    short: "A ticket add-on that lets you visit more than one park in a day.",
    body: ["Handy for a morning at one park and dinner or fireworks at another. Check the current hopping rules when you buy; they've changed over the years."],
  },
  {
    id: "park-hours", category: "Tickets and park days", title: "Park hours",
    short: "Opening times, published a few months ahead.",
    body: ["Until Disney publishes hours for your dates, we show what they were at the same time last year, marked as estimated. Swap them for the real ones once they're out."],
  },
  {
    id: "festivals", category: "Tickets and park days", title: "EPCOT festivals",
    short: "Seasonal food and arts festivals that run most of the year at EPCOT.",
    body: [
      "EPCOT runs a festival for most of the year, with food stalls, music and decorations:",
      "• Festival of the Arts (early in the year)",
      "• Flower & Garden Festival (spring)",
      "• Food & Wine Festival (late summer to autumn)",
      "• Festival of the Holidays (late November to December)",
      "Festival food is paid for separately; some stalls take snack credits.",
    ],
  },
  {
    id: "parties", category: "Tickets and park days", title: "After-hours parties",
    short: "Separately ticketed evening events, like the Halloween and Christmas parties.",
    body: [
      "On party nights Magic Kingdom closes early to day guests and reopens for people with a party ticket: special parades, fireworks, treats and characters.",
      "Tickets sell out, especially near Halloween and Christmas. If you're not going, plan another park for that evening.",
    ],
  },
  {
    id: "memory-maker", category: "Tickets and park days", title: "Memory Maker",
    short: "A photo package for all the park photographers' and ride photos.",
    body: ["One price for every photo taken of your group by park photographers and on rides. Cheaper if bought a few days before you travel."],
  },

  // ---- before you go ----
  {
    id: "mde", category: "Before you go", title: "My Disney Experience app",
    short: "The official app for tickets, bookings, Lightning Lanes, mobile order and wait times.",
    body: ["Download it before you go, sign in, and link everyone's tickets and hotel booking. Most of the trip runs through it."],
  },
  {
    id: "esta", category: "Before you go", title: "ESTA",
    short: "The US travel permit most UK passport holders need before flying.",
    body: ["Apply online through the official US government site well before you travel. Ignore lookalike sites that charge extra."],
  },
  {
    id: "booking-windows", category: "Before you go", title: "Booking windows",
    short: "The dates when restaurants and Lightning Lanes open for booking.",
    body: [
      "• Restaurants: 60 days before (on site: the first 10 days of your stay at 60 days before check-in).",
      "• Lightning Lane: 7 days before check-in if on site, 3 days before each park day if not.",
      "The Reservations tab works these out from your dates and hotel.",
    ],
  },

  // ---- using this planner ----
  {
    id: "needs-booking", category: "Using this planner", title: "Needs booking",
    short: "Marks anything that has to be reserved, so it shows on Reservations.",
    body: ["Table-service meals are included automatically. Tick Needs booking on anything else (a tour, a party, a spa) and add the confirmation number once it's booked."],
  },
  {
    id: "estimated", category: "Using this planner", title: "Guidance and ‘last checked’",
    short: "Rules and prices change. We show when we last checked.",
    body: ["Everything here is our own summary of how things worked when we last checked, not official advice. Always confirm on the official site before you book or pay."],
  },
];

export const guideById = (id: string) => GUIDE.find((g) => g.id === id);
