const l = 7237005577332262213973186563042994240857116359379907606001950938285454250989n,
    xmr_words = [
        "abbey", "abducts", "ability", "ablaze", "abnormal", "abort", "abrasive", "absorb", "abyss", "academy", "aces", "aching", "acidic", "acoustic", "acquire", "across", "actress", "acumen", "adapt", "addicted", "adept", "adhesive", "adjust", "adopt", "adrenalin", "adult", "adventure", "aerial", "afar", "affair", "afield", "afloat", "afoot", "afraid", "after", "against", "agenda", "aggravate", "agile", "aglow", "agnostic", "agony", "agreed", "ahead", "aided", "ailments", "aimless", "airport", "aisle", "ajar", "akin", "alarms", "album", "alchemy", "alerts", "algebra", "alkaline", "alley", "almost", "aloof", "alpine", "already", "also", "altitude", "alumni", "always", "amaze", "ambush", "amended", "amidst", "ammo", "amnesty", "among", "amply", "amused", "anchor", "android", "anecdote", "angled", "ankle", "annoyed", "answers", "antics", "anvil", "anxiety", "anybody", "apart", "apex", "aphid", "aplomb", "apology", "apply", "apricot", "aptitude", "aquarium", "arbitrary", "archer", "ardent", "arena", "argue", "arises", "army", "around", "arrow", "arsenic", "artistic", "ascend", "ashtray", "aside", "asked", "asleep", "aspire", "assorted", "asylum", "athlete", "atlas", "atom", "atrium", "attire", "auburn", "auctions", "audio", "august", "aunt", "austere", "autumn", "avatar", "avidly", "avoid", "awakened", "awesome", "awful", "awkward", "awning", "awoken", "axes", "axis", "axle", "aztec", "azure", "baby", "bacon", "badge", "baffles", "bagpipe", "bailed", "bakery", "balding", "bamboo", "banjo", "baptism", "basin", "batch", "bawled", "bays", "because", "beer", "befit", "begun", "behind", "being", "below", "bemused", "benches", "berries", "bested", "betting", "bevel", "beware", "beyond", "bias", "bicycle", "bids", "bifocals", "biggest", "bikini", "bimonthly", "binocular", "biology", "biplane", "birth", "biscuit", "bite", "biweekly", "blender", "blip", "bluntly", "boat", "bobsled", "bodies", "bogeys", "boil", "boldly", "bomb", "border", "boss", "both", "bounced", "bovine", "bowling", "boxes", "boyfriend", "broken", "brunt", "bubble", "buckets", "budget", "buffet", "bugs", "building", "bulb", "bumper", "bunch", "business", "butter", "buying", "buzzer", "bygones", "byline", "bypass", "cabin", "cactus", "cadets", "cafe", "cage", "cajun", "cake", "calamity", "camp", "candy", "casket", "catch", "cause", "cavernous", "cease", "cedar", "ceiling", "cell", "cement", "cent", "certain", "chlorine", "chrome", "cider", "cigar", "cinema", "circle", "cistern", "citadel", "civilian", "claim", "click", "clue", "coal", "cobra", "cocoa", "code", "coexist", "coffee", "cogs", "cohesive", "coils", "colony", "comb", "cool", "copy", "corrode", "costume", "cottage", "cousin", "cowl", "criminal", "cube", "cucumber", "cuddled", "cuffs", "cuisine", "cunning", "cupcake", "custom", "cycling", "cylinder", "cynical", "dabbing", "dads", "daft", "dagger", "daily", "damp", "dangerous", "dapper", "darted", "dash", "dating", "dauntless", "dawn", "daytime", "dazed", "debut", "decay", "dedicated", "deepest", "deftly", "degrees", "dehydrate", "deity", "dejected", "delayed", "demonstrate", "dented", "deodorant", "depth", "desk", "devoid", "dewdrop", "dexterity", "dialect", "dice", "diet", "different", "digit", "dilute", "dime", "dinner", "diode", "diplomat", "directed", "distance", "ditch", "divers", "dizzy", "doctor", "dodge", "does", "dogs", "doing", "dolphin", "domestic", "donuts", "doorway", "dormant", "dosage", "dotted", "double", "dove", "down", "dozen", "dreams", "drinks", "drowning", "drunk", "drying", "dual", "dubbed", "duckling", "dude", "duets", "duke", "dullness", "dummy", "dunes", "duplex", "duration", "dusted", "duties", "dwarf", "dwelt", "dwindling", "dying", "dynamite", "dyslexic", "each", "eagle", "earth", "easy", "eating", "eavesdrop", "eccentric", "echo", "eclipse", "economics", "ecstatic", "eden", "edgy", "edited", "educated", "eels", "efficient", "eggs", "egotistic", "eight", "either", "eject", "elapse", "elbow", "eldest", "eleven", "elite", "elope", "else", "eluded", "emails", "ember", "emerge", "emit", "emotion", "empty", "emulate", "energy", "enforce", "enhanced", "enigma", "enjoy", "enlist", "enmity", "enough", "enraged", "ensign", "entrance", "envy", "epoxy", "equip", "erase", "erected", "erosion", "error", "eskimos", "espionage", "essential", "estate", "etched", "eternal", "ethics", "etiquette", "evaluate", "evenings", "evicted", "evolved", "examine", "excess", "exhale", "exit", "exotic", "exquisite", "extra", "exult", "fabrics", "factual", "fading", "fainted", "faked", "fall", "family", "fancy", "farming", "fatal", "faulty", "fawns", "faxed", "fazed", "feast", "february", "federal", "feel", "feline", "females", "fences", "ferry", "festival", "fetches", "fever", "fewest", "fiat", "fibula", "fictional", "fidget", "fierce", "fifteen", "fight", "films", "firm", "fishing", "fitting", "five", "fixate", "fizzle", "fleet", "flippant", "flying", "foamy", "focus", "foes", "foggy", "foiled", "folding", "fonts", "foolish", "fossil", "fountain", "fowls", "foxes", "foyer", "framed", "friendly", "frown", "fruit", "frying", "fudge", "fuel", "fugitive", "fully", "fuming", "fungal", "furnished", "fuselage", "future", "fuzzy", "gables", "gadget", "gags", "gained", "galaxy", "gambit", "gang", "gasp", "gather", "gauze", "gave", "gawk", "gaze", "gearbox", "gecko", "geek", "gels", "gemstone", "general", "geometry", "germs", "gesture", "getting", "geyser", "ghetto", "ghost", "giant", "giddy", "gifts", "gigantic", "gills", "gimmick", "ginger", "girth", "giving", "glass", "gleeful", "glide", "gnaw", "gnome", "goat", "goblet", "godfather", "goes", "goggles", "going", "goldfish", "gone", "goodbye", "gopher", "gorilla", "gossip", "gotten", "gourmet", "governing", "gown", "greater", "grunt", "guarded", "guest", "guide", "gulp", "gumball", "guru", "gusts", "gutter", "guys", "gymnast", "gypsy", "gyrate", "habitat", "hacksaw", "haggled", "hairy", "hamburger", "happens", "hashing", "hatchet", "haunted", "having", "hawk", "haystack", "hazard", "hectare", "hedgehog", "heels", "hefty", "height", "hemlock", "hence", "heron", "hesitate", "hexagon", "hickory", "hiding", "highway", "hijack", "hiker", "hills", "himself", "hinder", "hippo", "hire", "history", "hitched", "hive", "hoax", "hobby", "hockey", "hoisting", "hold", "honked", "hookup", "hope", "hornet", "hospital", "hotel", "hounded", "hover", "howls", "hubcaps", "huddle", "huge", "hull", "humid", "hunter", "hurried", "husband", "huts", "hybrid", "hydrogen", "hyper", "iceberg", "icing", "icon", "identity", "idiom", "idled", "idols", "igloo", "ignore", "iguana", "illness", "imagine", "imbalance", "imitate", "impel", "inactive", "inbound", "incur", "industrial", "inexact", "inflamed", "ingested", "initiate", "injury", "inkling", "inline", "inmate", "innocent", "inorganic", "input", "inquest", "inroads", "insult", "intended", "inundate", "invoke", "inwardly", "ionic", "irate", "iris", "irony", "irritate", "island", "isolated", "issued", "italics", "itches", "items", "itinerary", "itself", "ivory", "jabbed", "jackets", "jaded", "jagged", "jailed", "jamming", "january", "jargon", "jaunt", "javelin", "jaws", "jazz", "jeans", "jeers", "jellyfish", "jeopardy", "jerseys", "jester", "jetting", "jewels", "jigsaw", "jingle", "jittery", "jive", "jobs", "jockey", "jogger", "joining", "joking", "jolted", "jostle", "journal", "joyous", "jubilee", "judge", "juggled", "juicy", "jukebox", "july", "jump", "junk", "jury", "justice", "juvenile", "kangaroo", "karate", "keep", "kennel", "kept", "kernels", "kettle", "keyboard", "kickoff", "kidneys", "king", "kiosk", "kisses", "kitchens", "kiwi", "knapsack", "knee", "knife", "knowledge", "knuckle", "koala", "laboratory", "ladder", "lagoon", "lair", "lakes", "lamb", "language", "laptop", "large", "last", "later", "launching", "lava", "lawsuit", "layout", "lazy", "lectures", "ledge", "leech", "left", "legion", "leisure", "lemon", "lending", "leopard", "lesson", "lettuce", "lexicon", "liar", "library", "licks", "lids", "lied", "lifestyle", "light", "likewise", "lilac", "limits", "linen", "lion", "lipstick", "liquid", "listen", "lively", "loaded", "lobster", "locker", "lodge", "lofty", "logic", "loincloth", "long", "looking", "lopped", "lordship", "losing", "lottery", "loudly", "love", "lower", "loyal", "lucky", "luggage", "lukewarm", "lullaby", "lumber", "lunar", "lurk", "lush", "luxury", "lymph", "lynx", "lyrics", "macro", "madness", "magically", "mailed", "major", "makeup", "malady", "mammal", "maps", "masterful", "match", "maul", "maverick", "maximum", "mayor", "maze", "meant", "mechanic", "medicate", "meeting", "megabyte", "melting", "memoir", "menu", "merger", "mesh", "metro", "mews", "mice", "midst", "mighty", "mime", "mirror", "misery", "mittens", "mixture", "moat", "mobile", "mocked", "mohawk", "moisture", "molten", "moment", "money", "moon", "mops", "morsel", "mostly", "motherly", "mouth", "movement", "mowing", "much", "muddy", "muffin", "mugged", "mullet", "mumble", "mundane", "muppet", "mural", "musical", "muzzle", "myriad", "mystery", "myth", "nabbing", "nagged", "nail", "names", "nanny", "napkin", "narrate", "nasty", "natural", "nautical", "navy", "nearby", "necklace", "needed", "negative", "neither", "neon", "nephew", "nerves", "nestle", "network", "neutral", "never", "newt", "nexus", "nibs", "niche", "niece", "nifty", "nightly", "nimbly", "nineteen", "nirvana", "nitrogen", "nobody", "nocturnal", "nodes", "noises", "nomad", "noodles", "northern", "nostril", "noted", "nouns", "novelty", "nowhere", "nozzle", "nuance", "nucleus", "nudged", "nugget", "nuisance", "null", "number", "nuns", "nurse", "nutshell", "nylon", "oaks", "oars", "oasis", "oatmeal", "obedient", "object", "obliged", "obnoxious", "observant", "obtains", "obvious", "occur", "ocean", "october", "odds", "odometer", "offend", "often", "oilfield", "ointment", "okay", "older", "olive", "olympics", "omega", "omission", "omnibus", "onboard", "oncoming", "oneself", "ongoing", "onion", "online", "onslaught", "onto", "onward", "oozed", "opacity", "opened", "opposite", "optical", "opus", "orange", "orbit", "orchid", "orders", "organs", "origin", "ornament", "orphans", "oscar", "ostrich", "otherwise", "otter", "ouch", "ought", "ounce", "ourselves", "oust", "outbreak", "oval", "oven", "owed", "owls", "owner", "oxidant", "oxygen", "oyster", "ozone", "pact", "paddles", "pager", "pairing", "palace", "pamphlet", "pancakes", "paper", "paradise", "pastry", "patio", "pause", "pavements", "pawnshop", "payment", "peaches", "pebbles", "peculiar", "pedantic", "peeled", "pegs", "pelican", "pencil", "people", "pepper", "perfect", "pests", "petals", "phase", "pheasants", "phone", "phrases", "physics", "piano", "picked", "pierce", "pigment", "piloted", "pimple", "pinched", "pioneer", "pipeline", "pirate", "pistons", "pitched", "pivot", "pixels", "pizza", "playful", "pledge", "pliers", "plotting", "plus", "plywood", "poaching", "pockets", "podcast", "poetry", "point", "poker", "polar", "ponies", "pool", "popular", "portents", "possible", "potato", "pouch", "poverty", "powder", "pram", "present", "pride", "problems", "pruned", "prying", "psychic", "public", "puck", "puddle", "puffin", "pulp", "pumpkins", "punch", "puppy", "purged", "push", "putty", "puzzled", "pylons", "pyramid", "python", "queen", "quick", "quote", "rabbits", "racetrack", "radar", "rafts", "rage", "railway", "raking", "rally", "ramped", "randomly", "rapid", "rarest", "rash", "rated", "ravine", "rays", "razor", "react", "rebel", "recipe", "reduce", "reef", "refer", "regular", "reheat", "reinvest", "rejoices", "rekindle", "relic", "remedy", "renting", "reorder", "repent", "request", "reruns", "rest", "return", "reunion", "revamp", "rewind", "rhino", "rhythm", "ribbon", "richly", "ridges", "rift", "rigid", "rims", "ringing", "riots", "ripped", "rising", "ritual", "river", "roared", "robot", "rockets", "rodent", "rogue", "roles", "romance", "roomy", "roped", "roster", "rotate", "rounded", "rover", "rowboat", "royal", "ruby", "rudely", "ruffled", "rugged", "ruined", "ruling", "rumble", "runway", "rural", "rustled", "ruthless", "sabotage", "sack", "sadness", "safety", "saga", "sailor", "sake", "salads", "sample", "sanity", "sapling", "sarcasm", "sash", "satin", "saucepan", "saved", "sawmill", "saxophone", "sayings", "scamper", "scenic", "school", "science", "scoop", "scrub", "scuba", "seasons", "second", "sedan", "seeded", "segments", "seismic", "selfish", "semifinal", "sensible", "september", "sequence", "serving", "session", "setup", "seventh", "sewage", "shackles", "shelter", "shipped", "shocking", "shrugged", "shuffled", "shyness", "siblings", "sickness", "sidekick", "sieve", "sifting", "sighting", "silk", "simplest", "sincerely", "sipped", "siren", "situated", "sixteen", "sizes", "skater", "skew", "skirting", "skulls", "skydive", "slackens", "sleepless", "slid", "slower", "slug", "smash", "smelting", "smidgen", "smog", "smuggled", "snake", "sneeze", "sniff", "snout", "snug", "soapy", "sober", "soccer", "soda", "software", "soggy", "soil", "solved", "somewhere", "sonic", "soothe", "soprano", "sorry", "southern", "sovereign", "sowed", "soya", "space", "speedy", "sphere", "spiders", "splendid", "spout", "sprig", "spud", "spying", "square", "stacking", "stellar", "stick", "stockpile", "strained", "stunning", "stylishly", "subtly", "succeed", "suddenly", "suede", "suffice", "sugar", "suitcase", "sulking", "summon", "sunken", "superior", "surfer", "sushi", "suture", "swagger", "swept", "swiftly", "sword", "swung", "syllabus", "symptoms", "syndrome", "syringe", "system", "taboo", "tacit", "tadpoles", "tagged", "tail", "taken", "talent", "tamper", "tanks", "tapestry", "tarnished", "tasked", "tattoo", "taunts", "tavern", "tawny", "taxi", "teardrop", "technical", "tedious", "teeming", "tell", "template", "tender", "tepid", "tequila", "terminal", "testing", "tether", "textbook", "thaw", "theatrics", "thirsty", "thorn", "threaten", "thumbs", "thwart", "ticket", "tidy", "tiers", "tiger", "tilt", "timber", "tinted", "tipsy", "tirade", "tissue", "titans", "toaster", "tobacco", "today", "toenail", "toffee", "together", "toilet", "token", "tolerant", "tomorrow", "tonic", "toolbox", "topic", "torch", "tossed", "total", "touchy", "towel", "toxic", "toyed", "trash", "trendy", "tribal", "trolling", "truth", "trying", "tsunami", "tubes", "tucks", "tudor", "tuesday", "tufts", "tugs", "tuition", "tulips", "tumbling", "tunnel", "turnip", "tusks", "tutor", "tuxedo", "twang", "tweezers", "twice", "twofold", "tycoon", "typist", "tyrant", "ugly", "ulcers", "ultimate", "umbrella", "umpire", "unafraid", "unbending", "uncle", "under", "uneven", "unfit", "ungainly", "unhappy", "union", "unjustly", "unknown", "unlikely", "unmask", "unnoticed", "unopened", "unplugs", "unquoted", "unrest", "unsafe", "until", "unusual", "unveil", "unwind", "unzip", "upbeat", "upcoming", "update", "upgrade", "uphill", "upkeep", "upload", "upon", "upper", "upright", "upstairs", "uptight", "upwards", "urban", "urchins", "urgent", "usage", "useful", "usher", "using", "usual", "utensils", "utility", "utmost", "utopia", "uttered", "vacation", "vague", "vain", "value", "vampire", "vane", "vapidly", "vary", "vastness", "vats", "vaults", "vector", "veered", "vegan", "vehicle", "vein", "velvet", "venomous", "verification", "vessel", "veteran", "vexed", "vials", "vibrate", "victim", "video", "viewpoint", "vigilant", "viking", "village", "vinegar", "violin", "vipers", "virtual", "visited", "vitals", "vivid", "vixen", "vocal", "vogue", "voice", "volcano", "vortex", "voted", "voucher", "vowels", "voyage", "vulture", "wade", "waffle", "wagtail", "waist", "waking", "wallets", "wanted", "warped", "washing", "water", "waveform", "waxing", "wayside", "weavers", "website", "wedge", "weekday", "weird", "welders", "went", "wept", "were", "western", "wetsuit", "whale", "when", "whipped", "whole", "wickets", "width", "wield", "wife", "wiggle", "wildly", "winter", "wipeout", "wiring", "wise", "withdrawn", "wives", "wizard", "wobbly", "woes", "woken", "wolf", "womanly", "wonders", "woozy", "worry", "wounded", "woven", "wrap", "wrist", "wrong", "yacht", "yahoo", "yanks", "yard", "yawning", "yearbook", "yellow", "yesterday", "yeti", "yields", "yodel", "yoga", "younger", "yoyo", "zapped", "zeal", "zebra", "zero", "zesty", "zigzags", "zinger", "zippers", "zodiac", "zombie", "zones", "zoom"
    ],
    cnBase58 = (function() {
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
            UINT64_MAX = 2n ** 64n;

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
                const product = order.multiply(digit).add(res_num);
                if (product.compare(UINT64_MAX) === 1) {
                    throw "Overflow";
                }
                res_num = product;
                order = order.multiply(alphabet_size);
            }
            if (res_size < full_block_size && ((2n ** BigInt(8 * res_size)) <= res_num)) {
                throw "Overflow 2";
            }
            buf.set(uint64_to_8be(res_num, res_size), index);
            return buf;
        };

        // Decodes a complete Base58 encoded string
        b58.decode = function(encode) {
            const enc = strtobin(encode);
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
            let data = uint_8Array(data_size);
            for (let i = 0; i < full_block_count; i++) {
                data = b58.decode_block(enc.subarray(i * full_encoded_block_size, i * full_encoded_block_size + full_encoded_block_size), data, i * full_block_size);
            }
            if (last_block_size > 0) {
                data = b58.decode_block(enc.subarray(full_block_count * full_encoded_block_size, full_block_count * full_encoded_block_size + last_block_size), data, full_block_count * full_block_size);
            }
            return bytesToHex(data);
        };
        return b58;
    })();

// Reduces a 32-byte hexadecimal string modulo the curve order
function sc_reduce32(hex) {
    return hexToBytes(str_pad((BigInt("0x" + bytesToHex(hexToBytes(hex).reverse())) % l).toString(16), 64)).reverse();
}

// Generates a secret spend key (ssk) from a BIP39 mnemonic or seed
function get_ssk(bip39, seed) {
    const p_rootkey = (seed === true) ? get_rootkey(bip39) : get_rootkey(toseed(bip39)),
        dx_dat = {
            "dpath": "m/44'/128'/0'/0/0",
            "key": p_rootkey.slice(0, 64),
            "cc": p_rootkey.slice(64)
        },
        x_keys_dat = derive_x(dx_dat),
        rootkey = x_keys_dat.key;
    return sc_reduce32(fasthash(rootkey));
}

// Generates a Monero address from public spend key (psk) and public view key (pvk)
function pub_keys_to_address(psk, pvk, index) {
    const pref = (index < 1) ? "12" : "2a",
        res_hex = pref + psk + pvk,
        cpa = res_hex + fasthash(res_hex).slice(0, 8);
    return base58_encode(hexToBytes(cpa));
}

// Computes the Keccak-256 hash of a hexadecimal string
function fasthash(hex) {
    return keccak256(hexToBytes(hex));
}

// Generates public keys and addresses for a given secret spend key (ssk) and index
function xmr_getpubs(ssk, index) {
    const sskh = bytesToHex(ssk),
        svk = bytesToHex(sc_reduce32(fasthash(sskh))),
        psk = xmr_getPublicKey(sskh),
        pvk = xmr_getPublicKey(svk),
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
    const pubp = point_multiply(sc_reduce32(fasthash(5375624164647200 + svk + uint32hex(0) + uint32hex(index)))),
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

// Generates a CRC (Cyclic Redundancy Check) table
function makeCRCTable() {
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

// Computes the CRC-32 checksum of a string
function crc_32(str) {
    let crcTable = window.crcTable || (window.crcTable = makeCRCTable()),
        crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// Converts a secret spend key to a mnemonic phrase
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

// helpers

// Converts a 32-bit unsigned integer to a hexadecimal string
function uint32hex(value) {
    let h = value.toString(16);
    if (h.length > 8) throw "value must not equal or exceed 2^32";
    while (h.length < 8) h = "0" + h;
    return h.match(/../g).reverse().join("");
}

// Converts a string to a Uint8Array
function strtobin(str) {
    const res = uint_8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        res[i] = str.charCodeAt(i);
    }
    return res;
}

// Converts a 64-bit unsigned integer to a big-endian Uint8Array
function uint64_to_8be(num, size) {
    const res = uint_8Array(size);
    if (size < 1 || size > 8) {
        throw "Invalid input length";
    }
    const twopow8 = 2n ** 8n;
    for (let i = size - 1; i >= 0; i--) {
        res[i] = num.remainder(twopow8).toJSValue();
        num = num.divide(twopow8);
    }
    return res;
}

// Encodes data using Base58 encoding
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

// Code based on / credits: https://github.com/paulmillr/noble-ed25519

const xmr_CURVE = {
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
    xmr_I = xpowMod(2n, (xmr_CURVE.P + 1n) / 4n, xmr_CURVE.P),
    xmr_pointPrecomputes = new WeakMap();

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
            throw new TypeError('ExtendedPoint#fromAffine: expected Point');
        }
        if (p.equals(xPoint.ZERO))
            return ExtendedPoint.ZERO;
        return new ExtendedPoint(p.x, p.y, 1n, xmod(p.x * p.y));
    }

    // Converts a batch of extended points to affine points
    static toAffineBatch(points) {
        const toInv = xmr_invertBatch(points.map((p) => p.z));
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
            throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
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
        if (typeof scalar !== 'number' && typeof scalar !== 'bigint') {
            throw new TypeError('Point#multiply: expected number or bigint');
        }
        const n = xmod(BigInt(scalar), xmr_CURVE.n);
        if (n <= 0) {
            throw new Error('Point#multiply: invalid scalar, expected positive integer');
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
        bytes = hash instanceof Uint8Array ? hash : hexToBytes(hash),
            len = bytes.length - 1,
            normedLast = bytes[len] & ~0x80,
            isLastByteOdd = (bytes[len] & 0x80) !== 0,
            normed = Uint8Array.from(Array.from(bytes.slice(0, len)).concat(normedLast)),
            y = bytesToNumberLE(normed);
        if (y >= P) {
            throw new Error('Point#fromHex expects hex <= Fp');
        }
        const sqrY = y * y,
            sqrX = xmod((sqrY - 1n) * xmr_invert(d * sqrY + 1n));
        let x = xpowMod(sqrX, DIV_8_MINUS_3);
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
        const hex = xmr_numberToHex(this.y),
            u8 = uint_8Array(ENCODING_LENGTH);
        for (let i = hex.length - 2, j = 0; j < ENCODING_LENGTH && i >= 0; i -= 2, j++) {
            u8[j] = parseInt(hex[i] + hex[i + 1], 16);
        }
        const mask = this.x & 1n ? 0x80 : 0;
        u8[ENCODING_LENGTH - 1] |= mask;
        return u8;
    }

    // Converts the point to a hexadecimal string
    toHex() {
        return bytesToHex(this.toRawBytes());
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

// Converts a number to a hexadecimal string
function xmr_numberToHex(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}

// Converts a little-endian byte array to a BigInt
function bytesToNumberLE(uint8a) {
    let value = 0n;
    for (let i = 0; i < uint8a.length; i++) {
        value += BigInt(uint8a[i]) << (8n * BigInt(i));
    }
    return value;
}

// Performs modular arithmetic (a mod b)
function xmod(a, b = xmr_CURVE.P) {
    const res = a % b;
    return res >= 0n ? res : b + res;
}

// Performs modular exponentiation (a^power mod m)
function xpowMod(a, power, m = xmr_CURVE.P) {
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

// Performs the Extended Euclidean Algorithm
function xmr_egcd(a, b) {
    let [x, y, u, v] = [0n, 1n, 1n, 0n];
    while (a !== 0n) {
        let q = b / a,
            r = b % a,
            m = x - u * q,
            n = y - v * q;
        [b, a] = [a, r];
        [x, y] = [u, v];
        [u, v] = [m, n];
    }
    let gcd = b;
    return [gcd, x, y];
}

// Calculates the modular multiplicative inverse
function xmr_invert(number, modulo = xmr_CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error('invert: expected positive integers');
    }
    let [gcd, x] = xmr_egcd(xmod(number, modulo), modulo);
    if (gcd !== 1n) {
        throw new Error('invert: does not exist');
    }
    return xmod(x, modulo);
}

// Calculates the modular multiplicative inverse for a batch of numbers
function xmr_invertBatch(nums, n = xmr_CURVE.P) {
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

// Converts a hexadecimal string to an xPoint object
function xmr_getpoint(hex) {
    return xPoint.fromHex(hex);
}

// Multiplies a point by the base point of the curve
function point_multiply(hex) {
    return xPoint.BASE.multiply(xmr_getpoint(hex).y);
}

// Generates a public key from a private key
function xmr_getPublicKey(privateKey) {
    return point_multiply(privateKey).toHex();
}

// Generates a random payment ID
function xmr_pid() {
    return mn_random(256).slice(0, 16);
}

// Validates a payment ID
function check_pid(payment_id) {
    const payment_id_length = payment_id.length;
    if (payment_id_length !== 16) {
        return false // invalid length
    }
    const pattern = RegExp("^[0-9a-fA-F]{16}$");
    if (pattern.test(payment_id) != true) {
        return false;
    }
    return true;
}

// Generates a random number with the specified number of bits
function mn_random(bits) {
    "use strict";
    if (bits % 32 !== 0) throw "Something weird went wrong: Invalid number of bits - " + bits;
    let array = new Uint32Array(bits / 32);
    if (!crypto) throw "Unfortunately MyMonero only runs on browsers that support the JavaScript Crypto API";
    let i = 0;

    function arr_is_zero() {
        for (let j = 0; j < bits / 32; ++j) {
            if (array[j] !== 0) return false;
        }
        return true;
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

// Retrieves the view key for a given Monero address
function get_vk(address) {
    const ad_li = filter_addressli("monero", "address", address),
        ad_dat = (ad_li.length) ? ad_li.data() : {},
        ad_vk = ad_dat.vk;
    if (ad_vk && ad_vk != "") {
        return vk_obj(ad_vk);
    }
    return false;
}

// Creates an object containing account and view key information
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
    return false;
}

// Checks if the user has opted to share their view key
function share_vk() {
    const vkshare = cs_node("monero", "Share viewkey", true).selected;
    if (vkshare === true) {
        return true;
    }
    return false;
}

/**
 * [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 0.8.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2018
 * @license MIT
 */
! function() {
    "use strict";

    function t(t, e, r) {
        this.blocks = [], this.s = [], this.padding = e, this.outputBits = r, this.reset = !0, this.finalized = !1, this.block = 0, this.start = 0, this.blockCount = 1600 - (t << 1) >> 5, this.byteCount = this.blockCount << 2, this.outputBlocks = r >> 5, this.extraBytes = (31 & r) >> 3;
        for (var n = 0; n < 50; ++n) this.s[n] = 0
    }

    function e(e, r, n) {
        t.call(this, e, r, n)
    }
    var r = "input is invalid type",
        n = "object" == typeof window,
        i = n ? window : {};
    i.JS_SHA3_NO_WINDOW && (n = !1);
    var o = !n && "object" == typeof self;
    !i.JS_SHA3_NO_NODE_JS && "object" == typeof process && process.versions && process.versions.node ? i = global : o && (i = self);
    var a = !i.JS_SHA3_NO_COMMON_JS && "object" == typeof module && module.exports,
        s = "function" == typeof define && define.amd,
        u = !i.JS_SHA3_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer,
        f = "0123456789abcdef".split(""),
        c = [4, 1024, 262144, 67108864],
        h = [0, 8, 16, 24],
        p = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648, 2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648],
        d = [224, 256, 384, 512],
        l = [128, 256],
        y = ["hex", "buffer", "arrayBuffer", "array", "digest"],
        b = {
            128: 168,
            256: 136
        };
    !i.JS_SHA3_NO_NODE_JS && Array.isArray || (Array.isArray = function(t) {
        return "[object Array]" === Object.prototype.toString.call(t)
    }), !u || !i.JS_SHA3_NO_ARRAY_BUFFER_IS_VIEW && ArrayBuffer.isView || (ArrayBuffer.isView = function(t) {
        return "object" == typeof t && t.buffer && t.buffer.constructor === ArrayBuffer
    });
    for (var A = function(e, r, n) {
            return function(i) {
                return new t(e, r, e).update(i)[n]()
            }
        }, w = function(e, r, n) {
            return function(i, o) {
                return new t(e, r, o).update(i)[n]()
            }
        }, v = function(t, e, r) {
            return function(e, n, i, o) {
                return S["cshake" + t].update(e, n, i, o)[r]()
            }
        }, B = function(t, e, r) {
            return function(e, n, i, o) {
                return S["kmac" + t].update(e, n, i, o)[r]()
            }
        }, g = function(t, e, r, n) {
            for (var i = 0; i < y.length; ++i) {
                var o = y[i];
                t[o] = e(r, n, o)
            }
            return t
        }, _ = function(e, r) {
            var n = A(e, r, "hex");
            return n.create = function() {
                return new t(e, r, e)
            }, n.update = function(t) {
                return n.create().update(t)
            }, g(n, A, e, r)
        }, k = [{
            name: "keccak",
            padding: [1, 256, 65536, 16777216],
            bits: d,
            createMethod: _
        }, {
            name: "sha3",
            padding: [6, 1536, 393216, 100663296],
            bits: d,
            createMethod: _
        }, {
            name: "shake",
            padding: [31, 7936, 2031616, 520093696],
            bits: l,
            createMethod: function(e, r) {
                var n = w(e, r, "hex");
                return n.create = function(n) {
                    return new t(e, r, n)
                }, n.update = function(t, e) {
                    return n.create(e).update(t)
                }, g(n, w, e, r)
            }
        }, {
            name: "cshake",
            padding: c,
            bits: l,
            createMethod: function(e, r) {
                var n = b[e],
                    i = v(e, 0, "hex");
                return i.create = function(i, o, a) {
                    return o || a ? new t(e, r, i).bytepad([o, a], n) : S["shake" + e].create(i)
                }, i.update = function(t, e, r, n) {
                    return i.create(e, r, n).update(t)
                }, g(i, v, e, r)
            }
        }, {
            name: "kmac",
            padding: c,
            bits: l,
            createMethod: function(t, r) {
                var n = b[t],
                    i = B(t, 0, "hex");
                return i.create = function(i, o, a) {
                    return new e(t, r, o).bytepad(["KMAC", a], n).bytepad([i], n)
                }, i.update = function(t, e, r, n) {
                    return i.create(t, r, n).update(e)
                }, g(i, B, t, r)
            }
        }], S = {}, C = [], x = 0; x < k.length; ++x)
        for (var m = k[x], E = m.bits, O = 0; O < E.length; ++O) {
            var z = m.name + "_" + E[O];
            if (C.push(z), S[z] = m.createMethod(E[O], m.padding), "sha3" !== m.name) {
                var N = m.name + E[O];
                C.push(N), S[N] = S[z]
            }
        }
    t.prototype.update = function(t) {
        if (this.finalized) throw new Error("finalize already called");
        var e, n = typeof t;
        if ("string" !== n) {
            if ("object" !== n) throw new Error(r);
            if (null === t) throw new Error(r);
            if (u && t.constructor === ArrayBuffer) t = new Uint8Array(t);
            else if (!(Array.isArray(t) || u && ArrayBuffer.isView(t))) throw new Error(r);
            e = !0
        }
        for (var i, o, a = this.blocks, s = this.byteCount, f = t.length, c = this.blockCount, p = 0, d = this.s; p < f;) {
            if (this.reset)
                for (this.reset = !1, a[0] = this.block, i = 1; i < c + 1; ++i) a[i] = 0;
            if (e)
                for (i = this.start; p < f && i < s; ++p) a[i >> 2] |= t[p] << h[3 & i++];
            else
                for (i = this.start; p < f && i < s; ++p)(o = t.charCodeAt(p)) < 128 ? a[i >> 2] |= o << h[3 & i++] : o < 2048 ? (a[i >> 2] |= (192 | o >> 6) << h[3 & i++], a[i >> 2] |= (128 | 63 & o) << h[3 & i++]) : o < 55296 || o >= 57344 ? (a[i >> 2] |= (224 | o >> 12) << h[3 & i++], a[i >> 2] |= (128 | o >> 6 & 63) << h[3 & i++], a[i >> 2] |= (128 | 63 & o) << h[3 & i++]) : (o = 65536 + ((1023 & o) << 10 | 1023 & t.charCodeAt(++p)), a[i >> 2] |= (240 | o >> 18) << h[3 & i++], a[i >> 2] |= (128 | o >> 12 & 63) << h[3 & i++], a[i >> 2] |= (128 | o >> 6 & 63) << h[3 & i++], a[i >> 2] |= (128 | 63 & o) << h[3 & i++]);
            if (this.lastByteIndex = i, i >= s) {
                for (this.start = i - s, this.block = a[c], i = 0; i < c; ++i) d[i] ^= a[i];
                j(d), this.reset = !0
            } else this.start = i
        }
        return this
    }, t.prototype.encode = function(t, e) {
        var r = 255 & t,
            n = 1,
            i = [r];
        for (r = 255 & (t >>= 8); r > 0;) i.unshift(r), r = 255 & (t >>= 8), ++n;
        return e ? i.push(n) : i.unshift(n), this.update(i), i.length
    }, t.prototype.encodeString = function(t) {
        var e, n = typeof t;
        if ("string" !== n) {
            if ("object" !== n) throw new Error(r);
            if (null === t) throw new Error(r);
            if (u && t.constructor === ArrayBuffer) t = new Uint8Array(t);
            else if (!(Array.isArray(t) || u && ArrayBuffer.isView(t))) throw new Error(r);
            e = !0
        }
        var i = 0,
            o = t.length;
        if (e) i = o;
        else
            for (var a = 0; a < t.length; ++a) {
                var s = t.charCodeAt(a);
                s < 128 ? i += 1 : s < 2048 ? i += 2 : s < 55296 || s >= 57344 ? i += 3 : (s = 65536 + ((1023 & s) << 10 | 1023 & t.charCodeAt(++a)), i += 4)
            }
        return i += this.encode(8 * i), this.update(t), i
    }, t.prototype.bytepad = function(t, e) {
        for (var r = this.encode(e), n = 0; n < t.length; ++n) r += this.encodeString(t[n]);
        var i = e - r % e,
            o = [];
        return o.length = i, this.update(o), this
    }, t.prototype.finalize = function() {
        if (!this.finalized) {
            this.finalized = !0;
            var t = this.blocks,
                e = this.lastByteIndex,
                r = this.blockCount,
                n = this.s;
            if (t[e >> 2] |= this.padding[3 & e], this.lastByteIndex === this.byteCount)
                for (t[0] = t[r], e = 1; e < r + 1; ++e) t[e] = 0;
            for (t[r - 1] |= 2147483648, e = 0; e < r; ++e) n[e] ^= t[e];
            j(n)
        }
    }, t.prototype.toString = t.prototype.hex = function() {
        this.finalize();
        for (var t, e = this.blockCount, r = this.s, n = this.outputBlocks, i = this.extraBytes, o = 0, a = 0, s = ""; a < n;) {
            for (o = 0; o < e && a < n; ++o, ++a) t = r[o], s += f[t >> 4 & 15] + f[15 & t] + f[t >> 12 & 15] + f[t >> 8 & 15] + f[t >> 20 & 15] + f[t >> 16 & 15] + f[t >> 28 & 15] + f[t >> 24 & 15];
            a % e == 0 && (j(r), o = 0)
        }
        return i && (t = r[o], s += f[t >> 4 & 15] + f[15 & t], i > 1 && (s += f[t >> 12 & 15] + f[t >> 8 & 15]), i > 2 && (s += f[t >> 20 & 15] + f[t >> 16 & 15])), s
    }, t.prototype.arrayBuffer = function() {
        this.finalize();
        var t, e = this.blockCount,
            r = this.s,
            n = this.outputBlocks,
            i = this.extraBytes,
            o = 0,
            a = 0,
            s = this.outputBits >> 3;
        t = i ? new ArrayBuffer(n + 1 << 2) : new ArrayBuffer(s);
        for (var u = new Uint32Array(t); a < n;) {
            for (o = 0; o < e && a < n; ++o, ++a) u[a] = r[o];
            a % e == 0 && j(r)
        }
        return i && (u[o] = r[o], t = t.slice(0, s)), t
    }, t.prototype.buffer = t.prototype.arrayBuffer, t.prototype.digest = t.prototype.array = function() {
        this.finalize();
        for (var t, e, r = this.blockCount, n = this.s, i = this.outputBlocks, o = this.extraBytes, a = 0, s = 0, u = []; s < i;) {
            for (a = 0; a < r && s < i; ++a, ++s) t = s << 2, e = n[a], u[t] = 255 & e, u[t + 1] = e >> 8 & 255, u[t + 2] = e >> 16 & 255, u[t + 3] = e >> 24 & 255;
            s % r == 0 && j(n)
        }
        return o && (t = s << 2, e = n[a], u[t] = 255 & e, o > 1 && (u[t + 1] = e >> 8 & 255), o > 2 && (u[t + 2] = e >> 16 & 255)), u
    }, (e.prototype = new t).finalize = function() {
        return this.encode(this.outputBits, !0), t.prototype.finalize.call(this)
    };
    var j = function(t) {
        var e, r, n, i, o, a, s, u, f, c, h, d, l, y, b, A, w, v, B, g, _, k, S, C, x, m, E, O, z, N, j, J, M, H, I, R, U, V, F, D, W, Y, K, q, G, L, P, Q, T, X, Z, $, tt, et, rt, nt, it, ot, at, st, ut, ft, ct;
        for (n = 0; n < 48; n += 2) i = t[0] ^ t[10] ^ t[20] ^ t[30] ^ t[40], o = t[1] ^ t[11] ^ t[21] ^ t[31] ^ t[41], a = t[2] ^ t[12] ^ t[22] ^ t[32] ^ t[42], s = t[3] ^ t[13] ^ t[23] ^ t[33] ^ t[43], u = t[4] ^ t[14] ^ t[24] ^ t[34] ^ t[44], f = t[5] ^ t[15] ^ t[25] ^ t[35] ^ t[45], c = t[6] ^ t[16] ^ t[26] ^ t[36] ^ t[46], h = t[7] ^ t[17] ^ t[27] ^ t[37] ^ t[47], e = (d = t[8] ^ t[18] ^ t[28] ^ t[38] ^ t[48]) ^ (a << 1 | s >>> 31), r = (l = t[9] ^ t[19] ^ t[29] ^ t[39] ^ t[49]) ^ (s << 1 | a >>> 31), t[0] ^= e, t[1] ^= r, t[10] ^= e, t[11] ^= r, t[20] ^= e, t[21] ^= r, t[30] ^= e, t[31] ^= r, t[40] ^= e, t[41] ^= r, e = i ^ (u << 1 | f >>> 31), r = o ^ (f << 1 | u >>> 31), t[2] ^= e, t[3] ^= r, t[12] ^= e, t[13] ^= r, t[22] ^= e, t[23] ^= r, t[32] ^= e, t[33] ^= r, t[42] ^= e, t[43] ^= r, e = a ^ (c << 1 | h >>> 31), r = s ^ (h << 1 | c >>> 31), t[4] ^= e, t[5] ^= r, t[14] ^= e, t[15] ^= r, t[24] ^= e, t[25] ^= r, t[34] ^= e, t[35] ^= r, t[44] ^= e, t[45] ^= r, e = u ^ (d << 1 | l >>> 31), r = f ^ (l << 1 | d >>> 31), t[6] ^= e, t[7] ^= r, t[16] ^= e, t[17] ^= r, t[26] ^= e, t[27] ^= r, t[36] ^= e, t[37] ^= r, t[46] ^= e, t[47] ^= r, e = c ^ (i << 1 | o >>> 31), r = h ^ (o << 1 | i >>> 31), t[8] ^= e, t[9] ^= r, t[18] ^= e, t[19] ^= r, t[28] ^= e, t[29] ^= r, t[38] ^= e, t[39] ^= r, t[48] ^= e, t[49] ^= r, y = t[0], b = t[1], L = t[11] << 4 | t[10] >>> 28, P = t[10] << 4 | t[11] >>> 28, O = t[20] << 3 | t[21] >>> 29, z = t[21] << 3 | t[20] >>> 29, st = t[31] << 9 | t[30] >>> 23, ut = t[30] << 9 | t[31] >>> 23, Y = t[40] << 18 | t[41] >>> 14, K = t[41] << 18 | t[40] >>> 14, H = t[2] << 1 | t[3] >>> 31, I = t[3] << 1 | t[2] >>> 31, A = t[13] << 12 | t[12] >>> 20, w = t[12] << 12 | t[13] >>> 20, Q = t[22] << 10 | t[23] >>> 22, T = t[23] << 10 | t[22] >>> 22, N = t[33] << 13 | t[32] >>> 19, j = t[32] << 13 | t[33] >>> 19, ft = t[42] << 2 | t[43] >>> 30, ct = t[43] << 2 | t[42] >>> 30, et = t[5] << 30 | t[4] >>> 2, rt = t[4] << 30 | t[5] >>> 2, R = t[14] << 6 | t[15] >>> 26, U = t[15] << 6 | t[14] >>> 26, v = t[25] << 11 | t[24] >>> 21, B = t[24] << 11 | t[25] >>> 21, X = t[34] << 15 | t[35] >>> 17, Z = t[35] << 15 | t[34] >>> 17, J = t[45] << 29 | t[44] >>> 3, M = t[44] << 29 | t[45] >>> 3, C = t[6] << 28 | t[7] >>> 4, x = t[7] << 28 | t[6] >>> 4, nt = t[17] << 23 | t[16] >>> 9, it = t[16] << 23 | t[17] >>> 9, V = t[26] << 25 | t[27] >>> 7, F = t[27] << 25 | t[26] >>> 7, g = t[36] << 21 | t[37] >>> 11, _ = t[37] << 21 | t[36] >>> 11, $ = t[47] << 24 | t[46] >>> 8, tt = t[46] << 24 | t[47] >>> 8, q = t[8] << 27 | t[9] >>> 5, G = t[9] << 27 | t[8] >>> 5, m = t[18] << 20 | t[19] >>> 12, E = t[19] << 20 | t[18] >>> 12, ot = t[29] << 7 | t[28] >>> 25, at = t[28] << 7 | t[29] >>> 25, D = t[38] << 8 | t[39] >>> 24, W = t[39] << 8 | t[38] >>> 24, k = t[48] << 14 | t[49] >>> 18, S = t[49] << 14 | t[48] >>> 18, t[0] = y ^ ~A & v, t[1] = b ^ ~w & B, t[10] = C ^ ~m & O, t[11] = x ^ ~E & z, t[20] = H ^ ~R & V, t[21] = I ^ ~U & F, t[30] = q ^ ~L & Q, t[31] = G ^ ~P & T, t[40] = et ^ ~nt & ot, t[41] = rt ^ ~it & at, t[2] = A ^ ~v & g, t[3] = w ^ ~B & _, t[12] = m ^ ~O & N, t[13] = E ^ ~z & j, t[22] = R ^ ~V & D, t[23] = U ^ ~F & W, t[32] = L ^ ~Q & X, t[33] = P ^ ~T & Z, t[42] = nt ^ ~ot & st, t[43] = it ^ ~at & ut, t[4] = v ^ ~g & k, t[5] = B ^ ~_ & S, t[14] = O ^ ~N & J, t[15] = z ^ ~j & M, t[24] = V ^ ~D & Y, t[25] = F ^ ~W & K, t[34] = Q ^ ~X & $, t[35] = T ^ ~Z & tt, t[44] = ot ^ ~st & ft, t[45] = at ^ ~ut & ct, t[6] = g ^ ~k & y, t[7] = _ ^ ~S & b, t[16] = N ^ ~J & C, t[17] = j ^ ~M & x, t[26] = D ^ ~Y & H, t[27] = W ^ ~K & I, t[36] = X ^ ~$ & q, t[37] = Z ^ ~tt & G, t[46] = st ^ ~ft & et, t[47] = ut ^ ~ct & rt, t[8] = k ^ ~y & A, t[9] = S ^ ~b & w, t[18] = J ^ ~C & m, t[19] = M ^ ~x & E, t[28] = Y ^ ~H & R, t[29] = K ^ ~I & U, t[38] = $ ^ ~q & L, t[39] = tt ^ ~G & P, t[48] = ft ^ ~et & nt, t[49] = ct ^ ~rt & it, t[0] ^= p[n], t[1] ^= p[n + 1]
    };
    if (a) module.exports = S;
    else {
        for (x = 0; x < C.length; ++x) i[C[x]] = S[C[x]];
        s && define(function() {
            return S
        })
    }
}();