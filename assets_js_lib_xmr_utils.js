const l = 7237005577332262213973186563042994240857116359379907606001950938285454250989n,
    xmr_words = [
        "abbey", "abducts", "ability", "ablaze", "abnormal", "abort", "abrasive", "absorb", "abyss", "academy", "aces", "aching", "acidic", "acoustic", "acquire", "across", "actress", "acumen", "adapt", "addicted", "adept", "adhesive", "adjust", "adopt", "adrenalin", "adult", "adventure", "aerial", "afar", "affair", "afield", "afloat", "afoot", "afraid", "after", "against", "agenda", "aggravate", "agile", "aglow", "agnostic", "agony", "agreed", "ahead", "aided", "ailments", "aimless", "airport", "aisle", "ajar", "akin", "alarms", "album", "alchemy", "alerts", "algebra", "alkaline", "alley", "almost", "aloof", "alpine", "already", "also", "altitude", "alumni", "always", "amaze", "ambush", "amended", "amidst", "ammo", "amnesty", "among", "amply", "amused", "anchor", "android", "anecdote", "angled", "ankle", "annoyed", "answers", "antics", "anvil", "anxiety", "anybody", "apart", "apex", "aphid", "aplomb", "apology", "apply", "apricot", "aptitude", "aquarium", "arbitrary", "archer", "ardent", "arena", "argue", "arises", "army", "around", "arrow", "arsenic", "artistic", "ascend", "ashtray", "aside", "asked", "asleep", "aspire", "assorted", "asylum", "athlete", "atlas", "atom", "atrium", "attire", "auburn", "auctions", "audio", "august", "aunt", "austere", "autumn", "avatar", "avidly", "avoid", "awakened", "awesome", "awful", "awkward", "awning", "awoken", "axes", "axis", "axle", "aztec", "azure", "baby", "bacon", "badge", "baffles", "bagpipe", "bailed", "bakery", "balding", "bamboo", "banjo", "baptism", "basin", "batch", "bawled", "bays", "because", "beer", "befit", "begun", "behind", "being", "below", "bemused", "benches", "berries", "bested", "betting", "bevel", "beware", "beyond", "bias", "bicycle", "bids", "bifocals", "biggest", "bikini", "bimonthly", "binocular", "biology", "biplane", "birth", "biscuit", "bite", "biweekly", "blender", "blip", "bluntly", "boat", "bobsled", "bodies", "bogeys", "boil", "boldly", "bomb", "border", "boss", "both", "bounced", "bovine", "bowling", "boxes", "boyfriend", "broken", "brunt", "bubble", "buckets", "budget", "buffet", "bugs", "building", "bulb", "bumper", "bunch", "business", "butter", "buying", "buzzer", "bygones", "byline", "bypass", "cabin", "cactus", "cadets", "cafe", "cage", "cajun", "cake", "calamity", "camp", "candy", "casket", "catch", "cause", "cavernous", "cease", "cedar", "ceiling", "cell", "cement", "cent", "certain", "chlorine", "chrome", "cider", "cigar", "cinema", "circle", "cistern", "citadel", "civilian", "claim", "click", "clue", "coal", "cobra", "cocoa", "code", "coexist", "coffee", "cogs", "cohesive", "coils", "colony", "comb", "cool", "copy", "corrode", "costume", "cottage", "cousin", "cowl", "criminal", "cube", "cucumber", "cuddled", "cuffs", "cuisine", "cunning", "cupcake", "custom", "cycling", "cylinder", "cynical", "dabbing", "dads", "daft", "dagger", "daily", "damp", "dangerous", "dapper", "darted", "dash", "dating", "dauntless", "dawn", "daytime", "dazed", "debut", "decay", "dedicated", "deepest", "deftly", "degrees", "dehydrate", "deity", "dejected", "delayed", "demonstrate", "dented", "deodorant", "depth", "desk", "devoid", "dewdrop", "dexterity", "dialect", "dice", "diet", "different", "digit", "dilute", "dime", "dinner", "diode", "diplomat", "directed", "distance", "ditch", "divers", "dizzy", "doctor", "dodge", "does", "dogs", "doing", "dolphin", "domestic", "donuts", "doorway", "dormant", "dosage", "dotted", "double", "dove", "down", "dozen", "dreams", "drinks", "drowning", "drunk", "drying", "dual", "dubbed", "duckling", "dude", "duets", "duke", "dullness", "dummy", "dunes", "duplex", "duration", "dusted", "duties", "dwarf", "dwelt", "dwindling", "dying", "dynamite", "dyslexic", "each", "eagle", "earth", "easy", "eating", "eavesdrop", "eccentric", "echo", "eclipse", "economics", "ecstatic", "eden", "edgy", "edited", "educated", "eels", "efficient", "eggs", "egotistic", "eight", "either", "eject", "elapse", "elbow", "eldest", "eleven", "elite", "elope", "else", "eluded", "emails", "ember", "emerge", "emit", "emotion", "empty", "emulate", "energy", "enforce", "enhanced", "enigma", "enjoy", "enlist", "enmity", "enough", "enraged", "ensign", "entrance", "envy", "epoxy", "equip", "erase", "erected", "erosion", "error", "eskimos", "espionage", "essential", "estate", "etched", "eternal", "ethics", "etiquette", "evaluate", "evenings", "evicted", "evolved", "examine", "excess", "exhale", "exit", "exotic", "exquisite", "extra", "exult", "fabrics", "factual", "fading", "fainted", "faked", "fall", "family", "fancy", "farming", "fatal", "faulty", "fawns", "faxed", "fazed", "feast", "february", "federal", "feel", "feline", "females", "fences", "ferry", "festival", "fetches", "fever", "fewest", "fiat", "fibula", "fictional", "fidget", "fierce", "fifteen", "fight", "films", "firm", "fishing", "fitting", "five", "fixate", "fizzle", "fleet", "flippant", "flying", "foamy", "focus", "foes", "foggy", "foiled", "folding", "fonts", "foolish", "fossil", "fountain", "fowls", "foxes", "foyer", "framed", "friendly", "frown", "fruit", "frying", "fudge", "fuel", "fugitive", "fully", "fuming", "fungal", "furnished", "fuselage", "future", "fuzzy", "gables", "gadget", "gags", "gained", "galaxy", "gambit", "gang", "gasp", "gather", "gauze", "gave", "gawk", "gaze", "gearbox", "gecko", "geek", "gels", "gemstone", "general", "geometry", "germs", "gesture", "getting", "geyser", "ghetto", "ghost", "giant", "giddy", "gifts", "gigantic", "gills", "gimmick", "ginger", "girth", "giving", "glass", "gleeful", "glide", "gnaw", "gnome", "goat", "goblet", "godfather", "goes", "goggles", "going", "goldfish", "gone", "goodbye", "gopher", "gorilla", "gossip", "gotten", "gourmet", "governing", "gown", "greater", "grunt", "guarded", "guest", "guide", "gulp", "gumball", "guru", "gusts", "gutter", "guys", "gymnast", "gypsy", "gyrate", "habitat", "hacksaw", "haggled", "hairy", "hamburger", "happens", "hashing", "hatchet", "haunted", "having", "hawk", "haystack", "hazard", "hectare", "hedgehog", "heels", "hefty", "height", "hemlock", "hence", "heron", "hesitate", "hexagon", "hickory", "hiding", "highway", "hijack", "hiker", "hills", "himself", "hinder", "hippo", "hire", "history", "hitched", "hive", "hoax", "hobby", "hockey", "hoisting", "hold", "honked", "hookup", "hope", "hornet", "hospital", "hotel", "hounded", "hover", "howls", "hubcaps", "huddle", "huge", "hull", "humid", "hunter", "hurried", "husband", "huts", "hybrid", "hydrogen", "hyper", "iceberg", "icing", "icon", "identity", "idiom", "idled", "idols", "igloo", "ignore", "iguana", "illness", "imagine", "imbalance", "imitate", "impel", "inactive", "inbound", "incur", "industrial", "inexact", "inflamed", "ingested", "initiate", "injury", "inkling", "inline", "inmate", "innocent", "inorganic", "input", "inquest", "inroads", "insult", "intended", "inundate", "invoke", "inwardly", "ionic", "irate", "iris", "irony", "irritate", "island", "isolated", "issued", "italics", "itches", "items", "itinerary", "itself", "ivory", "jabbed", "jackets", "jaded", "jagged", "jailed", "jamming", "january", "jargon", "jaunt", "javelin", "jaws", "jazz", "jeans", "jeers", "jellyfish", "jeopardy", "jerseys", "jester", "jetting", "jewels", "jigsaw", "jingle", "jittery", "jive", "jobs", "jockey", "jogger", "joining", "joking", "jolted", "jostle", "journal", "joyous", "jubilee", "judge", "juggled", "juicy", "jukebox", "july", "jump", "junk", "jury", "justice", "juvenile", "kangaroo", "karate", "keep", "kennel", "kept", "kernels", "kettle", "keyboard", "kickoff", "kidneys", "king", "kiosk", "kisses", "kitchens", "kiwi", "knapsack", "knee", "knife", "knowledge", "knuckle", "koala", "laboratory", "ladder", "lagoon", "lair", "lakes", "lamb", "language", "laptop", "large", "last", "later", "launching", "lava", "lawsuit", "layout", "lazy", "lectures", "ledge", "leech", "left", "legion", "leisure", "lemon", "lending", "leopard", "lesson", "lettuce", "lexicon", "liar", "library", "licks", "lids", "lied", "lifestyle", "light", "likewise", "lilac", "limits", "linen", "lion", "lipstick", "liquid", "listen", "lively", "loaded", "lobster", "locker", "lodge", "lofty", "logic", "loincloth", "long", "looking", "lopped", "lordship", "losing", "lottery", "loudly", "love", "lower", "loyal", "lucky", "luggage", "lukewarm", "lullaby", "lumber", "lunar", "lurk", "lush", "luxury", "lymph", "lynx", "lyrics", "macro", "madness", "magically", "mailed", "major", "makeup", "malady", "mammal", "maps", "masterful", "match", "maul", "maverick", "maximum", "mayor", "maze", "meant", "mechanic", "medicate", "meeting", "megabyte", "melting", "memoir", "menu", "merger", "mesh", "metro", "mews", "mice", "midst", "mighty", "mime", "mirror", "misery", "mittens", "mixture", "moat", "mobile", "mocked", "mohawk", "moisture", "molten", "moment", "money", "moon", "mops", "morsel", "mostly", "motherly", "mouth", "movement", "mowing", "much", "muddy", "muffin", "mugged", "mullet", "mumble", "mundane", "muppet", "mural", "musical", "muzzle", "myriad", "mystery", "myth", "nabbing", "nagged", "nail", "names", "nanny", "napkin", "narrate", "nasty", "natural", "nautical", "navy", "nearby", "necklace", "needed", "negative", "neither", "neon", "nephew", "nerves", "nestle", "network", "neutral", "never", "newt", "nexus", "nibs", "niche", "niece", "nifty", "nightly", "nimbly", "nineteen", "nirvana", "nitrogen", "nobody", "nocturnal", "nodes", "noises", "nomad", "noodles", "northern", "nostril", "noted", "nouns", "novelty", "nowhere", "nozzle", "nuance", "nucleus", "nudged", "nugget", "nuisance", "null", "number", "nuns", "nurse", "nutshell", "nylon", "oaks", "oars", "oasis", "oatmeal", "obedient", "object", "obliged", "obnoxious", "observant", "obtains", "obvious", "occur", "ocean", "october", "odds", "odometer", "offend", "often", "oilfield", "ointment", "okay", "older", "olive", "olympics", "omega", "omission", "omnibus", "onboard", "oncoming", "oneself", "ongoing", "onion", "online", "onslaught", "onto", "onward", "oozed", "opacity", "opened", "opposite", "optical", "opus", "orange", "orbit", "orchid", "orders", "organs", "origin", "ornament", "orphans", "oscar", "ostrich", "otherwise", "otter", "ouch", "ought", "ounce", "ourselves", "oust", "outbreak", "oval", "oven", "owed", "owls", "owner", "oxidant", "oxygen", "oyster", "ozone", "pact", "paddles", "pager", "pairing", "palace", "pamphlet", "pancakes", "paper", "paradise", "pastry", "patio", "pause", "pavements", "pawnshop", "payment", "peaches", "pebbles", "peculiar", "pedantic", "peeled", "pegs", "pelican", "pencil", "people", "pepper", "perfect", "pests", "petals", "phase", "pheasants", "phone", "phrases", "physics", "piano", "picked", "pierce", "pigment", "piloted", "pimple", "pinched", "pioneer", "pipeline", "pirate", "pistons", "pitched", "pivot", "pixels", "pizza", "playful", "pledge", "pliers", "plotting", "plus", "plywood", "poaching", "pockets", "podcast", "poetry", "point", "poker", "polar", "ponies", "pool", "popular", "portents", "possible", "potato", "pouch", "poverty", "powder", "pram", "present", "pride", "problems", "pruned", "prying", "psychic", "public", "puck", "puddle", "puffin", "pulp", "pumpkins", "punch", "puppy", "purged", "push", "putty", "puzzled", "pylons", "pyramid", "python", "queen", "quick", "quote", "rabbits", "racetrack", "radar", "rafts", "rage", "railway", "raking", "rally", "ramped", "randomly", "rapid", "rarest", "rash", "rated", "ravine", "rays", "razor", "react", "rebel", "recipe", "reduce", "reef", "refer", "regular", "reheat", "reinvest", "rejoices", "rekindle", "relic", "remedy", "renting", "reorder", "repent", "request", "reruns", "rest", "return", "reunion", "revamp", "rewind", "rhino", "rhythm", "ribbon", "richly", "ridges", "rift", "rigid", "rims", "ringing", "riots", "ripped", "rising", "ritual", "river", "roared", "robot", "rockets", "rodent", "rogue", "roles", "romance", "roomy", "roped", "roster", "rotate", "rounded", "rover", "rowboat", "royal", "ruby", "rudely", "ruffled", "rugged", "ruined", "ruling", "rumble", "runway", "rural", "rustled", "ruthless", "sabotage", "sack", "sadness", "safety", "saga", "sailor", "sake", "salads", "sample", "sanity", "sapling", "sarcasm", "sash", "satin", "saucepan", "saved", "sawmill", "saxophone", "sayings", "scamper", "scenic", "school", "science", "scoop", "scrub", "scuba", "seasons", "second", "sedan", "seeded", "segments", "seismic", "selfish", "semifinal", "sensible", "september", "sequence", "serving", "session", "setup", "seventh", "sewage", "shackles", "shelter", "shipped", "shocking", "shrugged", "shuffled", "shyness", "siblings", "sickness", "sidekick", "sieve", "sifting", "sighting", "silk", "simplest", "sincerely", "sipped", "siren", "situated", "sixteen", "sizes", "skater", "skew", "skirting", "skulls", "skydive", "slackens", "sleepless", "slid", "slower", "slug", "smash", "smelting", "smidgen", "smog", "smuggled", "snake", "sneeze", "sniff", "snout", "snug", "soapy", "sober", "soccer", "soda", "software", "soggy", "soil", "solved", "somewhere", "sonic", "soothe", "soprano", "sorry", "southern", "sovereign", "sowed", "soya", "space", "speedy", "sphere", "spiders", "splendid", "spout", "sprig", "spud", "spying", "square", "stacking", "stellar", "stick", "stockpile", "strained", "stunning", "stylishly", "subtly", "succeed", "suddenly", "suede", "suffice", "sugar", "suitcase", "sulking", "summon", "sunken", "superior", "surfer", "sushi", "suture", "swagger", "swept", "swiftly", "sword", "swung", "syllabus", "symptoms", "syndrome", "syringe", "system", "taboo", "tacit", "tadpoles", "tagged", "tail", "taken", "talent", "tamper", "tanks", "tapestry", "tarnished", "tasked", "tattoo", "taunts", "tavern", "tawny", "taxi", "teardrop", "technical", "tedious", "teeming", "tell", "template", "tender", "tepid", "tequila", "terminal", "testing", "tether", "textbook", "thaw", "theatrics", "thirsty", "thorn", "threaten", "thumbs", "thwart", "ticket", "tidy", "tiers", "tiger", "tilt", "timber", "tinted", "tipsy", "tirade", "tissue", "titans", "toaster", "tobacco", "today", "toenail", "toffee", "together", "toilet", "token", "tolerant", "tomorrow", "tonic", "toolbox", "topic", "torch", "tossed", "total", "touchy", "towel", "toxic", "toyed", "trash", "trendy", "tribal", "trolling", "truth", "trying", "tsunami", "tubes", "tucks", "tudor", "tuesday", "tufts", "tugs", "tuition", "tulips", "tumbling", "tunnel", "turnip", "tusks", "tutor", "tuxedo", "twang", "tweezers", "twice", "twofold", "tycoon", "typist", "tyrant", "ugly", "ulcers", "ultimate", "umbrella", "umpire", "unafraid", "unbending", "uncle", "under", "uneven", "unfit", "ungainly", "unhappy", "union", "unjustly", "unknown", "unlikely", "unmask", "unnoticed", "unopened", "unplugs", "unquoted", "unrest", "unsafe", "until", "unusual", "unveil", "unwind", "unzip", "upbeat", "upcoming", "update", "upgrade", "uphill", "upkeep", "upload", "upon", "upper", "upright", "upstairs", "uptight", "upwards", "urban", "urchins", "urgent", "usage", "useful", "usher", "using", "usual", "utensils", "utility", "utmost", "utopia", "uttered", "vacation", "vague", "vain", "value", "vampire", "vane", "vapidly", "vary", "vastness", "vats", "vaults", "vector", "veered", "vegan", "vehicle", "vein", "velvet", "venomous", "verification", "vessel", "veteran", "vexed", "vials", "vibrate", "victim", "video", "viewpoint", "vigilant", "viking", "village", "vinegar", "violin", "vipers", "virtual", "visited", "vitals", "vivid", "vixen", "vocal", "vogue", "voice", "volcano", "vortex", "voted", "voucher", "vowels", "voyage", "vulture", "wade", "waffle", "wagtail", "waist", "waking", "wallets", "wanted", "warped", "washing", "water", "waveform", "waxing", "wayside", "weavers", "website", "wedge", "weekday", "weird", "welders", "went", "wept", "were", "western", "wetsuit", "whale", "when", "whipped", "whole", "wickets", "width", "wield", "wife", "wiggle", "wildly", "winter", "wipeout", "wiring", "wise", "withdrawn", "wives", "wizard", "wobbly", "woes", "woken", "wolf", "womanly", "wonders", "woozy", "worry", "wounded", "woven", "wrap", "wrist", "wrong", "yacht", "yahoo", "yanks", "yard", "yawning", "yearbook", "yellow", "yesterday", "yeti", "yields", "yodel", "yoga", "younger", "yoyo", "zapped", "zeal", "zebra", "zero", "zesty", "zigzags", "zinger", "zippers", "zodiac", "zombie", "zones", "zoom"
    ],
    xmr_CURVE = {
        a: -1n,
        d: 37095705934669439343138083508754565189542113879843219016388785533085940283555n,
        P: 2n ** 255n - 19n,
        n: 2n ** 252n + 27742317777372353535851937790883648493n,
        h: 8n,
        Gx: 15112221349535400772501151409588531511454012693041857206046113283949847762202n,
        Gy: 46316835694926478169428394003475163141307993866256225615783033603165251855960n,
    },
    ENCODING_LENGTH = 32,
    DIV_8_MINUS_3 = (xmr_CURVE.P + 3n) / 8n,
    xmr_I = xpow_mod(2n, (xmr_CURVE.P + 1n) / 4n, xmr_CURVE.P),
    xmr_pointPrecomputes = new WeakMap(),
    cn_base_58 = (function() {
        const b58 = {},
            alphabet_str = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
            alphabet = [];
        for (let i = 0; i < alphabet_str.length; i++) {
            alphabet.push(alphabet_str.charCodeAt(i));
        }
        const encoded_block_sizes = [0, 2, 3, 5, 6, 7, 9, 10, 11],
            alphabet_size = alphabet.length,
            full_block_size = 8,
            full_encoded_block_size = 11,
            uint64_max = 2n ** 64n;

        // Decodes a single block of Base58 encoded data
        b58.decode_block = function(data, buf, index) {
            if (data.length < 1 || data.length > full_encoded_block_size) {
                throw "Invalid block length: " + data.length;
            }
            const res_size = encoded_block_sizes.indexOf(data.length);
            if (res_size <= 0) {
                throw "Invalid block size";
            }
            let res_num = 0n,
                order = 1n;
            for (let i = data.length - 1; i >= 0; i--) {
                const digit = alphabet.indexOf(data[i]);
                if (digit < 0) {
                    throw "Invalid symbol";
                }
                const product = (order * BigInt(digit)) + BigInt(res_num);
                if (product > uint64_max) { // UINT64_MAX as BigInt
                    throw "Overflow";
                }
                res_num = product;
                order = order * BigInt(alphabet_size);
            }
            if (res_size < full_block_size && ((2n ** BigInt(8 * res_size)) <= res_num)) {
                throw "Overflow 2";
            }
            buf.set(uint64_to_8be(res_num, res_size), index);
            return buf;
        };

        // Decodes a complete Base58 encoded string
        b58.decode = function(encode) {
            const enc = str_to_bin(encode);
            if (enc.length === 0) {
                return "";
            }
            const full_block_count = Math.floor(enc.length / full_encoded_block_size),
                last_block_size = enc.length % full_encoded_block_size,
                last_block_decoded_size = encoded_block_sizes.indexOf(last_block_size);
            if (last_block_decoded_size < 0) {
                throw "Invalid encoded length";
            }
            const data_size = full_block_count * full_block_size + last_block_decoded_size;
            let data = uint_8array(data_size);
            for (let i = 0; i < full_block_count; i++) {
                data = b58.decode_block(enc.subarray(i * full_encoded_block_size, i * full_encoded_block_size + full_encoded_block_size), data, i * full_block_size);
            }
            if (last_block_size > 0) {
                data = b58.decode_block(enc.subarray(full_block_count * full_encoded_block_size, full_block_count * full_encoded_block_size + last_block_size), data, full_block_count * full_block_size);
            }
            return bytes_to_hex(data);
        };
        return b58;
    })();

// ** Core Buffer & Conversion Utilities: **
//str_to_bin  
//uint64_to_8be
//bytes_to_number_le
//uint32_hex
//xmr_number_to_hex

// ** Mathematical Foundations: **
//xmod
//xpow_mod
//xmr_invert
//xmr_invert_batch

// ** Base Classes & Points: **
//ExtendedPoint class 
//xPoint class
//xmr_getpoint
//point_multiply
//xmr_get_publickey

// ** Mnemonic & Secret Key Generation: **
//mn_random
//secret_spend_key_to_words
//get_ssk
//sc_reduce32
//crc_32
//make_crc_table

// ** Address Generation: **
//pub_keys_to_address
//xmr_getpubs
//fasthash

// ** Base58 Encoding: **
//base58_encode

// ** View Key Management: **
//get_vk
//vk_obj
//share_vk
//get_spend_pubkey_from_address

// ** Payment ID Functions: **
//xmr_pid
//check_pid
//parse_xmr_tx_hex
//decode_rct_amount
//extract_xmr_payment_id

// ** Core Buffer & Conversion Utilities: **

// Creates a Uint8Array from a string by converting each character to its ASCII value
function str_to_bin(str) {
    const res = uint_8array(str.length);
    for (let i = 0; i < str.length; i++) {
        res[i] = str.charCodeAt(i);
    }
    return res;
}

// Converts a BigInt to a fixed-size big-endian byte array with range validation
function uint64_to_8be(num, size) {
    const res = uint_8array(size);
    if (size < 1 || size > 8) {
        throw "Invalid input length";
    }
    const twopow8 = 2n ** 8n;
    for (let i = size - 1; i >= 0; i--) {
        res[i] = Number(num % twopow8); // Convert remainder to Number
        num = num / twopow8; // BigInt division
    }
    return res;
}

// Converts a byte array to BigInt using little-endian byte ordering with bit-shifting
function bytes_to_number_le(uint8a) {
    let value = 0n;
    for (let i = 0; i < uint8a.length; i++) {
        value += BigInt(uint8a[i]) << (8n * BigInt(i));
    }
    return value;
}

// Formats a 32-bit number as an 8-character little-endian hex string
function uint32_hex(value) {
    let h = value.toString(16);
    if (h.length > 8) throw "value must not equal or exceed 2^32";
    while (h.length < 8) h = "0" + h;
    return h.match(/../g).reverse().join("");
}

// Converts a positive integer to hexadecimal with leading zero padding
function xmr_number_to_hex(num) {
    const hex = num.toString(16);
    return hex.length % 2 === 1 ? "0" + hex : hex;
}

// ** Mathematical Foundations: **

// Performs modular arithmetic with optional modulus defaulting to Monero curve order P
function xmod(a, b = xmr_CURVE.P) {
    const res = a % b;
    return res >= 0n ? res : b + res;
}

// Computes modular exponentiation using square-and-multiply algorithm with optional modulus P
function xpow_mod(a, power, m = xmr_CURVE.P) {
    let res = 1n;
    while (power > 0n) {
        if (power & 1n) {
            res = xmod(res * a, m);
        }
        power >>= 1n;
        a = xmod(a * a, m);
    }
    return res;
}

// Computes modular multiplicative inverse using Extended Euclidean Algorithm with optional curve modulus
function xmr_invert(number, modulo = xmr_CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error("invert: expected positive integers");
    }
    let [gcd, x] = egcd(xmod(number, modulo), modulo);
    if (gcd !== 1n) {
        throw new Error("invert: does not exist");
    }
    return xmod(x, modulo);
}

// Efficiently computes multiple modular inverses using Montgomery's batch inversion algorithm
function xmr_invert_batch(nums, n = xmr_CURVE.P) {
    const len = nums.length,
        scratch = new Array(len);
    let acc = 1n;
    for (let i = 0; i < len; i++) {
        if (nums[i] === 0n)
            continue;
        scratch[i] = acc;
        acc = xmod(acc * nums[i], n);
    }
    acc = xmr_invert(acc, n);
    for (let i = len - 1; i >= 0; i--) {
        if (nums[i] === 0n)
            continue;
        let tmp = xmod(acc * nums[i], n);
        nums[i] = xmod(acc * scratch[i], n);
        acc = tmp;
    }
    return nums;
}

// ** Base Classes & Points: **

class ExtendedPoint {
    constructor(x, y, z, t) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.t = t;
    }

    // Converts an affine point to an extended point
    static fromAffine(p) {
        if (!(p instanceof xPoint)) {
            throw new TypeError("ExtendedPoint#fromAffine: expected Point");
        }
        if (p.equals(xPoint.ZERO))
            return ExtendedPoint.ZERO;
        return new ExtendedPoint(p.x, p.y, 1n, xmod(p.x * p.y));
    }

    // Converts a batch of extended points to affine points
    static toAffineBatch(points) {
        const toInv = xmr_invert_batch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }

    // Normalizes the Z coordinate of a batch of points
    static normalizeZ(points) {
        return this.toAffineBatch(points).map(this.fromAffine);
    }

    // Negates the point
    negate() {
        return new ExtendedPoint(xmod(-this.x), this.y, this.z, xmod(-this.t));
    }

    // Doubles the point
    double() {
        const X1 = this.x,
            Y1 = this.y,
            Z1 = this.z,
            {
                a
            } = xmr_CURVE,
            A = xmod(X1 ** 2n),
            B = xmod(Y1 ** 2n),
            C = xmod(2n * Z1 ** 2n),
            D = xmod(a * A),
            E = xmod((X1 + Y1) ** 2n - A - B),
            G = xmod(D + B),
            F = xmod(G - C),
            H = xmod(D - B),
            X3 = xmod(E * F),
            Y3 = xmod(G * H),
            T3 = xmod(E * H),
            Z3 = xmod(F * G);
        return new ExtendedPoint(X3, Y3, Z3, T3);
    }

    // Adds another point to this point
    add(other) {
        const X1 = this.x,
            Y1 = this.y,
            Z1 = this.z,
            T1 = this.t,
            X2 = other.x,
            Y2 = other.y,
            Z2 = other.z,
            T2 = other.t,
            A = xmod((Y1 - X1) * (Y2 + X2)),
            B = xmod((Y1 + X1) * (Y2 - X2)),
            F = xmod(B - A);
        if (F === 0n) {
            return this.double();
        }
        const C = xmod(Z1 * 2n * T2),
            D = xmod(T1 * 2n * Z2),
            E = xmod(D + C),
            G = xmod(B + A),
            H = xmod(D - C),
            X3 = xmod(E * F),
            Y3 = xmod(G * H),
            T3 = xmod(E * H),
            Z3 = xmod(F * G);
        return new ExtendedPoint(X3, Y3, Z3, T3);
    }

    // Precomputes window of points for faster multiplication
    precomputeWindow(W) {
        const windows = 256 / W + 1;
        let points = [],
            p = this,
            base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }

    // Implements the w-ary non-adjacent form (wNAF) method for point multiplication
    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(ExtendedPoint.BASE))
            affinePoint = xPoint.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) {
            throw new Error("Point#wNAF: Invalid precomputation window, must be power of 2");
        }
        let precomputes = affinePoint && xmr_pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = ExtendedPoint.normalizeZ(precomputes);
                xmr_pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = ExtendedPoint.ZERO,
            f = ExtendedPoint.ZERO;
        const windows = 256 / W + 1,
            windowSize = 2 ** (W - 1),
            mask = BigInt(2 ** W - 1),
            maxNumber = 2 ** W,
            shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += 1n;
            }
            if (wbits === 0) {
                f = f.add(window % 2 ? precomputes[offset].negate() : precomputes[offset]);
            } else {
                const cached = precomputes[offset + Math.abs(wbits) - 1];
                p = p.add(wbits < 0 ? cached.negate() : cached);
            }
        }
        return [p, f];
    }

    // Multiplies the point by a scalar
    multiply(scalar, affinePoint) {
        if (typeof scalar !== "number" && typeof scalar !== "bigint") {
            throw new TypeError("Point#multiply: expected number or bigint");
        }
        const n = xmod(BigInt(scalar), xmr_CURVE.n);
        if (n <= 0) {
            throw new Error("Point#multiply: invalid scalar, expected positive integer");
        }
        return ExtendedPoint.normalizeZ(this.wNAF(n, affinePoint))[0];
    }

    // Converts the extended point to an affine point
    toAffine(invZ = xmr_invert(this.z)) {
        const x = xmod(this.x * invZ),
            y = xmod(this.y * invZ);
        return new xPoint(x, y);
    }
}
ExtendedPoint.ZERO = new ExtendedPoint(0n, 1n, 1n, 0n);

class xPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Sets the window size for precomputation
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        xmr_pointPrecomputes.delete(this);
    }

    // Creates a point from a hexadecimal string
    static fromHex(hash) {
        const {
            d,
            P
        } = xmr_CURVE,
        bytes = hash instanceof Uint8Array ? hash : hex_to_bytes(hash),
            len = bytes.length - 1,
            normedLast = bytes[len] & ~0x80,
            isLastByteOdd = (bytes[len] & 0x80) !== 0,
            normed = Uint8Array.from(Array.from(bytes.slice(0, len)).concat(normedLast)),
            y = bytes_to_number_le(normed);
        if (y >= P) {
            throw new Error("Point#fromHex expects hex <= Fp");
        }
        const sqrY = y * y,
            sqrX = xmod((sqrY - 1n) * xmr_invert(d * sqrY + 1n));
        let x = xpow_mod(sqrX, DIV_8_MINUS_3);
        if (xmod(x * x - sqrX) !== 0n) {
            x = xmod(x * xmr_I);
        }
        const isXOdd = (x & 1n) === 1n;
        if (isLastByteOdd !== isXOdd) {
            x = xmod(-x);
        }
        return new xPoint(x, y);
    }

    // Converts the point to raw bytes
    toRawBytes() {
        const hex = xmr_number_to_hex(this.y),
            u8 = uint_8array(ENCODING_LENGTH);
        for (let i = hex.length - 2, j = 0; j < ENCODING_LENGTH && i >= 0; i -= 2, j++) {
            u8[j] = parseInt(hex[i] + hex[i + 1], 16);
        }
        const mask = this.x & 1n ? 0x80 : 0;
        u8[ENCODING_LENGTH - 1] |= mask;
        return u8;
    }

    // Converts the point to a hexadecimal string
    toHex() {
        return bytes_to_hex(this.toRawBytes());
    }

    // Checks if this point is equal to another point
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    // Adds another point to this point
    add(other) {
        return ExtendedPoint.fromAffine(this).add(ExtendedPoint.fromAffine(other)).toAffine();
    }

    // Multiplies this point by a scalar
    multiply(scalar) {
        return ExtendedPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
xPoint.BASE = new xPoint(xmr_CURVE.Gx, xmr_CURVE.Gy);
xPoint.ZERO = new xPoint(0n, 1n);
xPoint.BASE._setWindowSize(8);

// Constructs an elliptic curve point from a 32-byte hex string representation
function xmr_getpoint(hex) {
    return xPoint.fromHex(hex);
}

// Performs scalar multiplication of curve base point with given hex-encoded scalar
function point_multiply(hex) {
    return xPoint.BASE.multiply(xmr_getpoint(hex).y);
}

// Derives a Monero public key by performing scalar multiplication with curve base point
function xmr_get_publickey(privateKey) {
    return point_multiply(privateKey).toHex();
}

// Converts an elliptic curve point to Monero's compressed hex format (y-coordinate with x-parity bit)
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

// ** Mnemonic & Secret Key Generation: **

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
    // Convert to hex
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

// ** Address Generation: **

// Generates a standardized Monero address from public keys with network-specific prefix (12 for mainnet, 2a for subaddress)
function pub_keys_to_address(psk, pvk, index) {
    const pref = (index < 1) ? "12" : "2a",
        res_hex = pref + psk + pvk,
        cpa = res_hex + fasthash(res_hex).slice(0, 8);
    return base58_encode(hex_to_bytes(cpa));
}

// Generates Monero keys and addresses from secret spend key, supporting both standard and subaddresses via index
function xmr_getpubs(ssk, index) {
    const sskh = bytes_to_hex(ssk),
        svk = bytes_to_hex(sc_reduce32(fasthash(sskh))),
        psk = xmr_get_publickey(sskh),
        pvk = xmr_get_publickey(svk),
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
    const pubp = point_multiply(sc_reduce32(fasthash(5375624164647200 + svk + uint32_hex(0) + uint32_hex(index)))),
        pskp = xmr_getpoint(psk),
        np = pskp.add(pubp),
        sub_psk = np.toHex(),
        sub_pvk = np.multiply(xmr_getpoint(svk).y).toHex();
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

// Computes and returns a Keccak-256 hash of input hexadecimal data
function fasthash(hex) {
    return keccak256(hex_to_bytes(hex));
}

// ** Base58 Encoding: **

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

// ** View Key Management: **

// Retrieves cached view key data for a Monero address from storage
function get_vk(address) {
    const ad_li = filter_addressli("monero", "address", address),
        ad_dat = (ad_li.length) ? ad_li.data() : {},
        ad_vk = ad_dat.vk;
    if (ad_vk && ad_vk != "") {
        return vk_obj(ad_vk);
    }
    return false
}

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

function get_spend_pubkey_from_address(address) {
    try {
        const decoded = cn_base_58.decode(address);
        return decoded.slice(2, 66);
    } catch (e) {
        console.error("Could not extract spend pubkey:", e);
        return null;
    }
}

// ** Payment ID Functions: **

// Generates a 16-byte cryptographically secure random payment ID
function xmr_pid() {
    return mn_random(256).slice(0, 16);
}

// Validates payment ID format: must be 16 hexadecimal characters
function check_pid(payment_id) {
    const payment_id_length = payment_id.length;
    if (payment_id_length !== 16) {
        return false // invalid length
    }
    const pattern = RegExp("^[0-9a-fA-F]{16}$");
    if (pattern.test(payment_id) != true) {
        return false
    }
    return true
}

// Decodes a Monero transaction from hex string into a structured object with inputs, outputs, and signatures
function parse_xmr_tx_hex(tx_hex) {
    const bytes = hex_to_bytes(tx_hex);
    let offset = 0;

    // Reads a variable-length integer (small numbers use fewer bytes, large numbers use more)
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

    // Reads a fixed number of bytes from the current position and advances the offset
    function read_bytes(count) {
        const result = bytes.slice(offset, offset + count);
        offset += count;
        return result;
    }

    const tx = {};
    tx.version = Number(read_varint());
    tx.unlock_time = Number(read_varint());
    // Inputs
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
    // Outputs
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
                    "key": key,
                    "view_tag": view_tag
                }
            };
        }
        tx.vout.push(output);
    }
    // Extra
    const extra_size = Number(read_varint());
    tx.extra = Array.from(read_bytes(extra_size));
    // RCT signatures
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
        if (tag === 0x00) { // Padding
            i++;
            continue;
        }
        if (tag === 0x01) { // TX pubkey
            i += 33;
            continue;
        }
        if (tag === 0x02) { // Nonce (includes payment IDs)
            if (i + 2 >= extra_bytes.length) break;
            const length = extra_bytes[i + 1],
                nonce_type = extra_bytes[i + 2];
            if (nonce_type === 0x01 && length === 0x09) { // Encrypted payment ID
                if (i + 11 > extra_bytes.length) return false;
                const encrypted_pid = extra_bytes.slice(i + 3, i + 11),
                    r_point = xmr_getpoint(tx_pub_key),
                    a_scalar = bytes_to_number_le(hex_to_bytes(view_key)),
                    derivation_point = r_point.multiply(a_scalar).multiply(8n),
                    derivation_bytes = derivation_point.toRawBytes(), // 32 bytes
                    tail_byte = new Uint8Array([0x8d]), // CRITICAL: Append tail byte 0x8d (ENCRYPTED_PAYMENT_ID_TAIL)
                    hash_input = concat_bytes(derivation_bytes, tail_byte), // 33 bytes
                    hash = fasthash(bytes_to_hex(hash_input)),
                    key = hex_to_bytes(hash.slice(0, 16)),
                    decrypted_pid = new Uint8Array(8); // XOR decrypt
                for (let j = 0; j < 8; j++) {
                    decrypted_pid[j] = encrypted_pid[j] ^ key[j];
                }
                const payment_id_hex = bytes_to_hex(decrypted_pid);
                // Return false if payment ID is all zeros
                if (payment_id_hex == 0000000000000000) {
                    return false;
                }
                return {
                    "type": "encrypted",
                    "payment_id": payment_id_hex
                };
            } else if (nonce_type === 0x00 && length === 0x21) { // Unencrypted (deprecated)
                if (i + 35 > extra_bytes.length) return false;
                const unencrypted_pid = extra_bytes.slice(i + 3, i + 35),
                    payment_id_hex = bytes_to_hex(unencrypted_pid);
                // Return false if payment ID is all zeros
                if (payment_id_hex == 00000000000000000000000000000000000000000000000000000000000000) {
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
        if (tag === 0x04) { // Additional pubkeys
            const count = extra_bytes[i + 1];
            i += 2 + (count * 32);
            continue;
        }
        i++;
    }
    return false;
}

// Decrypts the amount for a specific output in a RingCT transaction.
function decode_rct_amount(rct, output_idx, shared_secret_hex) {
    const encrypted_amount_hex = rct?.ecdhInfo?.[output_idx]?.amount;
    if (!encrypted_amount_hex) return null;
    const rct_type = rct.type;
    let scalar;

    // For RCT type 5 (CLSAG) and 6 (Bulletproof+): Include output index
    if (rct_type === 5 || rct_type === 6) {
        const derivation_data = concat_bytes(
            hex_to_bytes(shared_secret_hex),
            encode_varint(output_idx)
        );
        scalar = bytes_to_hex(sc_reduce32(fasthash(bytes_to_hex(derivation_data)))); // ✓ Reduce scalar!
    } else {
        // Old (RCT types 1-4): No output index
        scalar = bytes_to_hex(sc_reduce32(fasthash(shared_secret_hex))); // ✓ Reduce scalar!
    }

    // Hash("amount" || scalar) to get decryption key
    const prefix_bytes = str_to_bin("amount"),
        hash_input = concat_bytes(prefix_bytes, hex_to_bytes(scalar)),
        amount_key = fasthash(bytes_to_hex(hash_input)),
        key_bytes = hex_to_bytes(amount_key.slice(0, 16)),
        encrypted_bytes = hex_to_bytes(encrypted_amount_hex),
        decrypted_bytes = new Uint8Array(8);

    // XOR to decrypt
    for (let i = 0; i < 8; i++) {
        decrypted_bytes[i] = encrypted_bytes[i] ^ key_bytes[i];
    }
    return bytes_to_number_le(decrypted_bytes);
}