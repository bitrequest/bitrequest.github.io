var l = 7237005577332262213973186563042994240857116359379907606001950938285454250989n,
    xmr_words = [
        "abbey", "abducts", "ability", "ablaze", "abnormal", "abort", "abrasive", "absorb", "abyss", "academy", "aces", "aching", "acidic", "acoustic", "acquire", "across", "actress", "acumen", "adapt", "addicted", "adept", "adhesive", "adjust", "adopt", "adrenalin", "adult", "adventure", "aerial", "afar", "affair", "afield", "afloat", "afoot", "afraid", "after", "against", "agenda", "aggravate", "agile", "aglow", "agnostic", "agony", "agreed", "ahead", "aided", "ailments", "aimless", "airport", "aisle", "ajar", "akin", "alarms", "album", "alchemy", "alerts", "algebra", "alkaline", "alley", "almost", "aloof", "alpine", "already", "also", "altitude", "alumni", "always", "amaze", "ambush", "amended", "amidst", "ammo", "amnesty", "among", "amply", "amused", "anchor", "android", "anecdote", "angled", "ankle", "annoyed", "answers", "antics", "anvil", "anxiety", "anybody", "apart", "apex", "aphid", "aplomb", "apology", "apply", "apricot", "aptitude", "aquarium", "arbitrary", "archer", "ardent", "arena", "argue", "arises", "army", "around", "arrow", "arsenic", "artistic", "ascend", "ashtray", "aside", "asked", "asleep", "aspire", "assorted", "asylum", "athlete", "atlas", "atom", "atrium", "attire", "auburn", "auctions", "audio", "august", "aunt", "austere", "autumn", "avatar", "avidly", "avoid", "awakened", "awesome", "awful", "awkward", "awning", "awoken", "axes", "axis", "axle", "aztec", "azure", "baby", "bacon", "badge", "baffles", "bagpipe", "bailed", "bakery", "balding", "bamboo", "banjo", "baptism", "basin", "batch", "bawled", "bays", "because", "beer", "befit", "begun", "behind", "being", "below", "bemused", "benches", "berries", "bested", "betting", "bevel", "beware", "beyond", "bias", "bicycle", "bids", "bifocals", "biggest", "bikini", "bimonthly", "binocular", "biology", "biplane", "birth", "biscuit", "bite", "biweekly", "blender", "blip", "bluntly", "boat", "bobsled", "bodies", "bogeys", "boil", "boldly", "bomb", "border", "boss", "both", "bounced", "bovine", "bowling", "boxes", "boyfriend", "broken", "brunt", "bubble", "buckets", "budget", "buffet", "bugs", "building", "bulb", "bumper", "bunch", "business", "butter", "buying", "buzzer", "bygones", "byline", "bypass", "cabin", "cactus", "cadets", "cafe", "cage", "cajun", "cake", "calamity", "camp", "candy", "casket", "catch", "cause", "cavernous", "cease", "cedar", "ceiling", "cell", "cement", "cent", "certain", "chlorine", "chrome", "cider", "cigar", "cinema", "circle", "cistern", "citadel", "civilian", "claim", "click", "clue", "coal", "cobra", "cocoa", "code", "coexist", "coffee", "cogs", "cohesive", "coils", "colony", "comb", "cool", "copy", "corrode", "costume", "cottage", "cousin", "cowl", "criminal", "cube", "cucumber", "cuddled", "cuffs", "cuisine", "cunning", "cupcake", "custom", "cycling", "cylinder", "cynical", "dabbing", "dads", "daft", "dagger", "daily", "damp", "dangerous", "dapper", "darted", "dash", "dating", "dauntless", "dawn", "daytime", "dazed", "debut", "decay", "dedicated", "deepest", "deftly", "degrees", "dehydrate", "deity", "dejected", "delayed", "demonstrate", "dented", "deodorant", "depth", "desk", "devoid", "dewdrop", "dexterity", "dialect", "dice", "diet", "different", "digit", "dilute", "dime", "dinner", "diode", "diplomat", "directed", "distance", "ditch", "divers", "dizzy", "doctor", "dodge", "does", "dogs", "doing", "dolphin", "domestic", "donuts", "doorway", "dormant", "dosage", "dotted", "double", "dove", "down", "dozen", "dreams", "drinks", "drowning", "drunk", "drying", "dual", "dubbed", "duckling", "dude", "duets", "duke", "dullness", "dummy", "dunes", "duplex", "duration", "dusted", "duties", "dwarf", "dwelt", "dwindling", "dying", "dynamite", "dyslexic", "each", "eagle", "earth", "easy", "eating", "eavesdrop", "eccentric", "echo", "eclipse", "economics", "ecstatic", "eden", "edgy", "edited", "educated", "eels", "efficient", "eggs", "egotistic", "eight", "either", "eject", "elapse", "elbow", "eldest", "eleven", "elite", "elope", "else", "eluded", "emails", "ember", "emerge", "emit", "emotion", "empty", "emulate", "energy", "enforce", "enhanced", "enigma", "enjoy", "enlist", "enmity", "enough", "enraged", "ensign", "entrance", "envy", "epoxy", "equip", "erase", "erected", "erosion", "error", "eskimos", "espionage", "essential", "estate", "etched", "eternal", "ethics", "etiquette", "evaluate", "evenings", "evicted", "evolved", "examine", "excess", "exhale", "exit", "exotic", "exquisite", "extra", "exult", "fabrics", "factual", "fading", "fainted", "faked", "fall", "family", "fancy", "farming", "fatal", "faulty", "fawns", "faxed", "fazed", "feast", "february", "federal", "feel", "feline", "females", "fences", "ferry", "festival", "fetches", "fever", "fewest", "fiat", "fibula", "fictional", "fidget", "fierce", "fifteen", "fight", "films", "firm", "fishing", "fitting", "five", "fixate", "fizzle", "fleet", "flippant", "flying", "foamy", "focus", "foes", "foggy", "foiled", "folding", "fonts", "foolish", "fossil", "fountain", "fowls", "foxes", "foyer", "framed", "friendly", "frown", "fruit", "frying", "fudge", "fuel", "fugitive", "fully", "fuming", "fungal", "furnished", "fuselage", "future", "fuzzy", "gables", "gadget", "gags", "gained", "galaxy", "gambit", "gang", "gasp", "gather", "gauze", "gave", "gawk", "gaze", "gearbox", "gecko", "geek", "gels", "gemstone", "general", "geometry", "germs", "gesture", "getting", "geyser", "ghetto", "ghost", "giant", "giddy", "gifts", "gigantic", "gills", "gimmick", "ginger", "girth", "giving", "glass", "gleeful", "glide", "gnaw", "gnome", "goat", "goblet", "godfather", "goes", "goggles", "going", "goldfish", "gone", "goodbye", "gopher", "gorilla", "gossip", "gotten", "gourmet", "governing", "gown", "greater", "grunt", "guarded", "guest", "guide", "gulp", "gumball", "guru", "gusts", "gutter", "guys", "gymnast", "gypsy", "gyrate", "habitat", "hacksaw", "haggled", "hairy", "hamburger", "happens", "hashing", "hatchet", "haunted", "having", "hawk", "haystack", "hazard", "hectare", "hedgehog", "heels", "hefty", "height", "hemlock", "hence", "heron", "hesitate", "hexagon", "hickory", "hiding", "highway", "hijack", "hiker", "hills", "himself", "hinder", "hippo", "hire", "history", "hitched", "hive", "hoax", "hobby", "hockey", "hoisting", "hold", "honked", "hookup", "hope", "hornet", "hospital", "hotel", "hounded", "hover", "howls", "hubcaps", "huddle", "huge", "hull", "humid", "hunter", "hurried", "husband", "huts", "hybrid", "hydrogen", "hyper", "iceberg", "icing", "icon", "identity", "idiom", "idled", "idols", "igloo", "ignore", "iguana", "illness", "imagine", "imbalance", "imitate", "impel", "inactive", "inbound", "incur", "industrial", "inexact", "inflamed", "ingested", "initiate", "injury", "inkling", "inline", "inmate", "innocent", "inorganic", "input", "inquest", "inroads", "insult", "intended", "inundate", "invoke", "inwardly", "ionic", "irate", "iris", "irony", "irritate", "island", "isolated", "issued", "italics", "itches", "items", "itinerary", "itself", "ivory", "jabbed", "jackets", "jaded", "jagged", "jailed", "jamming", "january", "jargon", "jaunt", "javelin", "jaws", "jazz", "jeans", "jeers", "jellyfish", "jeopardy", "jerseys", "jester", "jetting", "jewels", "jigsaw", "jingle", "jittery", "jive", "jobs", "jockey", "jogger", "joining", "joking", "jolted", "jostle", "journal", "joyous", "jubilee", "judge", "juggled", "juicy", "jukebox", "july", "jump", "junk", "jury", "justice", "juvenile", "kangaroo", "karate", "keep", "kennel", "kept", "kernels", "kettle", "keyboard", "kickoff", "kidneys", "king", "kiosk", "kisses", "kitchens", "kiwi", "knapsack", "knee", "knife", "knowledge", "knuckle", "koala", "laboratory", "ladder", "lagoon", "lair", "lakes", "lamb", "language", "laptop", "large", "last", "later", "launching", "lava", "lawsuit", "layout", "lazy", "lectures", "ledge", "leech", "left", "legion", "leisure", "lemon", "lending", "leopard", "lesson", "lettuce", "lexicon", "liar", "library", "licks", "lids", "lied", "lifestyle", "light", "likewise", "lilac", "limits", "linen", "lion", "lipstick", "liquid", "listen", "lively", "loaded", "lobster", "locker", "lodge", "lofty", "logic", "loincloth", "long", "looking", "lopped", "lordship", "losing", "lottery", "loudly", "love", "lower", "loyal", "lucky", "luggage", "lukewarm", "lullaby", "lumber", "lunar", "lurk", "lush", "luxury", "lymph", "lynx", "lyrics", "macro", "madness", "magically", "mailed", "major", "makeup", "malady", "mammal", "maps", "masterful", "match", "maul", "maverick", "maximum", "mayor", "maze", "meant", "mechanic", "medicate", "meeting", "megabyte", "melting", "memoir", "menu", "merger", "mesh", "metro", "mews", "mice", "midst", "mighty", "mime", "mirror", "misery", "mittens", "mixture", "moat", "mobile", "mocked", "mohawk", "moisture", "molten", "moment", "money", "moon", "mops", "morsel", "mostly", "motherly", "mouth", "movement", "mowing", "much", "muddy", "muffin", "mugged", "mullet", "mumble", "mundane", "muppet", "mural", "musical", "muzzle", "myriad", "mystery", "myth", "nabbing", "nagged", "nail", "names", "nanny", "napkin", "narrate", "nasty", "natural", "nautical", "navy", "nearby", "necklace", "needed", "negative", "neither", "neon", "nephew", "nerves", "nestle", "network", "neutral", "never", "newt", "nexus", "nibs", "niche", "niece", "nifty", "nightly", "nimbly", "nineteen", "nirvana", "nitrogen", "nobody", "nocturnal", "nodes", "noises", "nomad", "noodles", "northern", "nostril", "noted", "nouns", "novelty", "nowhere", "nozzle", "nuance", "nucleus", "nudged", "nugget", "nuisance", "null", "number", "nuns", "nurse", "nutshell", "nylon", "oaks", "oars", "oasis", "oatmeal", "obedient", "object", "obliged", "obnoxious", "observant", "obtains", "obvious", "occur", "ocean", "october", "odds", "odometer", "offend", "often", "oilfield", "ointment", "okay", "older", "olive", "olympics", "omega", "omission", "omnibus", "onboard", "oncoming", "oneself", "ongoing", "onion", "online", "onslaught", "onto", "onward", "oozed", "opacity", "opened", "opposite", "optical", "opus", "orange", "orbit", "orchid", "orders", "organs", "origin", "ornament", "orphans", "oscar", "ostrich", "otherwise", "otter", "ouch", "ought", "ounce", "ourselves", "oust", "outbreak", "oval", "oven", "owed", "owls", "owner", "oxidant", "oxygen", "oyster", "ozone", "pact", "paddles", "pager", "pairing", "palace", "pamphlet", "pancakes", "paper", "paradise", "pastry", "patio", "pause", "pavements", "pawnshop", "payment", "peaches", "pebbles", "peculiar", "pedantic", "peeled", "pegs", "pelican", "pencil", "people", "pepper", "perfect", "pests", "petals", "phase", "pheasants", "phone", "phrases", "physics", "piano", "picked", "pierce", "pigment", "piloted", "pimple", "pinched", "pioneer", "pipeline", "pirate", "pistons", "pitched", "pivot", "pixels", "pizza", "playful", "pledge", "pliers", "plotting", "plus", "plywood", "poaching", "pockets", "podcast", "poetry", "point", "poker", "polar", "ponies", "pool", "popular", "portents", "possible", "potato", "pouch", "poverty", "powder", "pram", "present", "pride", "problems", "pruned", "prying", "psychic", "public", "puck", "puddle", "puffin", "pulp", "pumpkins", "punch", "puppy", "purged", "push", "putty", "puzzled", "pylons", "pyramid", "python", "queen", "quick", "quote", "rabbits", "racetrack", "radar", "rafts", "rage", "railway", "raking", "rally", "ramped", "randomly", "rapid", "rarest", "rash", "rated", "ravine", "rays", "razor", "react", "rebel", "recipe", "reduce", "reef", "refer", "regular", "reheat", "reinvest", "rejoices", "rekindle", "relic", "remedy", "renting", "reorder", "repent", "request", "reruns", "rest", "return", "reunion", "revamp", "rewind", "rhino", "rhythm", "ribbon", "richly", "ridges", "rift", "rigid", "rims", "ringing", "riots", "ripped", "rising", "ritual", "river", "roared", "robot", "rockets", "rodent", "rogue", "roles", "romance", "roomy", "roped", "roster", "rotate", "rounded", "rover", "rowboat", "royal", "ruby", "rudely", "ruffled", "rugged", "ruined", "ruling", "rumble", "runway", "rural", "rustled", "ruthless", "sabotage", "sack", "sadness", "safety", "saga", "sailor", "sake", "salads", "sample", "sanity", "sapling", "sarcasm", "sash", "satin", "saucepan", "saved", "sawmill", "saxophone", "sayings", "scamper", "scenic", "school", "science", "scoop", "scrub", "scuba", "seasons", "second", "sedan", "seeded", "segments", "seismic", "selfish", "semifinal", "sensible", "september", "sequence", "serving", "session", "setup", "seventh", "sewage", "shackles", "shelter", "shipped", "shocking", "shrugged", "shuffled", "shyness", "siblings", "sickness", "sidekick", "sieve", "sifting", "sighting", "silk", "simplest", "sincerely", "sipped", "siren", "situated", "sixteen", "sizes", "skater", "skew", "skirting", "skulls", "skydive", "slackens", "sleepless", "slid", "slower", "slug", "smash", "smelting", "smidgen", "smog", "smuggled", "snake", "sneeze", "sniff", "snout", "snug", "soapy", "sober", "soccer", "soda", "software", "soggy", "soil", "solved", "somewhere", "sonic", "soothe", "soprano", "sorry", "southern", "sovereign", "sowed", "soya", "space", "speedy", "sphere", "spiders", "splendid", "spout", "sprig", "spud", "spying", "square", "stacking", "stellar", "stick", "stockpile", "strained", "stunning", "stylishly", "subtly", "succeed", "suddenly", "suede", "suffice", "sugar", "suitcase", "sulking", "summon", "sunken", "superior", "surfer", "sushi", "suture", "swagger", "swept", "swiftly", "sword", "swung", "syllabus", "symptoms", "syndrome", "syringe", "system", "taboo", "tacit", "tadpoles", "tagged", "tail", "taken", "talent", "tamper", "tanks", "tapestry", "tarnished", "tasked", "tattoo", "taunts", "tavern", "tawny", "taxi", "teardrop", "technical", "tedious", "teeming", "tell", "template", "tender", "tepid", "tequila", "terminal", "testing", "tether", "textbook", "thaw", "theatrics", "thirsty", "thorn", "threaten", "thumbs", "thwart", "ticket", "tidy", "tiers", "tiger", "tilt", "timber", "tinted", "tipsy", "tirade", "tissue", "titans", "toaster", "tobacco", "today", "toenail", "toffee", "together", "toilet", "token", "tolerant", "tomorrow", "tonic", "toolbox", "topic", "torch", "tossed", "total", "touchy", "towel", "toxic", "toyed", "trash", "trendy", "tribal", "trolling", "truth", "trying", "tsunami", "tubes", "tucks", "tudor", "tuesday", "tufts", "tugs", "tuition", "tulips", "tumbling", "tunnel", "turnip", "tusks", "tutor", "tuxedo", "twang", "tweezers", "twice", "twofold", "tycoon", "typist", "tyrant", "ugly", "ulcers", "ultimate", "umbrella", "umpire", "unafraid", "unbending", "uncle", "under", "uneven", "unfit", "ungainly", "unhappy", "union", "unjustly", "unknown", "unlikely", "unmask", "unnoticed", "unopened", "unplugs", "unquoted", "unrest", "unsafe", "until", "unusual", "unveil", "unwind", "unzip", "upbeat", "upcoming", "update", "upgrade", "uphill", "upkeep", "upload", "upon", "upper", "upright", "upstairs", "uptight", "upwards", "urban", "urchins", "urgent", "usage", "useful", "usher", "using", "usual", "utensils", "utility", "utmost", "utopia", "uttered", "vacation", "vague", "vain", "value", "vampire", "vane", "vapidly", "vary", "vastness", "vats", "vaults", "vector", "veered", "vegan", "vehicle", "vein", "velvet", "venomous", "verification", "vessel", "veteran", "vexed", "vials", "vibrate", "victim", "video", "viewpoint", "vigilant", "viking", "village", "vinegar", "violin", "vipers", "virtual", "visited", "vitals", "vivid", "vixen", "vocal", "vogue", "voice", "volcano", "vortex", "voted", "voucher", "vowels", "voyage", "vulture", "wade", "waffle", "wagtail", "waist", "waking", "wallets", "wanted", "warped", "washing", "water", "waveform", "waxing", "wayside", "weavers", "website", "wedge", "weekday", "weird", "welders", "went", "wept", "were", "western", "wetsuit", "whale", "when", "whipped", "whole", "wickets", "width", "wield", "wife", "wiggle", "wildly", "winter", "wipeout", "wiring", "wise", "withdrawn", "wives", "wizard", "wobbly", "woes", "woken", "wolf", "womanly", "wonders", "woozy", "worry", "wounded", "woven", "wrap", "wrist", "wrong", "yacht", "yahoo", "yanks", "yard", "yawning", "yearbook", "yellow", "yesterday", "yeti", "yields", "yodel", "yoga", "younger", "yoyo", "zapped", "zeal", "zebra", "zero", "zesty", "zigzags", "zinger", "zippers", "zodiac", "zombie", "zones", "zoom"
    ],
    cnBase58 = (function() {
        var b58 = {},
            alphabet_str = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
            alphabet = [];
        for (var i = 0; i < alphabet_str.length; i++) {
            alphabet.push(alphabet_str.charCodeAt(i));
        }
        var encoded_block_sizes = [0, 2, 3, 5, 6, 7, 9, 10, 11],
            alphabet_size = alphabet.length,
            full_block_size = 8,
            full_encoded_block_size = 11,
            UINT64_MAX = new JSBigInt(2).pow(64);
        b58.decode_block = function(data, buf, index) {
            if (data.length < 1 || data.length > full_encoded_block_size) {
                throw "Invalid block length: " + data.length;
            }
            var res_size = encoded_block_sizes.indexOf(data.length);
            if (res_size <= 0) {
                throw "Invalid block size";
            }
            var res_num = new JSBigInt(0),
                order = new JSBigInt(1);
            for (var i = data.length - 1; i >= 0; i--) {
                var digit = alphabet.indexOf(data[i]);
                if (digit < 0) {
                    throw "Invalid symbol";
                }
                var product = order.multiply(digit).add(res_num);
                if (product.compare(UINT64_MAX) === 1) {
                    throw "Overflow";
                }
                res_num = product;
                order = order.multiply(alphabet_size);
            }
            if (res_size < full_block_size && (new JSBigInt(2).pow(8 * res_size).compare(res_num) <= 0)) {
                throw "Overflow 2";
            }
            buf.set(uint64_to_8be(res_num, res_size), index);
            return buf;
        };
        b58.decode = function(encode) {
            var enc = strtobin(encode);
            if (enc.length === 0) {
                return "";
            }
            var full_block_count = Math.floor(enc.length / full_encoded_block_size),
                last_block_size = enc.length % full_encoded_block_size,
                last_block_decoded_size = encoded_block_sizes.indexOf(last_block_size);
            if (last_block_decoded_size < 0) {
                throw "Invalid encoded length";
            }
            var data_size = full_block_count * full_block_size + last_block_decoded_size,
                data = uint_8Array(data_size);
            for (var i = 0; i < full_block_count; i++) {
                data = b58.decode_block(enc.subarray(i * full_encoded_block_size, i * full_encoded_block_size + full_encoded_block_size), data, i * full_block_size);
            }
            if (last_block_size > 0) {
                data = b58.decode_block(enc.subarray(full_block_count * full_encoded_block_size, full_block_count * full_encoded_block_size + last_block_size), data, full_block_count * full_block_size);
            }
            return bintohex(data);
        };
        return b58;
    })();

function sc_reduce32(hex) {
    return hextobin(str_pad((BigInt("0x" + bintohex(hextobin(hex).reverse())) % l).toString(16), 64)).reverse();
}

function get_ssk(bip39, seed) {
    var p_rootkey = (seed === true) ? get_rootkey(bip39) : get_rootkey(toseed(bip39)),
        dx_dat = {
            "dpath": "m/44'/128'/0'/0/0",
            "key": p_rootkey.slice(0, 64),
            "cc": p_rootkey.slice(64)
        },
        x_keys_dat = derive_x(dx_dat),
        rootkey = x_keys_dat.key;
    return sc_reduce32(fasthash(rootkey));
}

function pub_keys_to_address(psk, pvk, index) {
    var pref = (index < 1) ? "12" : "2a",
        res_hex = pref + psk + pvk,
        cpa = res_hex + fasthash(res_hex).slice(0, 8);
    return base58_encode(hextobin(cpa));
}

function fasthash(hex) {
    return keccak256(hextobin(hex));
}

function xmr_getpubs(ssk, index) {
    var sskh = bintohex(ssk),
        svk = bintohex(sc_reduce32(fasthash(sskh))),
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
    var pubp = point_multiply(sc_reduce32(fasthash(5375624164647200 + svk + uint32hex(0) + uint32hex(index)))),
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

function makeCRCTable() {
    var c,
        crcTable = [];
    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc_32(str) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable()),
        crc = 0 ^ (-1);
    for (var i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

function secret_spend_key_to_words(ssk) {
    var seed = [],
        for_checksum = "";
    for (var i = 0; i < 32; i += 4) {
        var w0 = 0;
        for (var j = 3; j >= 0; j--) w0 = w0 * 256 + ssk[i + j];
        var xmrwl = xmr_words.length,
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

function hextobin(hex) {
    if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
    var res = uint_8Array(hex.length / 2);
    for (var i = 0; i < hex.length / 2; ++i) {
        res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return res;
}

function bintohex(bin) {
    var out = [];
    for (var i = 0; i < bin.length; ++i) {
        out.push(("0" + bin[i].toString(16)).slice(-2));
    }
    return out.join("");
}

function uint32hex(value) {
    var h = value.toString(16);
    if (h.length > 8) throw "value must not equal or exceed 2^32";
    while (h.length < 8) h = "0" + h;
    return h.match(/../g).reverse().join("");
}

function strtobin(str) {
    var res = uint_8Array(str.length);
    for (var i = 0; i < str.length; i++) {
        res[i] = str.charCodeAt(i);
    }
    return res;
}

function uint64_to_8be(num, size) {
    var res = uint_8Array(size);
    if (size < 1 || size > 8) {
        throw "Invalid input length";
    }
    var twopow8 = new JSBigInt(2).pow(8);
    for (var i = size - 1; i >= 0; i--) {
        res[i] = num.remainder(twopow8).toJSValue();
        num = num.divide(twopow8);
    }
    return res;
}

function base58_encode(data) {
    var ab = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
        ab_map = {},
        btl = [0, 2, 3, 5, 6, 7, 9, 10, 11],
        base = ab.length;
    for (var z = 0; z < ab.length; z++) {
        var x = ab.charAt(z);
        if (ab_map[x] !== undefined) throw new TypeError(x + " is ambiguous");
        ab_map[x] = z;
    }

    function encode_partial(data, pos) {
        var len = 8;
        if (pos + len > data.length) len = data.length - pos;
        var digits = [0];
        for (var i = 0; i < len; ++i) {
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
        var res = "";
        for (var k = digits.length; k < btl[len]; ++k) res += ab[0];
        for (var q = digits.length - 1; q >= 0; --q) res += ab[digits[q]];
        return res;
    }
    var resu = "";
    for (var i = 0; i < data.length; i += 8) {
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
    static fromAffine(p) {
        if (!(p instanceof xPoint)) {
            throw new TypeError('ExtendedPoint#fromAffine: expected Point');
        }
        if (p.equals(xPoint.ZERO))
            return ExtendedPoint.ZERO;
        return new ExtendedPoint(p.x, p.y, 1n, xmod(p.x * p.y));
    }
    static toAffineBatch(points) {
        const toInv = xmr_invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
        return this.toAffineBatch(points).map(this.fromAffine);
    }
    negate() {
        return new ExtendedPoint(xmod(-this.x), this.y, this.z, xmod(-this.t));
    }
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
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        xmr_pointPrecomputes.delete(this);
    }
    static fromHex(hash) {
        const {
            d,
            P
        } = xmr_CURVE,
        bytes = hash instanceof Uint8Array ? hash : xmr_hexToBytes(hash),
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
    toHex() {
        return xmr_bytesToHex(this.toRawBytes());
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    add(other) {
        return ExtendedPoint.fromAffine(this).add(ExtendedPoint.fromAffine(other)).toAffine();
    }
    multiply(scalar) {
        return ExtendedPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
xPoint.BASE = new xPoint(xmr_CURVE.Gx, xmr_CURVE.Gy);
xPoint.ZERO = new xPoint(0n, 1n);
xPoint.BASE._setWindowSize(8);

function xmr_bytesToHex(uint8a) {
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += uint8a[i].toString(16).padStart(2, '0');
    }
    return hex;
}

function xmr_hexToBytes(hex) {
    hex = hex.length & 1 ? `0${hex}` : hex;
    const array = uint_8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        let j = i * 2;
        array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
    }
    return array;
}

function xmr_numberToHex(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}

function bytesToNumberLE(uint8a) {
    let value = 0n;
    for (let i = 0; i < uint8a.length; i++) {
        value += BigInt(uint8a[i]) << (8n * BigInt(i));
    }
    return value;
}

function xmod(a, b = xmr_CURVE.P) {
    const res = a % b;
    return res >= 0n ? res : b + res;
}

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

function xmr_getpoint(hex) {
    return xPoint.fromHex(hex);
}

function point_multiply(hex) {
    return xPoint.BASE.multiply(xmr_getpoint(hex).y);
}

function xmr_getPublicKey(privateKey) {
    return point_multiply(privateKey).toHex();
}

function xmr_pid() {
    return mn_random(256).slice(0, 16);
}

function check_pid(payment_id) {
    var payment_id_length = payment_id.length;
    if (payment_id_length !== 16) {
        return false // invalid length
    }
    var pattern = RegExp("^[0-9a-fA-F]{16}$");
    if (pattern.test(payment_id) != true) {
        return false;
    }
    return true;
}

function mn_random(bits) {
    "use strict";
    if (bits % 32 !== 0) throw "Something weird went wrong: Invalid number of bits - " + bits;
    var array = new Uint32Array(bits / 32);
    if (!crypto) throw "Unfortunately MyMonero only runs on browsers that support the JavaScript Crypto API";
    var i = 0;

    function arr_is_zero() {
        for (var j = 0; j < bits / 32; ++j) {
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
    var out = "";
    for (var j = 0; j < bits / 32; ++j) {
        out += ("0000000" + array[j].toString(16)).slice(-8);
    }
    return out;
}