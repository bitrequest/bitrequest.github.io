/**
 * Bip39Utils - Standalone BIP39/BIP32 Cryptocurrency Utilities Library
 * 
 * STANDALONE USAGE (outside Bitrequest):
 * ----------------------------------------
 * <script src="assets_js_lib_sjcl.js"></script>
 * <script src="assets_js_lib_crypto_utils.js"></script>
 * <script src="assets_js_lib_bip39_utils.js"></script>
 * <script>
 *   const mnemonic = Bip39Utils.generate_mnemonic(12);
 *   const seed = Bip39Utils.mnemonic_to_seed(mnemonic);
 *   const keys = Bip39Utils.derive_x(params);
 * </script>
 * 
 * FEATURES:
 * - BIP39 mnemonic generation and validation
 * - BIP32 hierarchical deterministic key derivation
 * - Extended public/private key encoding
 * - Multi-currency address generation
 * - Support for Bitcoin, Litecoin, Ethereum, Dogecoin, Dash, Bitcoin Cash
 * 
 * DEPENDENCIES:
 * - sjcl.js
 * - crypto_utils.js
 * 
 * @version 1.1.0
 * @license AGPL-3.0
 * @see https://github.com/bitrequest/bitrequest.github.io
 */

// ============================================
// BIP32 CONFIGURATION
// ============================================

// Default BIP32 configurations for supported cryptocurrencies
const bip32_configs = {
    "bitcoin": {
        "root_path": "m/84'/0'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "pubz": 78792518,
            "privx": 76066276,
            "privz": 78791436
        },
        "pk_vbytes": {
            "wif": 128
        }
    },
    "litecoin": {
        "root_path": "m/84'/2'/0'/0/",
        "prefix": {
            "pub": 48,
            "pubx": 27108450,
            "pubz": 78792518,
            "privx": 27106558,
            "privz": 78791436
        },
        "pk_vbytes": {
            "wif": 176
        }
    },
    "dogecoin": {
        "root_path": "m/44'/3'/0'/0/",
        "prefix": {
            "pub": 30,
            "pubx": 49990397,
            "privx": 49988504
        },
        "pk_vbytes": {
            "wif": 158
        }
    },
    "dash": {
        "root_path": "m/44'/5'/0'/0/",
        "prefix": {
            "pub": 76,
            "pubx": 76067358,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 204
        }
    },
    "ethereum": {
        "root_path": "m/44'/60'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 128
        }
    },
    "bitcoin-cash": {
        "root_path": "m/44'/145'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 128
        }
    }
};

// ============================================
// CONSTANTS / TEST VECTORS
// bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
// "army van defense carry jealous true garbage claim echo media make crunch"
// ============================================

const bip39_utils_test_vectors = {
        "version": "1.1.0",
        "test_phrase": "army van defense carry jealous true garbage claim echo media make crunch",
        "expected_seed": "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570",
        "expected_address": "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm",
        "test_xpub": "xpub6Cy7dUR4ZKF22HEuVq7epRgRsoXfL2MK1RE81CSvp1ZySySoYGXk5PUY9y9Cc5ExpnSwXyimQAsVhyyPDNDrfj4xjDsKZJNYgsHXoEPNCYQ"
    },
    wordlist = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

// ============================================
// MNEMONIC GENERATION & VALIDATION
// ============================================

// Constructor for HMAC SHA-512 encryptor used in PBKDF2
function hmac_encrypt(key) {
    const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hmac.encrypt.apply(hmac, arguments);
    };
}

// Converts mnemonic phrase to 512-bit seed using PBKDF2 with 2048 iterations
function mnemonic_to_seed(mnemonic, passphrase) {
    const seed_params = parse_seed(mnemonic, passphrase);
    return from_bits(sjcl.misc.pbkdf2(seed_params.mnemonic, seed_params.passphrase, 2048, 512, hmac_encrypt));
}

// Normalizes mnemonic and passphrase for seed generation
function parse_seed(mnemonic, input_passphrase) {
    const empty_passphrase = input_passphrase || "",
        clean_mnemonic = clean_string(mnemonic),
        norm_passphrase = normalize_string(empty_passphrase),
        salt_prefix = "mnemonic" + norm_passphrase;
    return {
        "mnemonic": to_bits(clean_mnemonic),
        "passphrase": to_bits(salt_prefix)
    }
}

// Generates random BIP39 mnemonic phrase
function generate_mnemonic(word_count) {
    const entropy_bits = word_count / 3 * 32,
        random_bytes = uint_8array(entropy_bits / 8),
        entropy_data = crypto.getRandomValues(random_bytes);
    return to_mnemonic(entropy_data);
}

// Converts entropy bytes to mnemonic phrase using BIP39 wordlist
function to_mnemonic(byte_array) {
    if (byte_array.length % 4 > 0) {
        throw "Data length in bits should be divisible by 32, but it is not (" + byte_array.length + " bytes = " + byte_array.length * 8 + " bits)."
    }
    const word_array = byte_array_to_word_array(byte_array),
        checksum = hmacsha(word_array, "sha256"),
        entropy_bits = byte_array_to_binary_string(byte_array),
        checksum_bits = pad_binary(hex_string_to_binary_string(checksum), 256),
        checksum_length = byte_array.length * 8 / 32,
        full_bits = entropy_bits + checksum_bits.substring(0, checksum_length),
        word_list = [],
        word_count = full_bits.length / 11;
    for (let i = 0; i < word_count; i++) {
        const word_index = parseInt(full_bits.substring(i * 11, (i + 1) * 11), 2);
        word_list.push(wordlist[word_index]);
    }
    return join_words(word_list);
}

// Validates BIP39 mnemonic checksum using SHA256
function validate_mnemonic(mnemonic) {
    const binary_str = mnemonic_to_binary_string(mnemonic);
    if (binary_str === null) {
        return false
    }
    const str_len = binary_str.length,
        data_bits = binary_str.substring(0, str_len / 33 * 32),
        hash_bits = binary_str.substring(str_len - str_len / 33, str_len),
        data_array = binary_string_to_word_array(data_bits),
        hash_result = sjcl.hash.sha256.hash(data_array),
        hash_hex = from_bits(hash_result),
        hash_binary = pad_binary(hex_string_to_binary_string(hash_hex), 256),
        calc_hash = hash_binary.substring(0, str_len / 33);
    return hash_bits === calc_hash;
}

// Returns first word from input array not found in BIP39 wordlist
function find_invalid_word(word_list) {
    for (let i = 0; i < word_list.length; i++) {
        if (wordlist.indexOf(word_list[i]) === -1) {
            return word_list[i];
        }
    }
    return undefined;
}

// ============================================
// BIP32 KEY DERIVATION
// ============================================

// Generates master root key from seed using HMAC-SHA512 with "Bitcoin seed"
function get_rootkey(seed) {
    return hmac_bits(seed, to_bits("Bitcoin seed"), "hex");
}

// Parses Base58Check encoded extended key into component parts
function objectify_extended(extended_key) {
    const version = extended_key.slice(0, 8),
        depth = extended_key.slice(8, 10),
        fingerprint = extended_key.slice(10, 18),
        childnumber = extended_key.slice(18, 26),
        chaincode = extended_key.slice(26, 90),
        key = extended_key.slice(90, 156),
        remain = extended_key.slice(156);
    return {
        version,
        depth,
        fingerprint,
        childnumber,
        chaincode,
        key,
        remain
    };
}

// Performs BIP32 hierarchical deterministic key derivation
function derive_x(derive_params, from_private) {
    const path = derive_params.dpath,
        path_segments = path.split("/"),
        depth = path_segments.length - 1;
    let derived_data = {},
        current_key = derive_params.key,
        current_chain = derive_params.cc,
        is_public = false,
        path_purpose = null;
    for (let i = 0; i < path_segments.length; i++) {
        const segment = path_segments[i];
        if (i === 0) {
            if (segment === "m") {
                is_public = false;
            } else if (segment === "M") {
                is_public = true;
                if (from_private === true) {
                    current_key = get_publickey(current_key);
                }
            } else {
                return false;
            }
        }
        if (i > 0) {
            const is_hardened = is_public === false && segment.indexOf("'") >= 0,
                index_str = is_hardened ? segment.split("'")[0] : segment,
                index_num = parseInt(index_str, 10),
                child_index = is_hardened ? dec_to_hex(index_num + 2147483648) : str_pad(dec_to_hex(index_num), 8),
                child_keys = derive_child_key(current_key, current_chain, child_index, is_public, is_hardened);
            if (i === 1) {
                path_purpose = segment;
            }
            if (i === depth) {
                child_keys.purpose = path_purpose;
                child_keys.depth = i;
                child_keys.childnumber = child_index;
                child_keys.xpub = is_public;
                derived_data = child_keys;
            } else {
                current_key = child_keys.key;
                current_chain = child_keys.chaincode;
            }
        }
    }
    if (is_public === true) {
        derived_data.vb = derive_params.vb;
    }
    return derived_data;
}

// Derives child key using BIP32 algorithm
function derive_child_key(parent_key, chain_code, child_index, is_public, is_hardened) {
    const derived_keys = {},
        parent_pubkey = is_public ? parent_key : get_publickey(parent_key),
        pub_hash = hash160(parent_pubkey),
        parent_fp = pub_hash.slice(0, 8),
        input_key = is_public ? parent_pubkey : (is_hardened ? "00" + parent_key : parent_pubkey),
        hmac_result = hmac_bits(input_key + child_index, hex_to_bits(chain_code), "hex"),
        child_key = hmac_result.slice(0, 64),
        child_chain = hmac_result.slice(64);
    if (is_public) {
        const key_point = secp.Point.fromPrivateKey(child_key);
        derived_keys.key = secp.Point.fromHex(parent_key).add(key_point).toHex(true);
    } else {
        const child_decimal = (hex_to_dec(parent_key) + hex_to_dec(child_key)) % CURVE.n;
        derived_keys.key = str_pad(child_decimal.toString(16), 64);
    }
    derived_keys.chaincode = child_chain;
    derived_keys.fingerprint = parent_fp;
    return derived_keys;
}

// Extracts key and chaincode from Base58Check encoded xpub/xprv
function key_cc_xpub(xpub) {
    const decoded_key = b58check_decode(xpub),
        key_parts = objectify_extended(decoded_key);
    return {
        "key": key_parts.key,
        "cc": key_parts.chaincode,
        "version": key_parts.version
    }
}

// Generates array of derived key pairs for given index range
function keypair_array(seed, indices, start_index, derive_path, bip32_config, key, chain_code, coin, version) {
    const derived_pairs = [];
    for (let i = 0; i < indices.length; i++) {
        const current_index = i + start_index,
            full_path = derive_path + current_index,
            derive_params = {
                "dpath": full_path,
                "key": key,
                "cc": chain_code,
                "vb": version
            },
            ext_keys_result = derive_x(derive_params),
            formatted_keys = format_keys(seed, ext_keys_result, bip32_config, current_index, coin);
        derived_pairs.push(formatted_keys);
    }
    return derived_pairs;
}

// ============================================
// EXTENDED KEY ENCODING
// ============================================

// Creates extended private and public keys from key object
function ext_keys(key_data, coin) {
    const extended_keys = {},
        ext_payload = b58c_x_payload(key_data, coin),
        private_key = key_data.key;
    extended_keys.xprv = b58check_encode(ext_payload.private);
    extended_keys.xpub = b58check_encode(ext_payload.public);
    return extended_keys;
}

// Creates xpub object from derivation data
function xpub_obj(coin, root_path, chain_code, key) {
    const bip32_config = (typeof coin === "object") ? coin : get_bip32_config(coin),
        pub_version = bip32_config.prefix.pubz || bip32_config.prefix.pubx,
        version = str_pad(dec_to_hex(pub_version), 8),
        depth = "03",
        fingerprint = "00000000",
        childnumber = "80000000",
        xpub_hex = version + depth + fingerprint + childnumber + chain_code + key;
    return {
        "xpub": b58check_encode(xpub_hex),
        version
    }
}

// Constructs Base58Check payload for extended keys
function b58c_x_payload(key_data, coin) {
    const bip32_config = (typeof coin === "object") ? coin : get_bip32_config(coin),
        chain_code = key_data.chaincode,
        private_key = key_data.key,
        public_key = get_publickey(private_key),
        depth = str_pad(dec_to_hex(key_data.depth), 2),
        fingerprint = key_data.fingerprint,
        childnumber = key_data.childnumber,
        priv_version = bip32_config.prefix.privx,
        pub_version = (key_data.purpose === "84'") ? bip32_config.prefix.pubz : bip32_config.prefix.pubx,
        priv_versionh = str_pad(dec_to_hex(priv_version), 8),
        pub_versionh = str_pad(dec_to_hex(pub_version), 8),
        private = priv_versionh + depth + fingerprint + childnumber + chain_code + "00" + private_key,
        public = pub_versionh + depth + fingerprint + childnumber + chain_code + public_key;
    return {
        private,
        public
    }
}

// ============================================
// ADDRESS FORMATTING
// ============================================

// Formats derived keys into address and key pairs for specific coin
function format_keys(seed, key_data, bip32_config, index, coin) {
    const formatted_keys = {},
        purpose = key_data.purpose,
        is_public = key_data.xpub,
        raw_key = key_data.key,
        pubkey = is_public ? raw_key : get_publickey(raw_key),
        version_bytes = str_pad(dec_to_hex(bip32_config.prefix.pub), 2);

    formatted_keys.index = index;

    if (coin === "ethereum") {
        formatted_keys.address = pub_to_eth_address(pubkey);
    } else if (coin === "bitcoin") {
        if (purpose === "84'") {
            formatted_keys.address = pub_to_address_bech32("bc", pubkey);
        } else {
            const version = key_data.vb;
            if (version === "04b24746") {
                formatted_keys.address = pub_to_address_bech32("bc", pubkey);
            } else {
                formatted_keys.address = pub_to_address(version_bytes, pubkey);
            }
        }
    } else if (coin === "litecoin") {
        if (purpose === "84'") {
            formatted_keys.address = pub_to_address_bech32("ltc", pubkey);
        } else {
            const version = key_data.vb;
            if (version === "04b24746") {
                formatted_keys.address = pub_to_address_bech32("ltc", pubkey);
            } else {
                formatted_keys.address = pub_to_address(version_bytes, pubkey);
            }
        }
    } else if (coin === "bitcoin-cash") {
        const legacy_address = pub_to_address(version_bytes, pubkey);
        formatted_keys.address = pub_to_cashaddr(legacy_address);
    } else if (coin === "kaspa") {
        formatted_keys.address = pub_to_kaspa_address(pubkey);
    } else {
        formatted_keys.address = pub_to_address(version_bytes, pubkey);
    }

    formatted_keys.pubkey = coin === "ethereum" ? "0x" + pubkey : pubkey;

    if (is_public === false) {
        if (coin === "ethereum") {
            formatted_keys.privkey = "0x" + raw_key;
        } else {
            const pk_version = bip32_config.pk_vbytes.wif;
            formatted_keys.privkey = privkey_wif(str_pad(dec_to_hex(pk_version), 2), raw_key, true);
        }
    }
    return formatted_keys;
}

// Gets BIP32 configuration for specified currency
function get_bip32_config(coin) {
    return bip32_configs[coin] || false;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Implements Fisher-Yates shuffle algorithm for array randomization
// Used for manual seedphrase verification, Math.random() is sufficient no high entropy needed
// !! Bitrequest always uses Crypto.getRandomValues() for seedphrase entropy, which is cryptographically secure
function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const rand_index = Math.floor(Math.random() * (i + 1));
        [array[i], array[rand_index]] = [array[rand_index], array[i]];
    }
    return array;
}

// ============================================
// COMPATIBILITY TESTING
// ============================================

// Tests mnemonic to seed derivation
function test_seed() {
    try {
        return mnemonic_to_seed(bip39_utils_test_vectors.test_phrase) === bip39_utils_test_vectors.expected_seed;
    } catch (e) {
        console.error("Bip39Utils test_seed:", e.message);
        return false;
    }
}

// Tests BIP44 address derivation
function test_derivation() {
    try {
        const seed = bip39_utils_test_vectors.expected_seed,
            root_key = get_rootkey(seed),
            bip32_config = get_bip32_config("bitcoin"),
            derive_params = {
                "dpath": "m/44'/0'/0'/0/0",
                "key": root_key.slice(0, 64),
                "cc": root_key.slice(64)
            },
            derived_keys = derive_x(derive_params),
            derived_address = format_keys(seed, derived_keys, bip32_config, 0, "bitcoin");
        return derived_address.address === bip39_utils_test_vectors.expected_address;
    } catch (e) {
        console.error("Bip39Utils test_derivation:", e.message);
        return false;
    }
}

// Tests xpub address derivation
function test_xpub_support() {
    try {
        const xpub_data = key_cc_xpub(bip39_utils_test_vectors.test_xpub),
            derive_params = {
                "dpath": "M/0/0",
                "key": xpub_data.key,
                "cc": xpub_data.cc,
                "vb": xpub_data.version
            },
            derived_keys = derive_x(derive_params),
            bip32_config = get_bip32_config("bitcoin"),
            derived_address = format_keys(null, derived_keys, bip32_config, 0, "bitcoin");
        return derived_address.address === bip39_utils_test_vectors.expected_address;
    } catch (e) {
        console.error("Bip39Utils test_xpub:", e.message);
        return false;
    }
}

// Full compatibility test - calls CryptoUtils tests + BIP39 tests
function test_bip39_compatibility() {
    const start_time = typeof performance !== "undefined" ? performance.now() : Date.now(),
        results = {
            "compatible": false,
            "crypto_api": false,
            "bigint": false,
            "secp256k1": false,
            "seed": false,
            "derivation": false,
            "xpub": false,
            "errors": [],
            "timing_ms": 0
        };

    // Fail fast: Check crypto basics from CryptoUtils
    results.crypto_api = CryptoUtils.test_crypto_api();
    if (!results.crypto_api) {
        results.errors.push("crypto API not available");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("Bip39Utils: Compatibility test failed", results.errors);
        return results;
    }

    results.bigint = CryptoUtils.test_bigint();
    if (!results.bigint) {
        results.errors.push("BigInt not functional");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("Bip39Utils: Compatibility test failed", results.errors);
        return results;
    }

    // Test secp256k1 (required for key derivation)
    results.secp256k1 = CryptoUtils.test_secp256k1();
    if (!results.secp256k1) {
        results.errors.push("secp256k1 failed");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("Bip39Utils: Compatibility test failed", results.errors);
        return results;
    }

    // Test seed derivation
    results.seed = test_seed();
    if (!results.seed) {
        results.errors.push("seed derivation failed");
        results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
        console.error("Bip39Utils: Compatibility test failed", results.errors);
        return results;
    }

    // Test BIP44 address derivation
    results.derivation = test_derivation();
    if (!results.derivation) {
        results.errors.push("address derivation failed");
    }

    // Test xpub derivation
    results.xpub = test_xpub_support();
    if (!results.xpub) {
        results.errors.push("xpub derivation failed");
    }
    results.compatible = results.seed && results.derivation;
    results.timing_ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start_time;
    if (results.errors.length > 0) {
        console.error("Bip39Utils: Compatibility test failed", results.errors);
    }
    return results;
}

// Tests Complete Nimiq key derivation
function test_nimiq_derivation() {
    const address = derive_nimiq_account(bip39_utils_test_vectors.expected_seed, 0).address;
    return address === crypto_utils_const.test_address_nimiq;
}

// Tests Complete Nano key derivation
function test_nano_derivation() {
    const address = derive_nano_account(bip39_utils_test_vectors.expected_seed, 0).address;
    return address === crypto_utils_const.test_address_nano;
}

// ============================================
// SLIP-0010 DERIVATION (Ed25519)
// Reuses existing hmac_bits() from crypto_utils
// ============================================

// SLIP-0010 master key from BIP39 seed hex
// Same as get_rootkey() but with "ed25519 seed" key
function slip0010_master(seed_hex) {
    return hmac_bits(seed_hex, to_bits("ed25519 seed"), "hex");
}

// SLIP-0010 hardened child derivation
// Ed25519 only supports hardened (no EC point addition)
function slip0010_child(parent_key, parent_chain, index) {
    const hardened_index = str_pad(dec_to_hex(index + 0x80000000), 8),
        data = "00" + parent_key + hardened_index;
    return hmac_bits(data, hex_to_bits(parent_chain), "hex");
}

// Full SLIP-0010 path derivation
// path: array of indices, e.g. [44, 242, 0, 0] for m/44'/242'/0'/0'
function slip0010_derive(seed_hex, path) {
    const master = slip0010_master(seed_hex);
    let key = master.slice(0, 64),
        chain = master.slice(64);
    for (let i = 0; i < path.length; i++) {
        const result = slip0010_child(key, chain, path[i]);
        key = result.slice(0, 64);
        chain = result.slice(64);
    }
    return {
        "key": key,
        "chaincode": chain
    };
}

// ============================================
// MAIN: DERIVE NIMIQ AND NANO ADDRESS FROM BIP39 SEED
// ============================================

// Derives a Nimiq address from a BIP39 seed hex string
// Path: m/44'/242'/account'/index' (SLIP-0010 Ed25519, all hardened)
function derive_nimiq_account(seed_hex, index) {
    const path = [44, 242, 0, index],
        derived = slip0010_derive(seed_hex, path),
        privkey = derived.key,
        pubkey = ed25519_pubkey(privkey),
        hash = blake2b(hex_to_bytes(pubkey)),
        raw_address = bytes_to_hex(hash).slice(0, 40),
        address = to_nimiq_address(raw_address);
    return {
        index,
        address,
        pubkey,
        privkey
    }
}

// Derives a Nano address from a BIP39 seed hex string
// Path: m/44'/165'/index' (SLIP-0010 Ed25519, all hardened)
function derive_nano_account(seed_hex, index) {
    const path = [44, 165, index],
        derived = slip0010_derive(seed_hex, path),
        privkey = derived.key,
        pubkey = nano_ed25519_pubkey(privkey),
        address = to_nano_address(pubkey);
    return {
        index,
        address,
        pubkey,
        privkey
    }
}

// ============================================
// MODULE EXPORT
// ============================================

const Bip39Utils = {
    // Version
    version: bip39_utils_test_vectors.version,

    // Constants object (for consistency with CryptoUtils/XmrUtils)
    bip39_utils_test_vectors,

    // Test constants (also exposed directly for convenience)
    test_phrase: bip39_utils_test_vectors.test_phrase,
    expected_seed: bip39_utils_test_vectors.expected_seed,
    expected_address: bip39_utils_test_vectors.expected_address,
    test_xpub: bip39_utils_test_vectors.test_xpub,

    // Mnemonic functions
    mnemonic_to_seed,
    parse_seed,
    generate_mnemonic,
    to_mnemonic,
    validate_mnemonic,
    find_invalid_word,

    // BIP32 derivation
    get_rootkey,
    objectify_extended,
    derive_x,
    derive_child_key,
    key_cc_xpub,
    keypair_array,
    ext_keys,
    xpub_obj,
    b58c_x_payload,

    // Address formatting
    format_keys,

    // Configuration
    bip32_configs,
    get_bip32_config,

    // Utilities
    shuffle_array,

    // Testing
    test_seed,
    test_derivation,
    test_xpub_support,
    test_bip39_compatibility,
    derive_nimiq_account,
    test_nimiq_derivation,
    derive_nano_account,
    test_nano_derivation
};