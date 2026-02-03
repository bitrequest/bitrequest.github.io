/**
 * XmrUtils - Standalone Monero cryptocurrency utilities
 * 
 * STANDALONE USAGE (outside Bitrequest):
 * ----------------------------------------
 * <script src="assets_js_lib_sjcl.js"></script>
 * <script src="assets_js_lib_crypto_utils.js"></script>
 * <script src="assets_js_lib_xmr_utils.js"></script>
 * <script>
 *   const keys = XmrUtils.xmr_getpubs(secret_spend_key, 0);
 *   const amount = XmrUtils.decode_rct_amount(encrypted, shared_secret);
 *   const tx = XmrUtils.parse_xmr_tx_hex(raw_tx_hex);
 * </script>
 * 
 * FEATURES:
 * - Monero key derivation (spend key, view key, subaddresses)
 * - Address generation and validation
 * - Transaction parsing and payment detection
 * - RingCT amount decryption
 * - Payment ID handling
 * - Mnemonic seed conversion
 * 
 * DEPENDENCIES:
 * - sjcl.js
 * - crypto_utils.js (for hex_to_bytes, bytes_to_hex, keccak_256, egcd,
 *   Ed25519 curve arithmetic: EdPoint, ed25519_point_multiply, etc.)
 * 
 * @version 1.1.0
 * @license AGPL-3.0
 * @see https://github.com/bitrequest/bitrequest.github.io
 */

// ============================================
// CONSTANTS
// ============================================

const l = ED25519.n,
    xmr_words = [
        "abbey", "abducts", "ability", "ablaze", "abnormal", "abort", "abrasive", "absorb", "abyss", "academy", "aces", "aching", "acidic", "acoustic", "acquire", "across", "actress", "acumen", "adapt", "addicted", "adept", "adhesive", "adjust", "adopt", "adrenalin", "adult", "adventure", "aerial", "afar", "affair", "afield", "afloat", "afoot", "afraid", "after", "against", "agenda", "aggravate", "agile", "aglow", "agnostic", "agony", "agreed", "ahead", "aided", "ailments", "aimless", "airport", "aisle", "ajar", "akin", "alarms", "album", "alchemy", "alerts", "algebra", "alkaline", "alley", "almost", "aloof", "alpine", "already", "also", "altitude", "alumni", "always", "amaze", "ambush", "amended", "amidst", "ammo", "amnesty", "among", "amply", "amused", "anchor", "android", "anecdote", "angled", "ankle", "annoyed", "answers", "antics", "anvil", "anxiety", "anybody", "apart", "apex", "aphid", "aplomb", "apology", "apply", "apricot", "aptitude", "aquarium", "arbitrary", "archer", "ardent", "arena", "argue", "arises", "army", "around", "arrow", "arsenic", "artistic", "ascend", "ashtray", "aside", "asked", "asleep", "aspire", "assorted", "asylum", "athlete", "atlas", "atom", "atrium", "attire", "auburn", "auctions", "audio", "august", "aunt", "austere", "autumn", "avatar", "avidly", "avoid", "awakened", "awesome", "awful", "awkward", "awning", "awoken", "axes", "axis", "axle", "aztec", "azure", "baby", "bacon", "badge", "baffles", "bagpipe", "bailed", "bakery", "balding", "bamboo", "banjo", "baptism", "basin", "batch", "bawled", "bays", "because", "beer", "befit", "begun", "behind", "being", "below", "bemused", "benches", "berries", "bested", "betting", "bevel", "beware", "beyond", "bias", "bicycle", "bids", "bifocals", "biggest", "bikini", "bimonthly", "binocular", "biology", "biplane", "birth", "biscuit", "bite", "biweekly", "blender", "blip", "bluntly", "boat", "bobsled", "bodies", "bogeys", "boil", "boldly", "bomb", "border", "boss", "both", "bounced", "bovine", "bowling", "boxes", "boyfriend", "broken", "brunt", "bubble", "buckets", "budget", "buffet", "bugs", "building", "bulb", "bumper", "bunch", "business", "butter", "buying", "buzzer", "bygones", "byline", "bypass", "cabin", "cactus", "cadets", "cafe", "cage", "cajun", "cake", "calamity", "camp", "candy", "casket", "catch", "cause", "cavernous", "cease", "cedar", "ceiling", "cell", "cement", "cent", "certain", "chlorine", "chrome", "cider", "cigar", "cinema", "circle", "cistern", "citadel", "civilian", "claim", "click", "clue", "coal", "cobra", "cocoa", "code", "coexist", "coffee", "cogs", "cohesive", "coils", "colony", "comb", "cool", "copy", "corrode", "costume", "cottage", "cousin", "cowl", "criminal", "cube", "cucumber", "cuddled", "cuffs", "cuisine", "cunning", "cupcake", "custom", "cycling", "cylinder", "cynical", "dabbing", "dads", "daft", "dagger", "daily", "damp", "dangerous", "dapper", "darted", "dash", "dating", "dauntless", "dawn", "daytime", "dazed", "debut", "decay", "dedicated", "deepest", "deftly", "degrees", "dehydrate", "deity", "dejected", "delayed", "demonstrate", "dented", "deodorant", "depth", "desk", "devoid", "dewdrop", "dexterity", "dialect", "dice", "diet", "different", "digit", "dilute", "dime", "dinner", "diode", "diplomat", "directed", "distance", "ditch", "divers", "dizzy", "doctor", "dodge", "does", "dogs", "doing", "dolphin", "domestic", "donuts", "doorway", "dormant", "dosage", "dotted", "double", "dove", "down", "dozen", "dreams", "drinks", "drowning", "drunk", "drying", "dual", "dubbed", "duckling", "dude", "duets", "duke", "dullness", "dummy", "dunes", "duplex", "duration", "dusted", "duties", "dwarf", "dwelt", "dwindling", "dying", "dynamite", "dyslexic", "each", "eagle", "earth", "easy", "eating", "eavesdrop", "eccentric", "echo", "eclipse", "economics", "ecstatic", "eden", "edgy", "edited", "educated", "eels", "efficient", "eggs", "egotistic", "eight", "either", "eject", "elapse", "elbow", "eldest", "eleven", "elite", "elope", "else", "eluded", "emails", "ember", "emerge", "emit", "emotion", "empty", "emulate", "energy", "enforce", "enhanced", "enigma", "enjoy", "enlist", "enmity", "enough", "enraged", "ensign", "entrance", "envy", "epoxy", "equip", "erase", "erected", "erosion", "error", "eskimos", "espionage", "essential", "estate", "etched", "eternal", "ethics", "etiquette", "evaluate", "evenings", "evicted", "evolved", "examine", "excess", "exhale", "exit", "exotic", "exquisite", "extra", "exult", "fabrics", "factual", "fading", "fainted", "faked", "fall", "family", "fancy", "farming", "fatal", "faulty", "fawns", "faxed", "fazed", "feast", "february", "federal", "feel", "feline", "females", "fences", "ferry", "festival", "fetches", "fever", "fewest", "fiat", "fibula", "fictional", "fidget", "fierce", "fifteen", "fight", "films", "firm", "fishing", "fitting", "five", "fixate", "fizzle", "fleet", "flippant", "flying", "foamy", "focus", "foes", "foggy", "foiled", "folding", "fonts", "foolish", "fossil", "fountain", "fowls", "foxes", "foyer", "framed", "friendly", "frown", "fruit", "frying", "fudge", "fuel", "fugitive", "fully", "fuming", "fungal", "furnished", "fuselage", "future", "fuzzy", "gables", "gadget", "gags", "gained", "galaxy", "gambit", "gang", "gasp", "gather", "gauze", "gave", "gawk", "gaze", "gearbox", "gecko", "geek", "gels", "gemstone", "general", "geometry", "germs", "gesture", "getting", "geyser", "ghetto", "ghost", "giant", "giddy", "gifts", "gigantic", "gills", "gimmick", "ginger", "girth", "giving", "glass", "gleeful", "glide", "gnaw", "gnome", "goat", "goblet", "godfather", "goes", "goggles", "going", "goldfish", "gone", "goodbye", "gopher", "gorilla", "gossip", "gotten", "gourmet", "governing", "gown", "greater", "grunt", "guarded", "guest", "guide", "gulp", "gumball", "guru", "gusts", "gutter", "guys", "gymnast", "gypsy", "gyrate", "habitat", "hacksaw", "haggled", "hairy", "hamburger", "happens", "hashing", "hatchet", "haunted", "having", "hawk", "haystack", "hazard", "hectare", "hedgehog", "heels", "hefty", "height", "hemlock", "hence", "heron", "hesitate", "hexagon", "hickory", "hiding", "highway", "hijack", "hiker", "hills", "himself", "hinder", "hippo", "hire", "history", "hitched", "hive", "hoax", "hobby", "hockey", "hoisting", "hold", "honked", "hookup", "hope", "hornet", "hospital", "hotel", "hounded", "hover", "howls", "hubcaps", "huddle", "huge", "hull", "humid", "hunter", "hurried", "husband", "huts", "hybrid", "hydrogen", "hyper", "iceberg", "icing", "icon", "identity", "idiom", "idled", "idols", "igloo", "ignore", "iguana", "illness", "imagine", "imbalance", "imitate", "impel", "inactive", "inbound", "incur", "industrial", "inexact", "inflamed", "ingested", "initiate", "injury", "inkling", "inline", "inmate", "innocent", "inorganic", "input", "inquest", "inroads", "insult", "intended", "inundate", "invoke", "inwardly", "ionic", "irate", "iris", "irony", "irritate", "island", "isolated", "issued", "italics", "itches", "items", "itinerary", "itself", "ivory", "jabbed", "jackets", "jaded", "jagged", "jailed", "jamming", "january", "jargon", "jaunt", "javelin", "jaws", "jazz", "jeans", "jeers", "jellyfish", "jeopardy", "jerseys", "jester", "jetting", "jewels", "jigsaw", "jingle", "jittery", "jive", "jobs", "jockey", "jogger", "joining", "joking", "jolted", "jostle", "journal", "joyous", "jubilee", "judge", "juggled", "juicy", "jukebox", "july", "jump", "junk", "jury", "justice", "juvenile", "kangaroo", "karate", "keep", "kennel", "kept", "kernels", "kettle", "keyboard", "kickoff", "kidneys", "king", "kiosk", "kisses", "kitchens", "kiwi", "knapsack", "knee", "knife", "knowledge", "knuckle", "koala", "laboratory", "ladder", "lagoon", "lair", "lakes", "lamb", "language", "laptop", "large", "last", "later", "launching", "lava", "lawsuit", "layout", "lazy", "lectures", "ledge", "leech", "left", "legion", "leisure", "lemon", "lending", "leopard", "lesson", "lettuce", "lexicon", "liar", "library", "licks", "lids", "lied", "lifestyle", "light", "likewise", "lilac", "limits", "linen", "lion", "lipstick", "liquid", "listen", "lively", "loaded", "lobster", "locker", "lodge", "lofty", "logic", "loincloth", "long", "looking", "lopped", "lordship", "losing", "lottery", "loudly", "love", "lower", "loyal", "lucky", "luggage", "lukewarm", "lullaby", "lumber", "lunar", "lurk", "lush", "luxury", "lymph", "lynx", "lyrics", "macro", "madness", "magically", "mailed", "major", "makeup", "malady", "mammal", "maps", "masterful", "match", "maul", "maverick", "maximum", "mayor", "maze", "meant", "mechanic", "medicate", "meeting", "megabyte", "melting", "memoir", "menu", "merger", "mesh", "metro", "mews", "mice", "midst", "mighty", "mime", "mirror", "misery", "mittens", "mixture", "moat", "mobile", "mocked", "mohawk", "moisture", "molten", "moment", "money", "moon", "mops", "morsel", "mostly", "motherly", "mouth", "movement", "mowing", "much", "muddy", "muffin", "mugged", "mullet", "mumble", "mundane", "muppet", "mural", "musical", "muzzle", "myriad", "mystery", "myth", "nabbing", "nagged", "nail", "names", "nanny", "napkin", "narrate", "nasty", "natural", "nautical", "navy", "nearby", "necklace", "needed", "negative", "neither", "neon", "nephew", "nerves", "nestle", "network", "neutral", "never", "newt", "nexus", "nibs", "niche", "niece", "nifty", "nightly", "nimbly", "nineteen", "nirvana", "nitrogen", "nobody", "nocturnal", "nodes", "noises", "nomad", "noodles", "northern", "nostril", "noted", "nouns", "novelty", "nowhere", "nozzle", "nuance", "nucleus", "nudged", "nugget", "nuisance", "null", "number", "nuns", "nurse", "nutshell", "nylon", "oaks", "oars", "oasis", "oatmeal", "obedient", "object", "obliged", "obnoxious", "observant", "obtains", "obvious", "occur", "ocean", "october", "odds", "odometer", "offend", "often", "oilfield", "ointment", "okay", "older", "olive", "olympics", "omega", "omission", "omnibus", "onboard", "oncoming", "oneself", "ongoing", "onion", "online", "onslaught", "onto", "onward", "oozed", "opacity", "opened", "opposite", "optical", "opus", "orange", "orbit", "orchid", "orders", "organs", "origin", "ornament", "orphans", "oscar", "ostrich", "otherwise", "otter", "ouch", "ought", "ounce", "ourselves", "oust", "outbreak", "oval", "oven", "owed", "owls", "owner", "oxidant", "oxygen", "oyster", "ozone", "pact", "paddles", "pager", "pairing", "palace", "pamphlet", "pancakes", "paper", "paradise", "pastry", "patio", "pause", "pavements", "pawnshop", "payment", "peaches", "pebbles", "peculiar", "pedantic", "peeled", "pegs", "pelican", "pencil", "people", "pepper", "perfect", "pests", "petals", "phase", "pheasants", "phone", "phrases", "physics", "piano", "picked", "pierce", "pigment", "piloted", "pimple", "pinched", "pioneer", "pipeline", "pirate", "pistons", "pitched", "pivot", "pixels", "pizza", "playful", "pledge", "pliers", "plotting", "plus", "plywood", "poaching", "pockets", "podcast", "poetry", "point", "poker", "polar", "ponies", "pool", "popular", "portents", "possible", "potato", "pouch", "poverty", "powder", "pram", "present", "pride", "problems", "pruned", "prying", "psychic", "public", "puck", "puddle", "puffin", "pulp", "pumpkins", "punch", "puppy", "purged", "push", "putty", "puzzled", "pylons", "pyramid", "python", "queen", "quick", "quote", "rabbits", "racetrack", "radar", "rafts", "rage", "railway", "raking", "rally", "ramped", "randomly", "rapid", "rarest", "rash", "rated", "ravine", "rays", "razor", "react", "rebel", "recipe", "reduce", "reef", "refer", "regular", "reheat", "reinvest", "rejoices", "rekindle", "relic", "remedy", "renting", "reorder", "repent", "request", "reruns", "rest", "return", "reunion", "revamp", "rewind", "rhino", "rhythm", "ribbon", "richly", "ridges", "rift", "rigid", "rims", "ringing", "riots", "ripped", "rising", "ritual", "river", "roared", "robot", "rockets", "rodent", "rogue", "roles", "romance", "roomy", "roped", "roster", "rotate", "rounded", "rover", "rowboat", "royal", "ruby", "rudely", "ruffled", "rugged", "ruined", "ruling", "rumble", "runway", "rural", "rustled", "ruthless", "sabotage", "sack", "sadness", "safety", "saga", "sailor", "sake", "salads", "sample", "sanity", "sapling", "sarcasm", "sash", "satin", "saucepan", "saved", "sawmill", "saxophone", "sayings", "scamper", "scenic", "school", "science", "scoop", "scrub", "scuba", "seasons", "second", "sedan", "seeded", "segments", "seismic", "selfish", "semifinal", "sensible", "september", "sequence", "serving", "session", "setup", "seventh", "sewage", "shackles", "shelter", "shipped", "shocking", "shrugged", "shuffled", "shyness", "siblings", "sickness", "sidekick", "sieve", "sifting", "sighting", "silk", "simplest", "sincerely", "sipped", "siren", "situated", "sixteen", "sizes", "skater", "skew", "skirting", "skulls", "skydive", "slackens", "sleepless", "slid", "slower", "slug", "smash", "smelting", "smidgen", "smog", "smuggled", "snake", "sneeze", "sniff", "snout", "snug", "soapy", "sober", "soccer", "soda", "software", "soggy", "soil", "solved", "somewhere", "sonic", "soothe", "soprano", "sorry", "southern", "sovereign", "sowed", "soya", "space", "speedy", "sphere", "spiders", "splendid", "spout", "sprig", "spud", "spying", "square", "stacking", "stellar", "stick", "stockpile", "strained", "stunning", "stylishly", "subtly", "succeed", "suddenly", "suede", "suffice", "sugar", "suitcase", "sulking", "summon", "sunken", "superior", "surfer", "sushi", "suture", "swagger", "swept", "swiftly", "sword", "swung", "syllabus", "symptoms", "syndrome", "syringe", "system", "taboo", "tacit", "tadpoles", "tagged", "tail", "taken", "talent", "tamper", "tanks", "tapestry", "tarnished", "tasked", "tattoo", "taunts", "tavern", "tawny", "taxi", "teardrop", "technical", "tedious", "teeming", "tell", "template", "tender", "tepid", "tequila", "terminal", "testing", "tether", "textbook", "thaw", "theatrics", "thirsty", "thorn", "threaten", "thumbs", "thwart", "ticket", "tidy", "tiers", "tiger", "tilt", "timber", "tinted", "tipsy", "tirade", "tissue", "titans", "toaster", "tobacco", "today", "toenail", "toffee", "together", "toilet", "token", "tolerant", "tomorrow", "tonic", "toolbox", "topic", "torch", "tossed", "total", "touchy", "towel", "toxic", "toyed", "trash", "trendy", "tribal", "trolling", "truth", "trying", "tsunami", "tubes", "tucks", "tudor", "tuesday", "tufts", "tugs", "tuition", "tulips", "tumbling", "tunnel", "turnip", "tusks", "tutor", "tuxedo", "twang", "tweezers", "twice", "twofold", "tycoon", "typist", "tyrant", "ugly", "ulcers", "ultimate", "umbrella", "umpire", "unafraid", "unbending", "uncle", "under", "uneven", "unfit", "ungainly", "unhappy", "union", "unjustly", "unknown", "unlikely", "unmask", "unnoticed", "unopened", "unplugs", "unquoted", "unrest", "unsafe", "until", "unusual", "unveil", "unwind", "unzip", "upbeat", "upcoming", "update", "upgrade", "uphill", "upkeep", "upload", "upon", "upper", "upright", "upstairs", "uptight", "upwards", "urban", "urchins", "urgent", "usage", "useful", "usher", "using", "usual", "utensils", "utility", "utmost", "utopia", "uttered", "vacation", "vague", "vain", "value", "vampire", "vane", "vapidly", "vary", "vastness", "vats", "vaults", "vector", "veered", "vegan", "vehicle", "vein", "velvet", "venomous", "verification", "vessel", "veteran", "vexed", "vials", "vibrate", "victim", "video", "viewpoint", "vigilant", "viking", "village", "vinegar", "violin", "vipers", "virtual", "visited", "vitals", "vivid", "vixen", "vocal", "vogue", "voice", "volcano", "vortex", "voted", "voucher", "vowels", "voyage", "vulture", "wade", "waffle", "wagtail", "waist", "waking", "wallets", "wanted", "warped", "washing", "water", "waveform", "waxing", "wayside", "weavers", "website", "wedge", "weekday", "weird", "welders", "went", "wept", "were", "western", "wetsuit", "whale", "when", "whipped", "whole", "wickets", "width", "wield", "wife", "wiggle", "wildly", "winter", "wipeout", "wiring", "wise", "withdrawn", "wives", "wizard", "wobbly", "woes", "woken", "wolf", "womanly", "wonders", "woozy", "worry", "wounded", "woven", "wrap", "wrist", "wrong", "yacht", "yahoo", "yanks", "yard", "yawning", "yearbook", "yellow", "yesterday", "yeti", "yields", "yodel", "yoga", "younger", "yoyo", "zapped", "zeal", "zebra", "zero", "zesty", "zigzags", "zinger", "zippers", "zodiac", "zombie", "zones", "zoom"
    ];

// ============================================
// TEST CONSTANTS
// ============================================

const xmr_utils_const = {
    "version": "1.1.0",
    // bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
    // "army van defense carry jealous true garbage claim echo media make crunch"
    // via BIP44 path m/44'/128'/0'/0/0 + sc_reduce32(fasthash(privkey))
    "test_spend_key": "007d984c3df532fdd86cd83bf42482a5c2e180a51ae1d0096e13048fba1fa108",
    "test_view_key": "e4d63789cdfa2ec48571e93e47520690b2c6e11386c90448e8b357d1cd917c00",
    "test_address": "477h3C6E6C4VLMR36bQL3yLcA8Aq3jts1AHLzm5QXipDdXVCYPnKEvUKykh2GTYqkkeQoTEhWpzvVQ4rMgLM1YpeD6qdHbS"
};

// ============================================
// MONERO BASE58 ENCODING
// ============================================

const cn_base_58 = (function() {
    const b58 = {},
        alphabet_str = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        alphabet = [];
    for (let i = 0; i < alphabet_str.length; i++) {
        alphabet.push(alphabet_str.charCodeAt(i));
    }
    const encoded_block_sizes = [0, 2, 3, 5, 6, 7, 9, 10, 11],
        full_block_size = 8,
        full_encoded_block_size = 11,
        UINT64_MAX = BigInt("18446744073709551615");

    function hextobin(hex) {
        if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
        const res = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length / 2; ++i) {
            res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
        return res;
    }

    function bintohex(bin) {
        const out = [];
        for (let i = 0; i < bin.length; ++i) {
            out.push(("0" + bin[i].toString(16)).slice(-2));
        }
        return out.join("");
    }

    function uint8_be_to_64(data) {
        let num = 0n;
        for (let i = 0; i < data.length; i++) {
            num = (num << 8n) | BigInt(data[i]);
        }
        return num;
    }

    function uint64_to_8be(num, size) {
        const res = new Uint8Array(size);
        if (size < 1 || size > 8) {
            throw "Invalid input length";
        }
        let twopow8 = 256n;
        for (let i = size - 1; i >= 0; i--) {
            res[i] = Number(num % twopow8);
            num = num / twopow8;
        }
        return res;
    }

    function encode_block(data, buf, index) {
        let num = uint8_be_to_64(data);
        const i = encoded_block_sizes[data.length];
        for (let s = i - 1; s >= 0; s--) {
            buf[index + s] = alphabet[Number(num % 58n)];
            num = num / 58n;
        }
        return buf;
    }

    function decode_block(data, buf, index) {
        if (data.length < 1 || data.length > full_encoded_block_size) {
            throw "Invalid block length: " + data.length;
        }
        const idx = encoded_block_sizes.indexOf(data.length);
        if (idx === -1) {
            throw "Invalid block size";
        }
        let num = 0n;
        for (let i = 0; i < data.length; i++) {
            const alpha_idx = alphabet.indexOf(data[i]);
            if (alpha_idx === -1) {
                throw "Invalid character";
            }
            num = num * 58n + BigInt(alpha_idx);
        }
        if (num > UINT64_MAX) {
            throw "Overflow";
        }
        const res = uint64_to_8be(num, idx);
        for (let i = 0; i < res.length; i++) {
            buf[index + i] = res[i];
        }
        return buf;
    }

    b58.encode = function(hex) {
        const data = hextobin(hex);
        if (data.length === 0) return "";
        const full_block_count = Math.floor(data.length / full_block_size),
            last_block_size = data.length % full_block_size,
            res_size = full_block_count * full_encoded_block_size + encoded_block_sizes[last_block_size];
        let res = new Uint8Array(res_size);
        for (let i = 0; i < full_block_count; i++) {
            res = encode_block(data.subarray(i * full_block_size, i * full_block_size + full_block_size), res, i * full_encoded_block_size);
        }
        if (last_block_size > 0) {
            res = encode_block(data.subarray(full_block_count * full_block_size, full_block_count * full_block_size + last_block_size), res, full_block_count * full_encoded_block_size);
        }
        return bintohex(res);
    };

    b58.decode = function(enc) {
        const data = str_to_bin(enc);
        if (data.length === 0) return "";
        const full_block_count = Math.floor(data.length / full_encoded_block_size),
            last_block_size = data.length % full_encoded_block_size,
            last_block_decoded_size = encoded_block_sizes.indexOf(last_block_size);
        if (last_block_decoded_size < 0) {
            throw "Invalid encoded length";
        }
        const data_size = full_block_count * full_block_size + last_block_decoded_size;
        let data_res = new Uint8Array(data_size);
        for (let i = 0; i < full_block_count; i++) {
            data_res = decode_block(data.subarray(i * full_encoded_block_size, i * full_encoded_block_size + full_encoded_block_size), data_res, i * full_block_size);
        }
        if (last_block_size > 0) {
            data_res = decode_block(data.subarray(full_block_count * full_encoded_block_size, full_block_count * full_encoded_block_size + last_block_size), data_res, full_block_count * full_block_size);
        }
        return bintohex(data_res);
    };

    return b58;
})();

// ============================================
// BYTE/NUMBER UTILITIES
// ============================================

// Converts string to binary Uint8Array
function str_to_bin(str) {
    const res = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        res[i] = str.charCodeAt(i);
    }
    return res;
}

// Converts unsigned 64-bit integer to big-endian byte array
function uint64_to_8be(num, size) {
    const res = new Uint8Array(size);
    if (size < 1 || size > 8) {
        throw "Invalid input length";
    }
    let twopow8 = 256n;
    for (let i = size - 1; i >= 0; i--) {
        res[i] = Number(num % twopow8);
        num = num / twopow8;
    }
    return res;
}

// Converts Uint8Array to BigInt (little-endian)
// Converts 32-bit unsigned integer to 8-character hex string
function uint32_hex(value) {
    const buffer = new ArrayBuffer(4),
        view = new DataView(buffer);
    view.setUint32(0, value, true);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Converts BigInt to hexadecimal string with even length padding
function xmr_number_to_hex(num) {
    const hex = num.toString(16);
    return hex.length % 2 === 1 ? "0" + hex : hex;
}

// ============================================


// Converts an elliptic curve point to Monero's compressed hex format
function point_to_monero_hex(point) {
    const y_hex = point.y.toString(16).padStart(64, "0"),
        y_bytes = [];
    for (let i = y_hex.length - 2; i >= 0; i -= 2) {
        y_bytes.push(parseInt(y_hex.slice(i, i + 2), 16));
    }
    if ((point.x & 1n) === 1n) {
        y_bytes[31] |= 0x80;
    }
    return y_bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// MNEMONIC & SECRET KEY GENERATION
// ============================================

// Generates cryptographically secure random bits using browser's crypto API
function mn_random(bits) {
    "use strict";
    if (bits % 32 !== 0) throw "Something weird went wrong: Invalid number of bits - " + bits;
    let array = new Uint32Array(bits / 32);
    if (!crypto) throw "JavaScript Crypto API not supported";
    let i = 0;

    function arr_is_zero() {
        for (let j = 0; j < bits / 32; ++j) {
            if (array[j] !== 0) return false
        }
        return true
    }
    do {
        crypto.getRandomValues(array);
        ++i;
    } while (i < 5 && arr_is_zero());
    if (arr_is_zero()) {
        throw "Something went wrong and we could not securely generate random data for your account";
    }
    let out = "";
    for (let j = 0; j < bits / 32; ++j) {
        out += ("0000000" + array[j].toString(16)).slice(-8);
    }
    return out;
}

// Converts a 32-byte secret spend key into a 25-word Monero mnemonic with checksum
function secret_spend_key_to_words(ssk) {
    const seed = [];
    let for_checksum = "";
    for (let i = 0; i < 32; i += 4) {
        let w0 = 0;
        for (let j = 3; j >= 0; j--) w0 = w0 * 256 + ssk[i + j];
        let xmrwl = xmr_words.length,
            w1 = w0 % xmrwl,
            w2 = ((w0 / xmrwl | 0) + w1) % xmrwl,
            w3 = (((w0 / xmrwl | 0) / xmrwl | 0) + w2) % xmrwl;
        seed.push(xmr_words[w1]);
        seed.push(xmr_words[w2]);
        seed.push(xmr_words[w3]);
        for_checksum += xmr_words[w1].substring(0, 3);
        for_checksum += xmr_words[w2].substring(0, 3);
        for_checksum += xmr_words[w3].substring(0, 3);
    }
    seed.push(seed[crc_32(for_checksum) % 24]);
    return seed.join(" ");
}

// Converts a 25-word Monero mnemonic back to a 32-byte secret spend key
function words_to_secret_spend_key(mnemonic) {
    const words = mnemonic.toLowerCase().trim().split(/\s+/);
    if (words.length !== 25) {
        throw new Error("Monero mnemonic must be exactly 25 words");
    }

    // Get indices for all words
    const indices = words.map((word, i) => {
        const idx = xmr_words.indexOf(word);
        if (idx === -1) throw new Error(`Invalid word at position ${i + 1}: "${word}"`);
        return idx;
    });

    // Verify checksum (25th word should match word at position CRC32 % 24)
    let for_checksum = "";
    for (let i = 0; i < 24; i++) {
        for_checksum += words[i].substring(0, 3);
    }
    const expected_checksum_idx = crc_32(for_checksum) % 24;
    if (indices[24] !== indices[expected_checksum_idx]) {
        throw new Error("Checksum mismatch");
    }

    // Decode 24 words (8 groups of 3) back to 32 bytes
    const ssk = new Uint8Array(32),
        n = xmr_words.length; // 1626

    for (let i = 0; i < 8; i++) {
        const w1 = indices[i * 3],
            w2 = indices[i * 3 + 1],
            w3 = indices[i * 3 + 2];

        // Reverse the encoding: recover w0 from w1, w2, w3
        const y = (w2 - w1 + n) % n, // floor(w0 / n)
            x = (w3 - w2 + n) % n, // floor(w0 / n²)
            w0 = x * n * n + y * n + w1;

        // Convert to 4 bytes (little-endian)
        ssk[i * 4] = w0 & 0xFF;
        ssk[i * 4 + 1] = (w0 >>> 8) & 0xFF;
        ssk[i * 4 + 2] = (w0 >>> 16) & 0xFF;
        ssk[i * 4 + 3] = (w0 >>> 24) & 0xFF;
    }
    return ssk;
}

// Derives a Monero secret spend key from either a BIP39 mnemonic phrase or its seed
function get_ssk(bip39, seed) {
    const p_rootkey = (seed === true) ? get_rootkey(bip39) : get_rootkey(mnemonic_to_seed(bip39)),
        dx_dat = {
            "dpath": "m/44'/128'/0'/0/0",
            "key": p_rootkey.slice(0, 64),
            "cc": p_rootkey.slice(64)
        },
        x_keys_dat = derive_x(dx_dat),
        rootkey = x_keys_dat.key;
    return sc_reduce32(fasthash(rootkey));
}

// Performs modular reduction of a 32-byte hex string against Monero's curve order l
function sc_reduce32(hex) {
    return hex_to_bytes(str_pad((BigInt("0x" + bytes_to_hex(hex_to_bytes(hex).reverse())) % l).toString(16), 64)).reverse();
}

// ============================================
// CRC32 CHECKSUM
// ============================================

// Calculates a 32-bit CRC checksum using the IEEE 802.3 polynomial
function crc_32(str) {
    let crcTable = window.crcTable || (window.crcTable = make_crc_table()),
        crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// Constructs a lookup table for CRC-32 polynomial 0xEDB88320 calculations
function make_crc_table() {
    let c,
        crcTable = [];
    for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

// ============================================
// ADDRESS GENERATION
// ============================================

// Generates a standardized Monero address from public keys with network-specific prefix
function pub_keys_to_address(psk, pvk, index) {
    const pref = (index < 1) ? "12" : "2a",
        res_hex = pref + psk + pvk,
        cpa = res_hex + fasthash(res_hex).slice(0, 8);
    return base58_encode(hex_to_bytes(cpa));
}

// Generates Monero keys and addresses from secret spend key
function xmr_getpubs(ssk, index) {
    const sskh = bytes_to_hex(ssk),
        svk = bytes_to_hex(sc_reduce32(fasthash(sskh))),
        psk = ed25519_point_multiply(sskh).toHex(),
        pvk = ed25519_point_multiply(svk).toHex(),
        account = pub_keys_to_address(psk, pvk, 0);
    if (index < 1) {
        return {
            "index": 0,
            "account": account,
            "address": account,
            "ssk": sskh,
            "svk": svk,
            "psk": psk,
            "pvk": pvk
        }
    }
    const pubp = ed25519_point_multiply(sc_reduce32(fasthash(5375624164647200 + svk + uint32_hex(0) + uint32_hex(index)))),
        pskp = EdPoint.fromHex(psk),
        np = pskp.add(pubp),
        sub_psk = np.toHex(),
        sub_pvk = np.multiply(EdPoint.fromHex(svk).y).toHex();
    return {
        "index": index,
        "account": account,
        "address": pub_keys_to_address(sub_psk, sub_pvk, index),
        "ssk": sskh,
        "svk": svk,
        "psk": sub_psk,
        "pvk": sub_pvk
    }
}

// ============================================
// HASHING
// ============================================

// Computes and returns a Keccak-256 hash of input hexadecimal data
function fasthash(hex) {
    return keccak_256(hex_to_bytes(hex));
}

// ============================================
// BASE58 ENCODING (MONERO-SPECIFIC)
// ============================================

// Implements Monero's modified Base58 encoding algorithm for address generation
function base58_encode(data) {
    const ab = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        ab_map = {},
        btl = [0, 2, 3, 5, 6, 7, 9, 10, 11],
        base = ab.length;
    for (let z = 0; z < ab.length; z++) {
        const x = ab.charAt(z);
        if (ab_map[x] !== undefined) throw new TypeError(x + " is ambiguous");
        ab_map[x] = z;
    }

    function encode_partial(data, pos) {
        let len = 8;
        if (pos + len > data.length) len = data.length - pos;
        const digits = [0];
        for (let i = 0; i < len; ++i) {
            for (var j = 0, carry = data[pos + i]; j < digits.length; ++j) {
                carry += digits[j] << 8;
                digits[j] = carry % base;
                carry = (carry / base) | 0;
            }
            while (carry > 0) {
                digits.push(carry % base);
                carry = (carry / base) | 0;
            }
        }
        let res = "";
        for (let k = digits.length; k < btl[len]; ++k) res += ab[0];
        for (let q = digits.length - 1; q >= 0; --q) res += ab[digits[q]];
        return res;
    }
    let resu = "";
    for (let i = 0; i < data.length; i += 8) {
        resu += encode_partial(data, i);
    }
    return resu;
}

// ============================================
// VIEW KEY MANAGEMENT
// ============================================

// Parses view key string into structured account and key data
function vk_obj(vk) {
    if (vk.length === 64) {
        return {
            "account": false,
            "vk": vk
        }
    }
    if (vk.length === 159) {
        return {
            "account": vk.slice(0, 95),
            "vk": vk.slice(95)
        }
    }
    return false
}

// Checks user preference for view key sharing setting
function share_vk() {
    const vkshare = cs_node("monero", "Share viewkey", true).selected;
    if (vkshare === true) {
        return true
    }
    return false
}

// Extracts spend pubkey from Monero address
function get_spend_pubkey_from_address(address) {
    try {
        const decoded = cn_base_58.decode(address);
        return decoded.slice(2, 66);
    } catch (e) {
        console.error("Could not extract spend pubkey:", e);
        return null;
    }
}

// ============================================
// PAYMENT ID FUNCTIONS
// ============================================

// Generates a 16-byte cryptographically secure random payment ID
function xmr_pid() {
    return mn_random(256).slice(0, 16);
}

// Validates payment ID format: must be 16 hexadecimal characters
function check_pid(payment_id) {
    const payment_id_length = payment_id.length;
    if (payment_id_length !== 16) {
        return false
    }
    const pattern = RegExp("^[0-9a-fA-F]{16}$");
    if (pattern.test(payment_id) != true) {
        return false
    }
    return true
}

// ============================================
// TRANSACTION PARSING
// ============================================

// Decodes a Monero transaction from hex string into a structured object
function parse_xmr_tx_hex(tx_hex) {
    const bytes = hex_to_bytes(tx_hex);
    let offset = 0;

    function read_varint() {
        let result = 0n,
            shift = 0n;
        while (offset < bytes.length) {
            const byte = bytes[offset++];
            result |= BigInt(byte & 0x7f) << shift;
            shift += 7n;
            if ((byte & 0x80) === 0) break;
        }
        return result;
    }

    function read_bytes(count) {
        const result = bytes.slice(offset, offset + count);
        offset += count;
        return result;
    }

    const tx = {};
    tx.version = Number(read_varint());
    tx.unlock_time = Number(read_varint());

    const vin_count = read_varint();
    tx.vin = [];
    for (let i = 0; i < vin_count; i++) {
        const input_type = bytes[offset++];
        if (input_type === 0x02) {
            const input = {};
            input.amount = Number(read_varint());
            const key_offsets_count = read_varint();
            input.key_offsets = [];
            for (let j = 0; j < key_offsets_count; j++) {
                input.key_offsets.push(Number(read_varint()));
            }
            input.k_image = bytes_to_hex(read_bytes(32));
            tx.vin.push({
                "key": input
            });
        }
    }

    const vout_count = Number(read_varint());
    tx.vout = [];
    for (let i = 0; i < vout_count; i++) {
        const output = {};
        output.amount = Number(read_varint());
        const target_type = bytes[offset++];
        if (target_type === 0x03) {
            const key = bytes_to_hex(read_bytes(32)),
                view_tag = bytes_to_hex(read_bytes(1));
            output.target = {
                tagged_key: {
                    key,
                    view_tag
                }
            };
        }
        tx.vout.push(output);
    }

    const extra_size = Number(read_varint());
    tx.extra = Array.from(read_bytes(extra_size));

    if (offset < bytes.length) {
        const rct_type = bytes[offset++];
        tx.rct_signatures = {
            "type": rct_type
        };
        if (rct_type > 0) {
            tx.rct_signatures.txnFee = Number(read_varint());
            if (rct_type === 5 || rct_type === 6) {
                tx.rct_signatures.ecdhInfo = [];
                for (let i = 0; i < vout_count; i++) {
                    const amount = bytes_to_hex(read_bytes(8));
                    tx.rct_signatures.ecdhInfo.push({
                        amount
                    });
                }
            }
        }
    }
    return tx;
}

// Find payment ID tag (0x02) in extra field
function extract_xmr_payment_id(extra_bytes, tx_pub_key, view_key) {
    let i = 0;
    while (i < extra_bytes.length) {
        const tag = extra_bytes[i];
        if (tag === 0x00) {
            i++;
            continue;
        }
        if (tag === 0x01) {
            i += 33;
            continue;
        }
        if (tag === 0x02) {
            if (i + 2 >= extra_bytes.length) break;
            const length = extra_bytes[i + 1],
                nonce_type = extra_bytes[i + 2];
            if (nonce_type === 0x01 && length === 0x09) {
                if (i + 11 > extra_bytes.length) return false;
                const encrypted_pid = extra_bytes.slice(i + 3, i + 11),
                    r_point = EdPoint.fromHex(tx_pub_key),
                    a_scalar = ed_bytes_to_number_le(hex_to_bytes(view_key)),
                    derivation_point = r_point.multiply(a_scalar).multiply(8n),
                    derivation_bytes = derivation_point.toRawBytes(),
                    tail_byte = new Uint8Array([0x8d]),
                    hash_input = concat_bytes(derivation_bytes, tail_byte),
                    hash = fasthash(bytes_to_hex(hash_input)),
                    key = hex_to_bytes(hash.slice(0, 16)),
                    decrypted_pid = new Uint8Array(8);
                for (let j = 0; j < 8; j++) {
                    decrypted_pid[j] = encrypted_pid[j] ^ key[j];
                }
                const payment_id_hex = bytes_to_hex(decrypted_pid);
                if (payment_id_hex === "0000000000000000") {
                    return false;
                }
                return {
                    "type": "encrypted",
                    "payment_id": payment_id_hex
                };
            } else if (nonce_type === 0x00 && length === 0x21) {
                if (i + 35 > extra_bytes.length) return false;
                const unencrypted_pid = extra_bytes.slice(i + 3, i + 35),
                    payment_id_hex = bytes_to_hex(unencrypted_pid);
                if (payment_id_hex === "00000000000000000000000000000000000000000000000000000000000000") {
                    return false;
                }
                return {
                    "type": "unencrypted",
                    "payment_id": payment_id_hex
                };
            }
            i += 2 + length;
            continue;
        }
        if (tag === 0x04) {
            const count = extra_bytes[i + 1];
            i += 2 + (count * 32);
            continue;
        }
        i++;
    }
    return false;
}

// Decrypts the amount for a specific output in a RingCT transaction
function decode_rct_amount(rct, output_idx, shared_secret_hex) {
    const encrypted_amount_hex = rct?.ecdhInfo?.[output_idx]?.amount;
    if (!encrypted_amount_hex) return null;
    const rct_type = rct.type;
    let scalar;

    if (rct_type === 5 || rct_type === 6) {
        const derivation_data = concat_bytes(
            hex_to_bytes(shared_secret_hex),
            encode_varint(output_idx)
        );
        scalar = bytes_to_hex(sc_reduce32(fasthash(bytes_to_hex(derivation_data))));
    } else {
        scalar = bytes_to_hex(sc_reduce32(fasthash(shared_secret_hex)));
    }

    const prefix_bytes = str_to_bin("amount"),
        hash_input = concat_bytes(prefix_bytes, hex_to_bytes(scalar)),
        amount_key = fasthash(bytes_to_hex(hash_input)),
        key_bytes = hex_to_bytes(amount_key.slice(0, 16)),
        encrypted_bytes = hex_to_bytes(encrypted_amount_hex),
        decrypted_bytes = new Uint8Array(8);

    for (let i = 0; i < 8; i++) {
        decrypted_bytes[i] = encrypted_bytes[i] ^ key_bytes[i];
    }
    return ed_bytes_to_number_le(decrypted_bytes);
}

// ============================================
// COMPATIBILITY TESTING
// ============================================

// Tests Secret Spend Key → Full Wallet Keys derivation
// Can be called with custom spend_key/expected_address or uses defaults from xmr_utils_const
function test_xmr_derivation(spend_key, expected_address) {
    try {
        const ssk = spend_key || hex_to_bytes(xmr_utils_const.test_spend_key),
            expected = expected_address || xmr_utils_const.test_address,
            derived = xmr_getpubs(ssk, 0);
        return derived.address === expected;
    } catch (e) {
        console.error("XmrUtils test_xmr_derivation:", e.message);
        return false;
    }
}

// Tests XMR public key derivation from spend key
function test_xmr_keys() {
    try {
        const spend_key = hex_to_bytes(xmr_utils_const.test_spend_key),
            derived = xmr_getpubs(spend_key, 0);
        return derived.svk === xmr_utils_const.test_view_key;
    } catch (e) {
        console.error("XmrUtils test_xmr_keys:", e.message);
        return false;
    }
}

// Tests XMR address generation
function test_xmr_address() {
    try {
        const spend_key = hex_to_bytes(xmr_utils_const.test_spend_key),
            derived = xmr_getpubs(spend_key, 0);
        return derived.address === xmr_utils_const.test_address;
    } catch (e) {
        console.error("XmrUtils test_xmr_address:", e.message);
        return false;
    }
}

// Full compatibility test - calls CryptoUtils tests + XMR tests
function test_xmr_compatibility() {
    const start_time = typeof performance !== "undefined" ? performance.now() : Date.now(),
        results = {
            "compatible": false,
            "crypto_api": false,
            "bigint": false,
            "keys": false,
            "address": false,
            "errors": [],
            "timing_ms": 0
        };

    // Fail fast: Check crypto basics from CryptoUtils
    results.crypto_api = CryptoUtils.test_crypto_api();
    if (!results.crypto_api) {
        results.errors.push("crypto API not available");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("XmrUtils: Compatibility test failed", results.errors);
        return results;
    }

    results.bigint = CryptoUtils.test_bigint();
    if (!results.bigint) {
        results.errors.push("BigInt not functional");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("XmrUtils: Compatibility test failed", results.errors);
        return results;
    }

    // Test XMR key derivation
    results.keys = test_xmr_keys();
    if (!results.keys) {
        results.errors.push("XMR key derivation failed");
    }

    // Test XMR address generation
    results.address = test_xmr_address();
    if (!results.address) {
        results.errors.push("XMR address generation failed");
    }

    results.compatible = results.keys && results.address;
    results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;

    if (results.errors.length > 0) {
        console.error("XmrUtils: Compatibility test failed", results.errors);
    }

    return results;
}

// ============================================
// MODULE EXPORT
// ============================================

const XmrUtils = {
    // Library info
    VERSION: "1.1.0",

    // Curve parameters
    ED25519: ED25519,

    // === Byte/Number Utilities ===
    str_to_bin,
    uint64_to_8be,
    ed_bytes_to_number_le,
    uint32_hex,
    xmr_number_to_hex,

    // === Elliptic Curve Operations (from crypto_utils) ===
    EdPoint,
    ed25519_point_multiply,
    point_to_monero_hex,

    // === Key Operations ===
    get_ssk,
    sc_reduce32,
    xmr_getpubs,

    // === Mnemonic ===
    mn_random,
    secret_spend_key_to_words,
    words_to_secret_spend_key,

    // === Address Operations ===
    pub_keys_to_address,
    vk_obj,
    share_vk,
    get_spend_pubkey_from_address,
    base58_encode,
    base58_decode: cn_base_58.decode,

    // === Hashing ===
    fasthash,
    crc_32,
    make_crc_table,

    // === Payment ID ===
    xmr_pid,
    check_pid,

    // === Transaction Parsing ===
    parse_xmr_tx_hex,
    extract_xmr_payment_id,
    decode_rct_amount,

    // === Constants ===
    xmr_utils_const,

    // === Testing ===
    test_xmr_derivation,
    test_xmr_keys,
    test_xmr_address,
    test_xmr_compatibility
};