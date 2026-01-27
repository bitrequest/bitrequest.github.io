/**
 * CryptoUtils - Standalone cryptocurrency utilities library
 * 
 * STANDALONE USAGE (outside Bitrequest):
 * ----------------------------------------
 * <script src="assets_js_lib_sjcl.js"></script>
  * <script src="assets_js_lib_crypto_utils.js"></script>
 * <script>
 *   const bytes = CryptoUtils.hex_to_bytes("crypto");
 *   const addr = CryptoUtils.pub_to_address_bech32("bc", pubkey);
 * </script>
 * 
 * FEATURES:
 * - Base58 / Base58Check encoding
 * - Bech32 / Bech32m encoding
 * - Secp256k1 elliptic curve operations
 * - SHA256, RIPEMD160, Hash160, Keccak-256
 * - Bitcoin/Litecoin/Ethereum address generation
 * - Bitcoin Cash CashAddr support
 * - BIP39 mnemonic utilities
 * - AES encryption/decryption
 * - LNURL decoding
 * 
 * @version 1.1.0
 * @license AGPL-3.0
 * @see https://github.com/bitrequest/bitrequest.github.io
 * secp256k1 implementation based onhttps://github.com/paulmillr/noble-secp256k1
 */

// ============================================
// CONSTANTS
// ============================================

const crypto = window.crypto,
    b58ab = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    b32ab = "qpzry9x8gf2tvdw0s3jn54khce6mua7l",
    generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3],
    bytestring = "0000000000000000000000000000000000000000000000000000000000000000",
    wordlist = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"],
    utf8_encoder = new TextEncoder(),
    utf8_decoder = new TextDecoder("utf-8", {
        "fatal": true
    }),
    BECH32_CONST = 1,
    BECH32M_CONST = 0x2bc830a3;

// Secp256k1 curve parameters
const secp = {},
    CURVE = {
        "a": 0n,
        "b": 7n,
        "P": (2n ** 256n) - (2n ** 32n) - 977n,
        "n": (2n ** 256n) - 432420386565659656852420866394968145599n,
        "Gx": 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
        "Gy": 32670510020758816978083085130507043184471273380659243275938904335757337482424n
    };
secp.CURVE = CURVE;

// ============================================
// CORE HELPERS
// ============================================

// Creates a typed array with 8-bit unsigned integers from a byte array
function uint_8array(bytes) {
    return new Uint8Array(bytes);
}

// Encodes string to UTF-8 using TextEncoder
function buffer(enc) {
    return utf8_encoder.encode(enc);
}

// Decodes UTF-8 encoded data using TextDecoder
function unbuffer(enc, encoding) {
    return utf8_decoder.decode(enc);
}

// Converts ArrayBuffer to zero-padded hexadecimal string
function buf2hex(buffer) {
    return Array.prototype.map.call(uint_8array(buffer), x => ("00" + x.toString(16)).slice(-2)).join("");
}

// Validates string contains only hexadecimal characters [0-9a-fA-F]
function is_hex(str) {
    return new RegExp("^[a-fA-F0-9]+$").test(str);
}

// Left-pads string with zeros to specified byte length with truncation
function str_pad(val, bytes) {
    return (bytestring.slice(0, bytes) + val).substr(-bytes);
}

// Converts integer to base-16 string representation
function dec_to_hex(val) {
    return val.toString(16);
}

// Parses hexadecimal string to BigInt with 0x prefix
function hex_to_dec(val) {
    return BigInt("0x" + val);
}

// Converts a hexadecimal string to a decimal string
function hex_to_number_string(val) {
    return hex_to_int(val).toString();
}

// Converts a hexadecimal string to a number
function hex_to_int(val) {
    return parseInt(val, 16);
}

// Pads binary strings with leading zeros
function pad_binary(binary_str, target_length) {
    let padded_str = binary_str.toString();
    while (padded_str.length < target_length) {
        padded_str = "0" + padded_str;
    }
    return padded_str;
}

// Concatenates multiple Uint8Arrays into one
function concat_bytes(...arrays) {
    const sizes = arrays.reduce((acc, a) => acc + a.length, 0),
        result = uint_8array(sizes);
    let offset = 0;
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.length;
    }
    return result;
}

// Encodes integer as Bitcoin-style variable-length integer (LEB128)
function encode_varint(n) {
    const bytes = [];
    while (n >= 0x80) {
        bytes.push((n & 0x7f) | 0x80);
        n >>= 7;
    }
    bytes.push(n);
    return new Uint8Array(bytes);
}

// ============================================
// SJCL BIT OPERATIONS
// ============================================

// Converts UTF-8 string to SJCL bit array
function to_bits(val) {
    return sjcl.codec.utf8String.toBits(val);
}

// Converts hex string to SJCL bit array
function hex_to_bits(val) {
    return sjcl.codec.hex.toBits(val);
}

// Converts SJCL bit array to hex string
function from_bits(val) {
    return sjcl.codec.hex.fromBits(val);
}

// Returns the bit length of SJCL bit array
function bit_length(val) {
    return sjcl.bitArray.bitLength(val);
}

// Concatenates two SJCL bit arrays
function concat_array(arr1, arr2) {
    return sjcl.bitArray.concat(arr1, arr2);
}

// ============================================
// BASE CONVERSION
// ============================================

// Converts binary string to SJCL word array
function binary_string_to_word_array(binary) {
    const bit_len = binary.length;
    let words = [];
    for (let i = 0; i < bit_len; i += 32) {
        const str_chunk = binary.substring(i, i + 32),
            int_word = parseInt(str_chunk, 2);
        words.push(int_word | 0);
    }
    return sjcl.bitArray.clamp(words, bit_len);
}

// Converts byte array to SJCL word array
function byte_array_to_word_array(data) {
    let words = [],
        i,
        word = 0;
    for (i = 0; i < data.length; i++) {
        word = (word << 8) | data[i];
        if ((i + 1) % 4 === 0) {
            words.push(word);
            word = 0;
        }
    }
    if (i % 4 !== 0) {
        word <<= (4 - (i % 4)) * 8;
        words.push(word);
    }
    return sjcl.bitArray.clamp(words, data.length * 8);
}

// Converts byte array to binary string
function byte_array_to_binary_string(data) {
    let bin_str = "";
    for (let i = 0; i < data.length; i++) {
        bin_str += pad_binary(data[i].toString(2), 8);
    }
    return bin_str;
}

// Converts hex string to binary string
function hex_string_to_binary_string(hexString) {
    let bin_str = "";
    for (let i = 0; i < hexString.length; i++) {
        const hexChar = hexString[i],
            hexInt = parseInt(hexChar, 16),
            bin_frag = hexInt.toString(2);
        bin_str += pad_binary(bin_frag, 4);
    }
    return bin_str;
}

// ============================================
// BASE58 ENCODING
// ============================================

// Encodes data to Base58 string from hex or UTF-8 input
function b58enc(enc, encode = "hex") {
    const bytestring = (encode === "hex") ? hex_to_bytes(enc) : buffer(enc);
    return b58enc_uint_array(bytestring);
}

// Converts Uint8Array to Base58 string using custom alphabet
function b58enc_uint_array(u) {
    let d = [],
        s = "",
        i, j, c, n;
    for (i in u) {
        j = 0, c = u[i];
        s += c || s.length ^ i ? "" : 1;
        while (j in d || c) {
            n = d[j];
            n = n ? n * 256 + c : c;
            c = n / 58 | 0;
            d[j] = n % 58;
            j++
        }
    }
    while (j--) s += b58ab[d[j]];
    return s;
}

// Decodes Base58 string to UTF-8 or hexadecimal output
function b58dec(dec, decode) {
    const buffer = b58dec_uint_array(dec);
    return (decode === "hex") ? buf2hex(buffer) : unbuffer(buffer, "utf-8");
}

// Converts Base58 string to Uint8Array using custom alphabet
function b58dec_uint_array(dec) {
    let d = [],
        b = [],
        i, j, c, n;
    for (i in dec) {
        j = 0, c = b58ab.indexOf(dec[i]);
        if (c < 0) return undefined;
        c || b.length ^ i ? i : b.push(0);
        while (j in d || c) {
            n = d[j];
            n = n ? n * 58 + c : c;
            c = n >> 8;
            d[j] = n % 256;
            j++
        }
    }
    while (j--) b.push(d[j]);
    return uint_8array(b);
}

// Implements Base58Check encoding with double SHA256 checksum
function b58check_encode(payload) {
    const full_bytes = payload + hmacsha(hmacsha(payload, "sha256", "hex"), "sha256", "hex").slice(0, 8);
    return b58enc(full_bytes, "hex");
}

// Decodes Base58Check string and removes 4-byte checksum
function b58check_decode(val) {
    const full_bytes = b58dec(val, "hex"),
        bytes = full_bytes.substring(0, full_bytes.length - 8);
    return bytes;
}

// ============================================
// BECH32 ENCODING
// ============================================

// Converts input byte array to 5-bit word representation for bech32 encoding
function to_words(bytes) {
    const res = convert_bits(bytes, 8, 5, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

// Converts 5-bit word array back to byte representation for bech32 decoding
function from_words(bytes) {
    const res = convert_bits(bytes, 5, 8, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

// Transforms data between different bit-length representations with optional padding
function convert_bits(data, inBits, outBits, pad) {
    let value = 0,
        bits = 0,
        maxV = (1 << outBits) - 1,
        result = [];
    for (let i = 0; i < data.length; ++i) {
        value = (value << inBits) | data[i];
        bits += inBits;
        while (bits >= outBits) {
            bits -= outBits;
            result.push((value >> bits) & maxV);
        }
    }
    if (pad) {
        if (bits > 0) {
            result.push((value << (outBits - bits)) & maxV);
        }
    } else {
        if (bits >= inBits) {
            return "Excess padding"
        }
        if ((value << (outBits - bits)) & maxV) {
            return "Non-zero padding"
        }
    }
    return result
}

// Computes the Bech32 checksum
function polymod(values) {
    let chk = 1;
    for (let p = 0; p < values.length; ++p) {
        let top = chk >> 25;
        chk = (chk & 0x1ffffff) << 5 ^ values[p];
        for (let i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= generator[i];
            }
        }
    }
    return chk;
}

// Expands the human-readable part for Bech32 encoding
function hrp_expand(hrp) {
    const ret = [];
    let p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }
    return ret;
}

// Verifies the checksum in a Bech32 address
function verify_checksum(hrp, data) {
    return polymod(hrp_expand(hrp).concat(data)) === 1;
}

// Creates a checksum for Bech32 encoding
function create_checksum(hrp, data) {
    const values = hrp_expand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]),
        mod = polymod(values) ^ 1,
        ret = [];
    for (let p = 0; p < 6; ++p) {
        ret.push((mod >> 5 * (5 - p)) & 31);
    }
    return ret;
}

// Encodes data into a Bech32 address
function bech32_encode(hrp, data) {
    let combined = data.concat(create_checksum(hrp, data)),
        ret = hrp + "1";
    for (let p = 0; p < combined.length; ++p) {
        ret += b32ab.charAt(combined[p]);
    }
    return ret;
}

// Decodes a Bech32 encoded string
function bech32_decode(bechString) {
    let p, has_lower = false,
        has_upper = false;

    for (p = 0; p < bechString.length; ++p) {
        if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
            return null;
        }
        if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
            has_lower = true;
        }
        if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
            has_upper = true;
        }
    }
    if (has_lower && has_upper) {
        return null;
    }

    bechString = bechString.toLowerCase();
    const pos = bechString.lastIndexOf("1");
    if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
        return null;
    }

    const hrp = bechString.substring(0, pos),
        data = [];

    for (p = pos + 1; p < bechString.length; ++p) {
        const d = b32ab.indexOf(bechString.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }

    const encoding = verify_checksum_with_type(hrp, data);
    if (!encoding) {
        return null;
    }

    if (data[0] === 1 && encoding !== "bech32m") {
        return null;
    }
    if (data[0] === 0 && encoding !== "bech32") {
        return null;
    }
    return {
        "hrp": hrp,
        "data": data.slice(0, data.length - 6),
        "encoding": encoding
    };
}

// Modified polymod function to support both bech32 and bech32m
function verify_checksum_with_type(hrp, data) {
    const modulo = polymod(hrp_expand(hrp).concat(data));
    if (modulo === BECH32_CONST) return "bech32";
    if (modulo === BECH32M_CONST) return "bech32m";
    return null;
}

// Converts a binary array to decimal array for Bech32 encoding
function bech32_dec_array(bitarr) {
    const hexstr = [0];
    bitarr.forEach(bits => {
        hexstr.push(parseInt(bits, 2));
    });
    return hexstr;
}

// Converts a public key to a Bech32 address
function pub_to_address_bech32(hrp, pubkey) {
    const step1 = hash160(pubkey),
        step2 = hex_string_to_binary_string(step1),
        step3 = step2.match(/.{1,5}/g),
        step4 = bech32_dec_array(step3);
    return bech32_encode(hrp, step4);
}

// ============================================
// SECP256K1 ELLIPTIC CURVE
// ============================================

// Computes modular reduction with positive result
function mod(a, m = CURVE.P) {
    const r = a % m;
    return r >= 0n ? r : m + r;
}

// Evaluates the secp256k1 curve equation y² = x³ + 7 for a given x coordinate
function weierstrass(x) {
    return mod(x ** 3n + CURVE.b);
}

// Implements Extended Euclidean Algorithm to find GCD and Bézout's identity coefficients
function egcd(a, b) {
    if (typeof a === "number") a = BigInt(a);
    if (typeof b === "number") b = BigInt(b);
    let [x, y, u, v] = [0n, 1n, 1n, 0n];
    while (a !== 0n) {
        const q = b / a,
            r = b % a;
        let m = x - u * q,
            n = y - v * q;
        [b, a] = [a, r];
        [x, y] = [u, v];
        [u, v] = [m, n];
    }
    return [b, x, y];
}

// Calculates the modular multiplicative inverse using extended Euclidean algorithm
function invert(number, modulo = CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error("invert: invalid number");
    }
    const [g, x] = egcd(mod(number, modulo), modulo);
    if (g !== 1n) throw new Error("invert: does not exist");
    return mod(x, modulo);
}

// Converts hexadecimal string to Uint8Array with zero-padding for odd length
function hex_to_bytes(hex) {
    if (typeof hex !== "string") throw new TypeError("hexToBytes: expected string");
    if (hex.length % 2) hex = "0" + hex;
    const len = hex.length / 2,
        array = uint_8array(len);
    for (let i = 0; i < len; i++) {
        const j = i * 2;
        array[i] = parseInt(hex.slice(j, j + 2), 16);
    }
    return array;
}

// Converts Uint8Array to hexadecimal string
function bytes_to_hex(uint8a) {
    let hex = "";
    for (let i = 0; i < uint8a.length; i++) {
        hex += uint8a[i].toString(16).padStart(2, "0");
    }
    return hex;
}

// Parses hexadecimal string to BigInt
function hex_to_number(hex) {
    if (typeof hex !== "string") throw new TypeError("hexToNumber: expected string");
    return hex.length ? BigInt("0x" + hex) : 0n;
}

// Converts Uint8Array to BigInt (big-endian)
function bytes_to_number(bytes) {
    return hex_to_number(bytes_to_hex(bytes));
}

// Zero-pads BigInt to 64-character hex string
function pad64(num) {
    return num.toString(16).padStart(64, "0");
}

// Implements point addition and doubling in Jacobian projective coordinates
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromAffine(p) {
        return new JacobianPoint(p.x, p.y, 1n);
    }

    double() {
        const {
            "x": X1,
            "y": Y1,
            "z": Z1
        } = this;
        if (!Y1) return new JacobianPoint(0n, 0n, 0n);
        const A = mod(X1 ** 2n),
            B = mod(Y1 ** 2n),
            C = mod(B ** 2n),
            D = mod(2n * (mod((X1 + B) ** 2n) - A - C)),
            E = mod(3n * A),
            F = mod(E ** 2n),
            X3 = mod(F - 2n * D),
            Y3 = mod(E * (D - X3) - 8n * C),
            Z3 = mod(2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }

    add(other) {
        if (!other.x && !other.y) return this;
        if (!this.x && !this.y) return other;
        const {
            "x": X1,
            "y": Y1,
            "z": Z1
        } = this, {
            "x": X2,
            "y": Y2,
            "z": Z2
        } = other, Z1Z1 = mod(Z1 ** 2n), Z2Z2 = mod(Z2 ** 2n), U1 = mod(X1 * Z2Z2), U2 = mod(X2 * Z1Z1), S1 = mod(Y1 * Z2 * Z2Z2), S2 = mod(Y2 * Z1 * Z1Z1), H = mod(U2 - U1), r = mod(S2 - S1);
        if (H === 0n) {
            if (r === 0n) {
                return this.double();
            } else {
                return new JacobianPoint(0n, 0n, 0n);
            }
        }
        const HH = mod(H ** 2n),
            HHH = mod(H * HH),
            V = mod(U1 * HH),
            X3 = mod(r ** 2n - HHH - 2n * V),
            Y3 = mod(r * (V - X3) - S1 * HHH),
            Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }

    multiplyUnsafe(scalar) {
        let n = scalar;
        if (typeof n !== "bigint") n = BigInt(n);
        n = n % CURVE.n;
        if (n === 0n) return new JacobianPoint(0n, 0n, 0n);
        let p = new JacobianPoint(0n, 0n, 0n),
            d = this;
        while (n > 0n) {
            if (n & 1n) p = p.add(d);
            d = d.double();
            n >>= 1n;
        }
        return p;
    }

    toAffine() {
        if (this.z === 0n) {
            return new Point(0n, 0n);
        }
        const iz = invert(this.z, CURVE.P),
            iz2 = mod(iz ** 2n),
            x = mod(this.x * iz2),
            y = mod(this.y * iz2 * iz);
        return new Point(x, y);
    }
}

// Represents a point on secp256k1 curve in affine coordinates (x,y)
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromPrivateKey(privateKey) {
        const key = normalize_privatekey(privateKey);
        return Point.BASE.multiply(key);
    }

    static fromHex(hex) {
        const bytes = hex instanceof Uint8Array ? hex : hex_to_bytes(hex);
        if (bytes.length === 32) {
            return this.fromX(bytes);
        }
        const header = bytes[0];
        if (header === 0x02 || header === 0x03) {
            return this.fromCompressedHex(bytes);
        }
        if (header === 0x04) {
            return this.fromUncompressedHex(bytes);
        }
        throw new Error("Point.fromHex: invalid format");
    }

    static fromX(bytes) {
        const x = bytes_to_number(bytes),
            y2 = weierstrass(x);
        let y = sqrt_mod(y2);
        if ((y & 1n) === 1n) {
            y = mod(-y);
        }
        const p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    static fromCompressedHex(bytes) {
        if (bytes.length !== 33) {
            throw new Error("Compressed pubkey must be 33 bytes");
        }
        const x = bytes_to_number(bytes.slice(1)),
            y2 = weierstrass(x);
        let y = sqrt_mod(y2);
        const odd = (y & 1n) === 1n,
            isFirstByteOdd = (bytes[0] & 1) === 1;
        if (odd !== isFirstByteOdd) {
            y = mod(-y);
        }
        const p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    static fromUncompressedHex(bytes) {
        if (bytes.length !== 65) {
            throw new Error("Uncompressed pubkey must be 65 bytes");
        }
        const x = bytes_to_number(bytes.slice(1, 33)),
            y = bytes_to_number(bytes.slice(33)),
            p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    assertValidity() {
        const {
            x,
            y
        } = this;
        if (x < 0n || x >= CURVE.P || y < 0n || y >= CURVE.P) {
            throw new Error("Point is not on curve (coordinates out of range)");
        }
        const left = mod(y * y),
            right = weierstrass(x);
        if (left !== right) {
            throw new Error("Point is not on curve (y^2 != x^3 + 7)");
        }
    }

    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiplyUnsafe(scalar).toAffine();
    }

    add(other) {
        const pA = JacobianPoint.fromAffine(this),
            pB = JacobianPoint.fromAffine(other);
        return pA.add(pB).toAffine();
    }

    negate() {
        return new Point(this.x, mod(-this.y));
    }

    toHex(compressed = false) {
        const xHex = pad64(this.x);
        if (compressed) {
            const prefix = (this.y & 1n) === 1n ? "03" : "02";
            return prefix + xHex;
        } else {
            const yHex = pad64(this.y);
            return "04" + xHex + yHex;
        }
    }

    static get BASE() {
        return new Point(CURVE.Gx, CURVE.Gy);
    }

    static get ZERO() {
        return new Point(0n, 0n);
    }
}

// Precomputed constant for sqrt_mod
const P_1_4 = (CURVE.P + 1n) >> 2n;

// Calculates modular square root using simplified Tonelli-Shanks for p ≡ 3 (mod 4)
function sqrt_mod(x) {
    return pow_mod(x, P_1_4, CURVE.P);
}

// Computes modular exponentiation using square-and-multiply algorithm
function pow_mod(base, exponent, modulus) {
    let result = 1n,
        b = mod(base, modulus),
        e = exponent;
    while (e > 0n) {
        if (e & 1n) result = mod(result * b, modulus);
        b = mod(b * b, modulus);
        e >>= 1n;
    }
    return result;
}

// Validates and normalizes private key to BigInt within curve order range
function normalize_privatekey(privateKey) {
    let key = null;
    if (typeof privateKey === "bigint") {
        key = privateKey;
    } else if (typeof privateKey === "string") {
        key = hex_to_number(privateKey);
    } else if (privateKey instanceof Uint8Array) {
        key = bytes_to_number(privateKey);
    } else {
        throw new Error("Invalid private key type");
    }
    key = key % CURVE.n;
    if (key <= 0n || key >= CURVE.n) {
        throw new Error("Invalid private key range");
    }
    return key;
}

// Derives compressed or uncompressed public key from private key scalar
function get_publickey(privateKey, isCompressed = true) {
    const P = Point.fromPrivateKey(privateKey);
    return P.toHex(isCompressed);
}

// Export the main Point class
secp.Point = Point;

// ============================================
// HASH FUNCTIONS
// ============================================

// Generates HMAC using SJCL with optional hex encoding
function hmac_bits(message, key, encode) {
    const enc_msg = (encode == "hex") ? hex_to_bits(message) : message,
        hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return from_bits(hmac.encrypt(enc_msg));
}

// Computes HMAC-SHA hash with optional key encoding
function hmacsha(key, hash, encode) {
    const enc_key = (encode == "hex") ? hex_to_bits(key) : key;
    return from_bits(hmacsha_bits(enc_key, hash));
}

// Performs HMAC-SHA hash computation on input key
function hmacsha_bits(key, hash) {
    return sjcl.hash[hash].hash(key);
}

// Computes double hash: RIPEMD160(SHA256(input))
function hash160(pub) {
    return hmacsha(hmacsha(pub, "sha256", "hex"), "ripemd160", "hex");
}

// Computes a substring of SHA256 hash
function sha_sub(val, lim) {
    return hmacsha(val, "sha256").slice(0, lim);
}

// Keccak-256 hash function (used for Ethereum addresses)
function keccak_256(input) {
    const rc = [
        1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648,
        32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648,
        138, 0, 136, 0, 2147516425, 0, 2147483658, 0,
        2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648,
        32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
        2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648
    ];

    function keccak_f(s) {
        let c = [],
            b = [],
            h, l;
        for (let n = 0; n < 48; n += 2) {
            for (let x = 0; x < 10; x++) {
                c[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
            }
            for (let x = 0; x < 10; x += 2) {
                h = c[(x + 8) % 10] ^ (c[(x + 2) % 10] << 1 | c[(x + 3) % 10] >>> 31);
                l = c[(x + 9) % 10] ^ (c[(x + 3) % 10] << 1 | c[(x + 2) % 10] >>> 31);
                for (let y = 0; y < 50; y += 10) {
                    s[x + y] ^= h;
                    s[x + y + 1] ^= l;
                }
            }
            b[0] = s[0];
            b[1] = s[1];
            b[32] = s[11] << 4 | s[10] >>> 28;
            b[33] = s[10] << 4 | s[11] >>> 28;
            b[14] = s[20] << 3 | s[21] >>> 29;
            b[15] = s[21] << 3 | s[20] >>> 29;
            b[46] = s[31] << 9 | s[30] >>> 23;
            b[47] = s[30] << 9 | s[31] >>> 23;
            b[28] = s[40] << 18 | s[41] >>> 14;
            b[29] = s[41] << 18 | s[40] >>> 14;
            b[20] = s[2] << 1 | s[3] >>> 31;
            b[21] = s[3] << 1 | s[2] >>> 31;
            b[2] = s[13] << 12 | s[12] >>> 20;
            b[3] = s[12] << 12 | s[13] >>> 20;
            b[34] = s[22] << 10 | s[23] >>> 22;
            b[35] = s[23] << 10 | s[22] >>> 22;
            b[16] = s[33] << 13 | s[32] >>> 19;
            b[17] = s[32] << 13 | s[33] >>> 19;
            b[48] = s[42] << 2 | s[43] >>> 30;
            b[49] = s[43] << 2 | s[42] >>> 30;
            b[40] = s[5] << 30 | s[4] >>> 2;
            b[41] = s[4] << 30 | s[5] >>> 2;
            b[22] = s[14] << 6 | s[15] >>> 26;
            b[23] = s[15] << 6 | s[14] >>> 26;
            b[4] = s[25] << 11 | s[24] >>> 21;
            b[5] = s[24] << 11 | s[25] >>> 21;
            b[36] = s[34] << 15 | s[35] >>> 17;
            b[37] = s[35] << 15 | s[34] >>> 17;
            b[18] = s[45] << 29 | s[44] >>> 3;
            b[19] = s[44] << 29 | s[45] >>> 3;
            b[10] = s[6] << 28 | s[7] >>> 4;
            b[11] = s[7] << 28 | s[6] >>> 4;
            b[42] = s[17] << 23 | s[16] >>> 9;
            b[43] = s[16] << 23 | s[17] >>> 9;
            b[24] = s[26] << 25 | s[27] >>> 7;
            b[25] = s[27] << 25 | s[26] >>> 7;
            b[6] = s[36] << 21 | s[37] >>> 11;
            b[7] = s[37] << 21 | s[36] >>> 11;
            b[38] = s[47] << 24 | s[46] >>> 8;
            b[39] = s[46] << 24 | s[47] >>> 8;
            b[30] = s[8] << 27 | s[9] >>> 5;
            b[31] = s[9] << 27 | s[8] >>> 5;
            b[12] = s[18] << 20 | s[19] >>> 12;
            b[13] = s[19] << 20 | s[18] >>> 12;
            b[44] = s[29] << 7 | s[28] >>> 25;
            b[45] = s[28] << 7 | s[29] >>> 25;
            b[26] = s[38] << 8 | s[39] >>> 24;
            b[27] = s[39] << 8 | s[38] >>> 24;
            b[8] = s[48] << 14 | s[49] >>> 18;
            b[9] = s[49] << 14 | s[48] >>> 18;
            for (let y = 0; y < 50; y += 10) {
                for (let x = 0; x < 10; x += 2) {
                    s[y + x] = b[y + x] ^ (~b[y + (x + 2) % 10] & b[y + (x + 4) % 10]);
                    s[y + x + 1] = b[y + x + 1] ^ (~b[y + (x + 3) % 10] & b[y + (x + 5) % 10]);
                }
            }
            s[0] ^= rc[n];
            s[1] ^= rc[n + 1];
        }
    }

    let bytes;
    if (typeof input === "string") {
        bytes = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i);
    } else if (input instanceof Uint8Array) {
        bytes = input;
    } else if (Array.isArray(input)) {
        bytes = new Uint8Array(input);
    } else {
        throw new Error("Invalid input type for keccak256");
    }

    const rate = 136,
        block_count = 34,
        s = new Array(50).fill(0),
        blocks = new Array(35).fill(0);
    let i = 0;

    for (let pos = 0; pos < bytes.length; pos++) {
        blocks[i >> 2] |= bytes[pos] << ((i & 3) << 3);
        if (++i >= rate) {
            for (let j = 0; j < block_count; j++) {
                s[j] ^= blocks[j];
                blocks[j] = 0;
            }
            keccak_f(s);
            i = 0;
        }
    }

    blocks[i >> 2] |= 1 << ((i & 3) << 3);
    blocks[block_count - 1] |= 0x80000000;
    for (let j = 0; j < block_count; j++) s[j] ^= blocks[j];
    keccak_f(s);

    let hex = "";
    for (let i = 0; i < 32; i++) {
        const byte = (s[i >> 2] >> ((i & 3) << 3)) & 0xff;
        hex += (byte >> 4).toString(16) + (byte & 0xf).toString(16);
    }
    return hex;
}

// ============================================
// KEY & ADDRESS GENERATION
// ============================================

// Encodes private key to Wallet Import Format (WIF) with optional compression
function privkey_wif(versionbytes, hexkey, comp) {
    const compressed = (comp) ? "01" : "";
    return b58check_encode(versionbytes + hexkey + compressed);
}

// Generates corresponding public key from a private key
function priv_to_pub(priv) {
    return get_publickey(priv, true);
}

// Converts compressed public key to full uncompressed format
function expand_pub(pub) {
    return secp.Point.fromHex(pub).toHex(false);
}

// Generates standard cryptocurrency address from public key
function pub_to_address(versionbytes, pub) {
    return hash160_to_address(versionbytes, hash160(pub));
}

// Derives Ethereum-specific address from public key
function pub_to_eth_address(pub) {
    const xp_pub = expand_pub(pub),
        keccak = "0x" + keccak_256(hex_to_bytes(xp_pub.slice(2))),
        addr = "0x" + keccak.slice(26);
    return to_checksum_address(addr);
}

// Converts RIPEMD160 hash to a cryptocurrency address
function hash160_to_address(versionbytes, h160) {
    return b58check_encode(versionbytes + h160);
}

// Converts an Ethereum address to checksum format
function to_checksum_address(e) {
    if (void 0 === e) {
        return "";
    }
    if (!/^(0x)?[0-9a-f]{40}$/i.test(e)) {
        throw new Error("Given address " + e + " is not a valid Ethereum address.");
        return
    }
    e = e.toLowerCase().replace(/^0x/i, "");
    for (var t = keccak_256(e).replace(/^0x/i, ""), r = "0x", n = 0; n < e.length; n++)
        7 < parseInt(t[n], 16) ? r += e[n].toUpperCase() : r += e[n];
    return r;
}

// ============================================
// BITCOIN CASH (CASHADDR)
// ============================================

const cashaddr = (function() {
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const CHARSET_MAP = {};
    for (let i = 0; i < CHARSET.length; i++) {
        CHARSET_MAP[CHARSET[i]] = i;
    }

    function polymod(values) {
        const GENERATORS = [
            0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n,
            0xae2eabe2a8n, 0x1e4f43e470n
        ];
        let chk = 1n;
        for (let i = 0; i < values.length; i++) {
            const top = chk >> 35n;
            chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(values[i]);
            for (let j = 0; j < 5; j++) {
                if ((top >> BigInt(j)) & 1n) {
                    chk ^= GENERATORS[j];
                }
            }
        }
        return chk ^ 1n;
    }

    function prefixToArray(prefix) {
        const result = new Uint8Array(prefix.length + 1);
        for (let i = 0; i < prefix.length; i++) {
            result[i] = prefix.charCodeAt(i) & 31;
        }
        result[prefix.length] = 0;
        return result;
    }

    function convertBits(data, fromBits, toBits, pad) {
        let acc = 0,
            bits = 0;
        const result = [],
            maxv = (1 << toBits) - 1;
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            acc = (acc << fromBits) | value;
            bits += fromBits;
            while (bits >= toBits) {
                bits -= toBits;
                result.push((acc >> bits) & maxv);
            }
        }
        if (pad) {
            if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
        } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
            throw new Error("Invalid padding");
        }
        return new Uint8Array(result);
    }

    function createChecksum(prefix, payload) {
        const prefixArray = prefixToArray(prefix),
            combined = new Uint8Array(prefixArray.length + payload.length + 8);
        combined.set(prefixArray);
        combined.set(payload, prefixArray.length);
        const mod = polymod(combined),
            checksum = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            checksum[7 - i] = Number((mod >> BigInt(i * 5)) & 31n);
        }
        return checksum;
    }

    function verifyChecksum(prefix, payload) {
        const prefixArray = prefixToArray(prefix),
            combined = new Uint8Array(prefixArray.length + payload.length);
        combined.set(prefixArray);
        combined.set(payload, prefixArray.length);
        return polymod(combined) === 0n;
    }

    function getHashSize(versionByte) {
        return [160, 192, 224, 256, 320, 384, 448, 512][versionByte & 7];
    }

    function getType(versionByte) {
        const typeValue = versionByte & 120;
        if (typeValue === 0) return "P2PKH";
        if (typeValue === 8) return "P2SH";
        throw new Error("Invalid address type");
    }

    return {
        "encode": function(prefix, type, hash) {
            let versionByte = (type === "P2PKH") ? 0 : (type === "P2SH") ? 8 : null;
            if (versionByte === null) throw new Error("Invalid type: " + type);

            const hashBits = hash.length * 8,
                sizeMap = {
                    160: 0,
                    192: 1,
                    224: 2,
                    256: 3,
                    320: 4,
                    384: 5,
                    448: 6,
                    512: 7
                };
            if (!(hashBits in sizeMap)) throw new Error("Invalid hash size");
            versionByte |= sizeMap[hashBits];

            const versionAndHash = new Uint8Array(hash.length + 1);
            versionAndHash[0] = versionByte;
            versionAndHash.set(hash, 1);

            const payload = convertBits(versionAndHash, 8, 5, true),
                checksum = createChecksum(prefix, payload),
                combined = new Uint8Array(payload.length + checksum.length);
            combined.set(payload);
            combined.set(checksum, payload.length);

            let result = prefix + ":";
            for (let i = 0; i < combined.length; i++) {
                result += CHARSET[combined[i]];
            }
            return result;
        },

        "decode": function(address) {
            const lower = address.toLowerCase();
            if (address !== lower && address !== address.toUpperCase()) {
                throw new Error("Mixed case address");
            }
            const parts = lower.split(":");
            if (parts.length !== 2) throw new Error("Missing prefix");

            const prefix = parts[0],
                payloadStr = parts[1],
                payload = new Uint8Array(payloadStr.length);
            for (let i = 0; i < payloadStr.length; i++) {
                const char = payloadStr[i];
                if (!(char in CHARSET_MAP)) throw new Error("Invalid character: " + char);
                payload[i] = CHARSET_MAP[char];
            }

            if (!verifyChecksum(prefix, payload)) throw new Error("Invalid checksum");

            const data = payload.slice(0, -8),
                converted = convertBits(data, 5, 8, false),
                versionByte = converted[0],
                hash = converted.slice(1);

            if (hash.length * 8 !== getHashSize(versionByte)) {
                throw new Error("Invalid hash size");
            }

            return {
                prefix,
                type: getType(versionByte),
                hash
            };
        }
    };
})();

// Converts a legacy Bitcoin Cash address to CashAddr format
function pub_to_cashaddr(legacy) {
    const c_addr = bch_cashaddr("bitcoincash", "P2PKH", legacy);
    return c_addr.split(":")[1];
}

// Converts a CashAddr format address to legacy Bitcoin Cash address
function bch_legacy(cadr) {
    try {
        const address = (cadr.indexOf(":") === -1) ? "bitcoincash:" + cadr : cadr,
            version = 0,
            dec = cashaddr.decode(address),
            bytes = dec.hash,
            bytesarr = Array.from(bytes),
            conc = concat_array([0], bytesarr),
            unbuf = buf2hex(conc);
        return b58check_encode(unbuf);
    } catch (e) {
        return cadr
    }
}

// Converts a legacy Bitcoin Cash address to CashAddr format
function bch_cashaddr(prefix, type, legacy) {
    try {
        const lbytes = b58dec_uint_array(legacy),
            lbslice = lbytes.slice(1, 21);
        return cashaddr.encode(prefix, type, lbslice);
    } catch (e) {
        console.error(e.name, e.message);
        return legacy
    }
}

// ============================================
// LNURL & LIGHTNING
// ============================================

// Decodes a Bech32 encoded LNURL
function lnurl_decodeb32(lnurl) {
    let p,
        has_lower = false,
        has_upper = false;
    for (p = 0; p < lnurl.length; ++p) {
        if (lnurl.charCodeAt(p) < 33 || lnurl.charCodeAt(p) > 126) {
            return null;
        }
        if (lnurl.charCodeAt(p) >= 97 && lnurl.charCodeAt(p) <= 122) {
            has_lower = true;
        }
        if (lnurl.charCodeAt(p) >= 65 && lnurl.charCodeAt(p) <= 90) {
            has_upper = true;
        }
    }
    if (has_lower && has_upper) {
        return null;
    }
    const lnurlow = lnurl.toLowerCase(),
        pos = lnurlow.lastIndexOf("1"),
        hrp = lnurlow.substring(0, pos),
        data = [];
    for (p = pos + 1; p < lnurlow.length; ++p) {
        const d = b32ab.indexOf(lnurlow.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }
    if (!verify_checksum(hrp, data)) {
        return null;
    }
    return {
        "hrp": hrp,
        "data": data.slice(0, data.length - 6)
    };
}

// ============================================
// MNEMONIC FUNCTIONS
// ============================================

// Cleans and normalizes mnemonic string
function clean_string(words) {
    return normalize_string(join_words(split_words(words)));
}

// Concatenates word array with single space delimiter
function join_words(words) {
    return words.join(" ");
}

// Splits string on whitespace and removes empty elements
function split_words(mnemonic) {
    return mnemonic.split(/\s/g).filter(function(x) {
        return x.length;
    });
}

// Applies Unicode NFKD normalization to string
function normalize_string(str) {
    return str.normalize("NFKD");
}

// Converts BIP39 mnemonic to binary string with 11-bit word indices
function mnemonic_to_binary_string(mnemonic) {
    const mm = split_words(mnemonic);
    if (mm.length == 0 || mm.length % 3 > 0) {
        return null;
    }
    const idx = [];
    for (let i = 0; i < mm.length; i++) {
        const word = mm[i],
            wordIndex = wordlist.indexOf(word);
        if (wordIndex == -1) {
            return null;
        }
        const binaryIndex = pad_binary(wordIndex.toString(2), 11);
        idx.push(binaryIndex);
    }
    return idx.join("");
}

// ============================================
// ENCRYPTION
// ============================================

// Encrypts data using AES-GCM
function aes_enc(params, keyString) {
    const buffer = uint_8array(16),
        iv = byte_array_to_word_array(crypto.getRandomValues(buffer)),
        key = sjcl.codec.base64.toBits(keyString),
        cipher = new sjcl.cipher.aes(key),
        data = to_bits(params),
        enc = sjcl.mode.gcm.encrypt(cipher, data, iv, {}, 128),
        concatbitArray = concat_array(iv, enc),
        conString = sjcl.codec.base64.fromBits(concatbitArray);
    return conString;
}

// Decrypts AES-GCM encrypted data
function aes_dec(content, keyst) {
    const bitArray = sjcl.codec.base64.toBits(content),
        bitArrayCopy = bitArray.slice(0),
        ivdec = bitArrayCopy.slice(0, 4),
        encryptedBitArray = bitArray.slice(4),
        key = sjcl.codec.base64.toBits(keyst),
        cipher = new sjcl.cipher.aes(key);
    try {
        const data = sjcl.mode.gcm.decrypt(cipher, encryptedBitArray, ivdec, {}, 128);
        return sjcl.codec.utf8String.fromBits(data);
    } catch (err) {
        console.error(err.name, err.message);
        return false
    }
}

// ============================================
// MISCELLANEOUS
// ============================================

// Encodes a Nimiq transaction hash for use with Nimiq.watch
function nimiq_hash(tx) {
    return encodeURIComponent(btoa(tx.match(/\w{2}/g).map(function(a) {
        return String.fromCharCode(parseInt(a, 16));
    }).join("")));
}

// ============================================
// SCRIPTHASH
// ============================================

// Convert address to scripthash, with support for Bitcoin Cash addresses
function address_to_scripthash(addr, currency) {
    const address = (currency === "bitcoin-cash") ? bch_legacy(addr) : addr;
    let script_pub_key;

    if (address.startsWith("bc1") || address.startsWith("tb1") || address.startsWith("ltc1")) {
        try {
            const decoded = bech32_decode(address);
            if (!decoded) throw new Error("Invalid bech32 address");
            const program = convert5to8(decoded.data.slice(1));
            if (!program) throw new Error("Invalid witness program");
            if (decoded.data[0] === 1) {
                if (program.length !== 32) {
                    throw new Error("Invalid Taproot program length: " + program.length);
                }
                script_pub_key = "5120" + program.map(function(b) {
                    return b.toString(16).padStart(2, "0");
                }).join("");
            } else if (decoded.data[0] === 0) {
                if (program.length === 20) {
                    script_pub_key = "0014" + program.map(function(b) {
                        return b.toString(16).padStart(2, "0");
                    }).join("");
                } else if (program.length === 32) {
                    script_pub_key = "0020" + program.map(function(b) {
                        return b.toString(16).padStart(2, "0");
                    }).join("");
                } else {
                    throw new Error("Invalid witness program length: " + program.length);
                }
            } else {
                throw new Error("Unsupported witness version");
            }
        } catch (error) {
            throw new Error("Invalid bech32 address: " + error.message);
        }
    } else {
        try {
            const decoded = b58check_decode(address),
                version = decoded.slice(0, 2),
                hash = decoded.slice(2);

            if (version === "00" || version === "30") {
                script_pub_key = "76a914" + hash + "88ac";
            } else if (version === "05" || version === "32") {
                script_pub_key = "a914" + hash + "87";
            } else {
                throw new Error("Unsupported address version: " + version);
            }
        } catch (error) {
            throw new Error("Invalid base58 address: " + error.message);
        }
    }

    const script_hash = hmacsha(script_pub_key, "sha256", "hex");
    return {
        "script_pub_key": script_pub_key,
        "hash": script_hash.match(/.{2}/g).reverse().join("")
    }
}

// Helper function for converting groups of 5 bits to 8 bits
function convert5to8(data) {
    const acc = new Array(Math.floor(data.length * 5 / 8));
    let index = 0,
        bits = 0,
        value = 0;
    for (let i = 0; i < data.length; ++i) {
        value = (value << 5) | data[i];
        bits += 5;
        while (bits >= 8) {
            bits -= 8;
            acc[index] = (value >> bits) & 0xff;
            index += 1;
        }
    }
    if (bits >= 5 || ((value << (8 - bits)) & 0xff)) {
        return null;
    }
    return acc;
}

// ============================================
// MODULE EXPORT
// ============================================

const CryptoUtils = {
    // Library info
    VERSION: "1.1.0",

    // Curve parameters
    secp,
    CURVE: CURVE,

    // === Core Helpers ===
    uint_8array,
    buffer,
    unbuffer,
    buf2hex,
    is_hex,
    str_pad,
    dec_to_hex,
    hex_to_dec,
    hex_to_number_string,
    hex_to_int,
    pad_binary,
    pad64,
    concat_bytes,
    encode_varint,

    // === SJCL Bit Operations ===
    to_bits,
    hex_to_bits,
    from_bits,
    bit_length,
    concat_array,

    // === String Utilities ===
    clean_string,
    normalize_string,
    split_words,
    join_words,

    // === Base Conversion ===
    binary_string_to_word_array,
    byte_array_to_word_array,
    byte_array_to_binary_string,
    hex_string_to_binary_string,
    mnemonic_to_binary_string,

    // === Base58 ===
    b58enc,
    b58enc_uint_array,
    b58dec,
    b58dec_uint_array,
    b58check_encode,
    b58check_decode,

    // === Bech32 ===
    to_words,
    from_words,
    convert_bits,
    polymod,
    hrp_expand,
    verify_checksum,
    verify_checksum_with_type,
    create_checksum,
    bech32_encode,
    bech32_decode,
    bech32_dec_array,
    lnurl_decodeb32,

    // === Byte/Hex Conversion ===
    hex_to_bytes,
    bytes_to_hex,
    hex_to_number,
    bytes_to_number,

    // === Elliptic Curve (secp256k1) ===
    mod,
    weierstrass,
    egcd,
    invert,
    pow_mod,
    sqrt_mod,

    // === Key Operations ===
    normalize_privatekey,
    get_publickey,
    priv_to_pub,
    privkey_wif,
    expand_pub,

    // === Hashing ===
    hmacsha,
    hmac_bits,
    hmacsha_bits,
    sha_sub,
    keccak_256,
    hash160,
    nimiq_hash,

    // === Address Generation ===
    pub_to_address,
    pub_to_address_bech32,
    hash160_to_address,
    pub_to_eth_address,
    to_checksum_address,

    // === Bitcoin Cash ===
    pub_to_cashaddr,
    bch_cashaddr,
    bch_legacy,

    // === Encryption ===
    aes_enc,
    aes_dec,

    // === Validation ===
    address_to_scripthash,
    convert5to8
};