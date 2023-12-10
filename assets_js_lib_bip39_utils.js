const crypto = window.crypto,
    b58ab = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    b32ab = "qpzry9x8gf2tvdw0s3jn54khce6mua7l",
    generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3],
    bytestring = "0000000000000000000000000000000000000000000000000000000000000000",
    oc = 115792089237316195423570985008687907852837564279074904382605163141518161494337n,
    wordlist = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"],
    utf8Encoder = new TextEncoder(),
    utf8Decoder = new TextDecoder("utf-8", {
        "fatal": true
    });

// helpers

function uint_8Array(bytes) {
    return new Uint8Array(bytes);
}

function buffer(enc) {
    return utf8Encoder.encode(enc);
}

function unbuffer(enc, encoding) {
    return utf8Decoder.decode(enc);
}

function tobits(val) {
    return sjcl.codec.utf8String.toBits(val);
}

function dectohex(val) {
    return val.toString(16);
}

function hextodec(val) {
    return BigInt("0x" + val);
}

function is_hex(str) {
    return new RegExp("([0-9A-Fa-f])+$").test(str);
}

function hextobin(hex) {
    if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
    let res = uint_8Array(hex.length / 2);
    for (let i = 0; i < hex.length / 2; ++i) {
        res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return res;
}

function str_pad(val, bytes) {
    return (bytestring.slice(0, bytes) + val).substr(-bytes);
}

function hextobits(val) {
    return sjcl.codec.hex.toBits(val);
}

function frombits(val) {
    return sjcl.codec.hex.fromBits(val);
}

function bitlength(val) {
    return sjcl.bitArray.bitLength(val);
}

function concat_array(arr1, arr2) {
    return sjcl.bitArray.concat(arr1, arr2);
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(uint_8Array(buffer), x => ("00" + x.toString(16)).slice(-2)).join("");
}

// mnemonic helpers

function cleanstring(words) {
    return normalizestring(joinwords(splitwords(words)));
}

function joinwords(words) {
    return words.join(" ");
}

function splitwords(mnemonic) {
    return mnemonic.split(/\s/g).filter(function(x) {
        return x.length;
    });
}

function normalizestring(str) {
    return str.normalize("NFKD");
}

function mnemonicToBinaryString(mnemonic) {
    let mm = splitwords(mnemonic);
    if (mm.length == 0 || mm.length % 3 > 0) {
        return null;
    }
    let idx = [];
    for (let i = 0; i < mm.length; i++) {
        let word = mm[i],
            wordIndex = wordlist.indexOf(word);
        if (wordIndex == -1) {
            return null;
        }
        let binaryIndex = zfill(wordIndex.toString(2), 11);
        idx.push(binaryIndex);
    }
    return idx.join("");
}

function binaryStringToWordArray(binary) {
    let aLen = binary.length / 32,
        a = [];
    for (let i = 0; i < aLen; i++) {
        let valueStr = binary.substring(0, 32),
            value = parseInt(valueStr, 2);
        a.push(value);
        binary = binary.slice(32);
    }
    return a;
}

function byteArrayToWordArray(data) {
    let a = [];
    for (let i = 0; i < data.length / 4; i++) {
        v = 0;
        v += data[i * 4 + 0] << 8 * 3;
        v += data[i * 4 + 1] << 8 * 2;
        v += data[i * 4 + 2] << 8 * 1;
        v += data[i * 4 + 3] << 8 * 0;
        a.push(v);
    }
    return a;
}

function byteArrayToBinaryString(data) {
    let bin = "";
    for (let i = 0; i < data.length; i++) {
        bin += zfill(data[i].toString(2), 8);
    }
    return bin;
}

function hexStringToBinaryString(hexString) {
    let binaryString = "";
    for (let i = 0; i < hexString.length; i++) {
        binaryString += zfill(parseInt(hexString[i], 16).toString(2), 4);
    }
    return binaryString;
}

// base58
// https://gist.github.com/diafygi/90a3e80ca1c2793220e5/

function b58enc(enc, encode) {
    let bytestring = (encode = "hex") ? hextobin(enc) : buffer(enc);
    return b58enc_uint_array(bytestring);
}

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

function b58dec(dec, decode) {
    let buffer = b58dec_uint_array(dec);
    return (decode == "hex") ? buf2hex(buffer) : unbuffer(buffer, "utf-8");
}

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
    return uint_8Array(b);
}

// base58check
function b58check_encode(payload) {
    let full_bytes = payload + hmacsha(hmacsha(payload, "sha256", "hex"), "sha256", "hex").slice(0, 8);
    return b58enc(full_bytes, "hex");
}

function b58check_decode(val) {
    let full_bytes = b58dec(val, "hex"),
        bytes = full_bytes.substring(0, full_bytes.length - 8);
    return bytes;
}

//LNurl

function toWords(bytes) {
    let res = convert(bytes, 8, 5, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

function fromWords(bytes) {
    let res = convert(bytes, 5, 8, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

function convert(data, inBits, outBits, pad) {
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

//hashing

function hmac_bits(message, key, encode) {
    let enc_msg = (encode == "hex") ? hextobits(message) : message,
        hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return frombits(hmac.encrypt(enc_msg));
}

function hmacsha(key, hash, encode) {
    let enc_key = (encode == "hex") ? hextobits(key) : key;
    return frombits(hmacsha_bits(enc_key, hash));
}

function hmacsha_bits(key, hash) {
    return sjcl.hash[hash].hash(key);
}

function privkey_wif(versionbytes, hexkey, comp) {
    let compressed = (comp) ? "01" : "";
    return b58check_encode(versionbytes + hexkey + compressed);
}

function priv_to_pub(priv) {
    return secp.getPublicKey(priv, true);
}

function expand_pub(pub) {
    return secp.Point.fromHex(pub).toHex(false);
}

function pub_to_address(versionbytes, pub) {
    return hash160_to_address(versionbytes, hash160(pub));
}

function pub_to_eth_address(pub) {
    let xp_pub = expand_pub(pub),
        keccak = "0x" + keccak_256(hextobin(xp_pub.slice(2))),
        addr = "0x" + keccak.slice(26);
    return toChecksumAddress(addr);
}

function hash160(pub) {
    return hmacsha(hmacsha(pub, "sha256", "hex"), "ripemd160", "hex");
}

function hash160_to_address(versionbytes, h160) {
    return b58check_encode(versionbytes + h160);
}

function sha_sub(val, lim) {
    return hmacsha(val, "sha256").slice(0, lim);
}

function toChecksumAddress(e) {
    if (void 0 === e) {
        return "";
    }
    if (!/^(0x)?[0-9a-f]{40}$/i.test(e)) {
        throw new Error("Given address " + e + " is not a valid Ethereum address.");
        return
    }
    e = e.toLowerCase().replace(/^0x/i, "");
    for (var t = keccak256(e).replace(/^0x/i, ""), r = "0x", n = 0; n < e.length; n++)
        7 < parseInt(t[n], 16) ? r += e[n].toUpperCase() : r += e[n];
    return r;
}

// Bech 32

function pub_to_address_bech32(hrp, pubkey) {
    let step1 = hash160(pubkey),
        step2 = hexStringToBinaryString(step1),
        step3 = step2.match(/.{1,5}/g),
        step4 = bech32_dec_array(step3);
    return bech32_encode(hrp, step4);
}

function bech32_dec_array(bitarr) {
    let hexstr = [0];
    $.each(bitarr, function(i, bits) {
        hexstr.push(parseInt(bits, 2));
    });
    return hexstr;
}

// from https://github.com/sipa/bech32/tree/master/ref/javascript

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

function hrpExpand(hrp) {
    let ret = [],
        p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }
    return ret;
}

function verifyChecksum(hrp, data) {
    return polymod(hrpExpand(hrp).concat(data)) === 1;
}

function createChecksum(hrp, data) {
    let values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]),
        mod = polymod(values) ^ 1,
        ret = [];
    for (let p = 0; p < 6; ++p) {
        ret.push((mod >> 5 * (5 - p)) & 31);
    }
    return ret;
}

function bech32_encode(hrp, data) {
    let combined = data.concat(createChecksum(hrp, data)),
        ret = hrp + "1";
    for (let p = 0; p < combined.length; ++p) {
        ret += b32ab.charAt(combined[p]);
    }
    return ret;
}

function bech32_decode(bechString) { // unused
    let p,
        has_lower = false,
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
    let pos = bechString.lastIndexOf("1");
    if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
        return null;
    }
    let hrp = bechString.substring(0, pos),
        data = [];
    for (p = pos + 1; p < bechString.length; ++p) {
        let d = b32ab.indexOf(bechString.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }
    if (!verifyChecksum(hrp, data)) {
        return null;
    }
    return {
        "hrp": hrp,
        "data": data.slice(0, data.length - 6)
    };
}

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
    let lnurlow = lnurl.toLowerCase(),
        pos = lnurlow.lastIndexOf("1"),
        hrp = lnurlow.substring(0, pos),
        data = [];
    for (p = pos + 1; p < lnurlow.length; ++p) {
        let d = b32ab.indexOf(lnurlow.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }
    if (!verifyChecksum(hrp, data)) {
        return null;
    }
    return {
        "hrp": hrp,
        "data": data.slice(0, data.length - 6)
    };
}

function aes_enc(params, keyString) {
    let buffer = uint_8Array(16),
        iv = byteArrayToWordArray(crypto.getRandomValues(buffer)),
        key = sjcl.codec.base64.toBits(keyString),
        cipher = new sjcl.cipher.aes(key),
        data = sjcl.codec.utf8String.toBits(params),
        enc = sjcl.mode.gcm.encrypt(cipher, data, iv, {}, 128),
        concatbitArray = sjcl.bitArray.concat(iv, enc),
        conString = sjcl.codec.base64.fromBits(concatbitArray);
    return conString;
}

function aes_dec(content, keyst) {
    let bitArray = sjcl.codec.base64.toBits(content),
        bitArrayCopy = bitArray.slice(0),
        ivdec = bitArrayCopy.slice(0, 4),
        encryptedBitArray = bitArray.slice(4),
        key = sjcl.codec.base64.toBits(keyst),
        cipher = new sjcl.cipher.aes(key);
    try {
        let data = sjcl.mode.gcm.decrypt(cipher, encryptedBitArray, ivdec, {}, 128);
        return sjcl.codec.utf8String.fromBits(data);
    } catch (err) {
        console.log(err.message);
        return false;
    }
}

function hexToNumberString(val) {
    return hex_to_number(val).toString();
}

function hex_to_number(val) {
    return parseInt(val, 16);
}

// CashAddr

function pub_to_cashaddr(legacy) {
    let c_addr = bch_cashaddr("bitcoincash", "P2PKH", legacy);
    return c_addr.split(":")[1];
}

function bch_legacy(cadr) {
    try {
        let version = 0,
            dec = cashaddr.decode(cadr),
            bytes = dec.hash,
            bytesarr = Array.from(bytes),
            conc = concat_array([0], bytesarr),
            unbuf = buf2hex(conc);
        return b58check_encode(unbuf);
    } catch (e) {
        console.log(e);
        return cadr
    }
}

function bch_cashaddr(prefix, type, legacy) {
    try {
        let lbytes = b58dec_uint_array(legacy),
            lbslice = lbytes.slice(1, 21);
        return cashaddr.encode(prefix, type, lbslice);
    } catch (e) {
        console.log(e);
        return legacy
    }
}

// Nimiq.watch TXD

function nimiqhash(tx) {
    return encodeURIComponent(btoa(tx.match(/\w{2}/g).map(function(a) {
        return String.fromCharCode(parseInt(a, 16));
    }).join("")));
}