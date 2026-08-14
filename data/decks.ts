/**
 * Cosmos Fun — word bank
 *
 * Every deck is fully populated with real, playable words chosen to be
 * describable/actable in a charades context. Words are tagged by difficulty
 * so the deck-select difficulty filter can subset them.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface Word {
  term: string;
  difficulty: Difficulty;
}

export interface Deck {
  id: string;
  name: string;
  /** Ionicons name */
  icon: string;
  accentColor: string;
  words: Word[];
}

const e = (term: string): Word => ({ term, difficulty: "easy" });
const m = (term: string): Word => ({ term, difficulty: "medium" });
const h = (term: string): Word => ({ term, difficulty: "hard" });

export const decks: Deck[] = [
  {
    id: "programming",
    name: "Programming & Tech",
    icon: "code-slash",
    accentColor: "#38BDF8",
    words: [
      e("JavaScript"), e("Python"), e("HTML"), e("CSS"), e("bug"),
      e("laptop"), e("internet"), e("app"), e("website"), e("robot"),
      m("algorithm"), m("loop"), m("variable"), m("function"), m("array"),
      m("database"), m("API"), m("framework"), m("Git"), m("cloud"),
      m("server"), m("debugging"), m("compiler"), m("encryption"), m("cache"),
      h("recursion"), h("race condition"), h("technical debt"),
      h("rubber duck debugging"), h("merge conflict"), h("stack overflow"),
      h("middleware"), h("polymorphism"), h("big O notation"),
      h("dependency injection"),
    ],
  },
  {
    id: "movies-tv",
    name: "Movies & TV",
    icon: "film",
    accentColor: "#EC4899",
    words: [
      e("Titanic"), e("Batman"), e("Spider-Man"), e("The Lion King"),
      e("Frozen"), e("Harry Potter"), e("Star Wars"), e("Shrek"),
      e("SpongeBob"), e("Tom and Jerry"),
      m("The Matrix"), m("Jurassic Park"), m("Finding Nemo"),
      m("The Avengers"), m("Stranger Things"), m("Game of Thrones"),
      m("Breaking Bad"), m("Pirates of the Caribbean"), m("Toy Story"),
      m("The Simpsons"), m("Indiana Jones"), m("King Kong"),
      m("Mission Impossible"), m("Home Alone"),
      h("The Godfather"), h("Inception"), h("Squid Game"),
      h("The Truman Show"), h("Black Mirror"), h("Forrest Gump"),
      h("The Silence of the Lambs"), h("Groundhog Day"),
    ],
  },
  {
    id: "animals",
    name: "Animals",
    icon: "paw",
    accentColor: "#84CC16",
    words: [
      e("dog"), e("cat"), e("elephant"), e("lion"), e("monkey"),
      e("snake"), e("fish"), e("bird"), e("cow"), e("chicken"),
      e("horse"), e("rabbit"),
      m("giraffe"), m("kangaroo"), m("penguin"), m("dolphin"), m("octopus"),
      m("crocodile"), m("gorilla"), m("flamingo"), m("owl"), m("shark"),
      m("peacock"), m("hedgehog"), m("camel"), m("bat"),
      h("chameleon"), h("platypus"), h("anteater"), h("sloth"),
      h("axolotl"), h("narwhal"), h("pangolin"), h("tardigrade"),
    ],
  },
  {
    id: "celebrities",
    name: "Celebrities",
    icon: "star",
    accentColor: "#FACC15",
    // NOTE: Deliberately generic/iconic entries only, so the deck doesn't
    // date itself. Format: the person's "role" makes them describable.
    // Expand this list yourself with names your group will recognize —
    // e.g. m("Your Favorite Musician"), h("A Local Politician").
    words: [
      e("Santa Claus"), e("Superman"), e("Mickey Mouse"), e("James Bond"),
      e("Sherlock Holmes"), e("Cinderella"), e("Robin Hood"), e("Tarzan"),
      m("Albert Einstein"), m("William Shakespeare"), m("Leonardo da Vinci"),
      m("Napoleon"), m("Cleopatra"), m("Mozart"), m("Pelé"),
      m("Muhammad Ali"), m("Charlie Chaplin"), m("Neil Armstrong"),
      m("Christopher Columbus"), m("Julius Caesar"),
      h("Isaac Newton"), h("Marie Curie"), h("Nikola Tesla"),
      h("Vincent van Gogh"), h("Beethoven"), h("Genghis Khan"),
      h("Nelson Mandela"), h("Pablo Picasso"),
    ],
  },
  {
    id: "occupations",
    name: "Occupations",
    icon: "briefcase",
    accentColor: "#F97316",
    words: [
      e("teacher"), e("doctor"), e("police officer"), e("chef"),
      e("firefighter"), e("farmer"), e("singer"), e("driver"),
      e("nurse"), e("soldier"),
      m("pilot"), m("dentist"), m("lawyer"), m("plumber"), m("barber"),
      m("photographer"), m("mechanic"), m("waiter"), m("journalist"),
      m("electrician"), m("tailor"), m("fisherman"), m("DJ"),
      m("referee"), m("magician"),
      h("astronaut"), h("archaeologist"), h("surgeon"), h("air traffic controller"),
      h("sommelier"), h("auctioneer"), h("undertaker"), h("lighthouse keeper"),
    ],
  },
  {
    id: "actions",
    name: "Actions & Verbs",
    icon: "body",
    accentColor: "#22D3EE",
    words: [
      e("swimming"), e("dancing"), e("sleeping"), e("eating"), e("running"),
      e("crying"), e("laughing"), e("jumping"), e("clapping"), e("singing"),
      e("sneezing"), e("typing"),
      m("juggling"), m("fishing"), m("ironing"), m("shaving"), m("skiing"),
      m("painting"), m("boxing"), m("praying"), m("whistling"),
      m("hitchhiking"), m("snoring"), m("stretching"), m("saluting"),
      m("tiptoeing"),
      h("sleepwalking"), h("moonwalking"), h("proposing"), h("meditating"),
      h("limbo dancing"), h("shadow boxing"), h("conducting an orchestra"),
      h("parallel parking"),
    ],
  },
  {
    id: "places",
    name: "Famous Places & Landmarks",
    icon: "earth",
    accentColor: "#A78BFA",
    words: [
      e("Eiffel Tower"), e("Paris"), e("New York"), e("London"),
      e("beach"), e("desert"), e("jungle"), e("pyramid"),
      m("Great Wall of China"), m("Statue of Liberty"), m("Big Ben"),
      m("Mount Everest"), m("Sahara Desert"), m("Amazon Rainforest"),
      m("Niagara Falls"), m("Taj Mahal"), m("Dubai"), m("Tokyo"),
      m("Sydney Opera House"), m("Colosseum"), m("Grand Canyon"),
      m("Hollywood"), m("Las Vegas"),
      h("Machu Picchu"), h("Stonehenge"), h("Leaning Tower of Pisa"),
      h("Bermuda Triangle"), h("Great Barrier Reef"), h("Mount Kilimanjaro"),
      h("Petra"), h("Easter Island"),
    ],
  },
  {
    id: "food-drinks",
    name: "Food & Drinks",
    icon: "restaurant",
    accentColor: "#FB7185",
    words: [
      e("pizza"), e("banana"), e("ice cream"), e("chocolate"), e("coffee"),
      e("rice"), e("egg"), e("bread"), e("apple"), e("cake"),
      e("water"), e("chicken wings"),
      m("spaghetti"), m("hamburger"), m("popcorn"), m("pancakes"),
      m("sushi"), m("tacos"), m("hot dog"), m("milkshake"), m("doughnut"),
      m("french fries"), m("watermelon"), m("lemonade"), m("peanut butter"),
      m("croissant"),
      h("escargot"), h("tiramisu"), h("guacamole"), h("kombucha"),
      h("ratatouille"), h("bubble tea"), h("fondue"), h("paella"),
    ],
  },
  {
    id: "emotions",
    name: "Emotions & Expressions",
    icon: "happy",
    accentColor: "#FBBF24",
    words: [
      e("happy"), e("sad"), e("angry"), e("scared"), e("tired"),
      e("surprised"), e("bored"), e("excited"), e("shy"), e("hungry"),
      m("jealous"), m("confused"), m("embarrassed"), m("proud"),
      m("nervous"), m("disgusted"), m("suspicious"), m("in love"),
      m("frustrated"), m("relieved"), m("grumpy"), m("terrified"),
      m("heartbroken"), m("impatient"),
      h("nostalgic"), h("overwhelmed"), h("starstruck"), h("hangry"),
      h("déjà vu"), h("awkward silence"), h("guilty conscience"),
      h("stage fright"),
    ],
  },
  {
    id: "sports",
    name: "Sports",
    icon: "football",
    accentColor: "#34D399",
    words: [
      e("football"), e("basketball"), e("swimming"), e("boxing"),
      e("tennis"), e("running"), e("cycling"), e("golf"),
      e("volleyball"), e("ping pong"),
      m("baseball"), m("cricket"), m("rugby"), m("karate"), m("gymnastics"),
      m("skateboarding"), m("surfing"), m("archery"), m("bowling"),
      m("wrestling"), m("ice skating"), m("weightlifting"), m("marathon"),
      m("penalty kick"), m("slam dunk"),
      h("fencing"), h("curling"), h("pole vault"), h("synchronized swimming"),
      h("javelin throw"), h("bobsled"), h("triathlon"), h("sumo wrestling"),
    ],
  },
  {
    id: "cameroon",
    name: "Cameroon Special",
    icon: "flag",
    accentColor: "#F87171",
    // Local flavor deck — food, places, music, and everyday life in Cameroon.
    words: [
      e("fufu corn"), e("moto taxi"), e("Douala"), e("Yaoundé"),
      m("ndolé"), m("achu"), m("Limbe"), m("jama-jama"), m("okok"),
      m("Njangi"), m("Mount Cameroon"), m("bikutsi"), m("makossa"),
      m("eru"), m("puff-puff"), m("soya"), m("Bamenda"), m("Kribi beach"),
      m("garri"), m("plantains"), m("Indomitable Lions"), m("palm wine"),
      m("Bafoussam"), m("koki"), m("mbongo tchobi"),
      h("Waza National Park"), h("Foumban Palace"), h("Lake Nyos"),
      h("Reunification Monument"), h("Mokolo market"),
    ],
  },
  {
    id: "tech-companies",
    name: "Tech Companies & Apps",
    icon: "logo-github",
    accentColor: "#60A5FA",
    words: [
      e("Google"), e("YouTube"), e("Facebook"), e("WhatsApp"), e("Apple"),
      e("Instagram"), e("TikTok"), e("Netflix"), e("Amazon"), e("Uber"),
      m("Microsoft"), m("Twitter"), m("Snapchat"), m("Spotify"), m("Zoom"),
      m("PayPal"), m("Samsung"), m("Airbnb"), m("LinkedIn"), m("Tesla"),
      m("Wikipedia"), m("Gmail"), m("Google Maps"), m("Candy Crush"),
      h("GitHub"), h("Slack"), h("Reddit"), h("Duolingo"), h("Shazam"),
      h("Photoshop"), h("Bitcoin"), h("ChatGPT"),
    ],
  },
];

/** "Mix All" pseudo-deck id used by the deck-select screen. */
export const MIX_ALL_ID = "mix-all";

export function getDeckById(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}

/** Returns playable words for a deck id (or all decks for MIX_ALL_ID), filtered by difficulty. */
export function getWordsFor(
  deckId: string,
  difficulty: Difficulty | "all"
): Word[] {
  const source =
    deckId === MIX_ALL_ID
      ? decks.flatMap((d) => d.words)
      : getDeckById(deckId)?.words ?? [];
  return difficulty === "all"
    ? source
    : source.filter((w) => w.difficulty === difficulty);
}

/** Fisher–Yates shuffle (non-mutating). */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
