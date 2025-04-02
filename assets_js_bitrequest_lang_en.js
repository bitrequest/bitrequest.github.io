// 1. Copy the file assets_js_bitrequest_lang_en.js and replace the filename with your countrycode suffix.
// Example assets_js_bitrequest_lang_en.js --> assets_js_bitrequest_lang_nl.js

// 2. Add the scripttag with your new file to index.html

// 3. Replace the functionname 'lang_en' below with your countrycode.
// Example lang_en(id, data) -> lang_nl(id, data)

// 4. Add your language object with the right countrycode / countryname and functionname to the translate() function in assets_js_bitrequest_lang_controller.js
// Example:

/* 
"en": {
    "lang": "English",
    "obj": lang_en(id, data)
}
-->
"en": {
    "lang": "English",
    "obj": lang_en(id, data)
},
"nl": {
    "lang": "Dutch",
    "obj": lang_nl(id, data)
}
*/

// 4. Translate the function object below.
// Leave the object keys unchanged, translate the object value, don't translate variables!! (You can rearrange variables for your language format).
// Try to keep stringlength the same.
// Blanks default to english.
// Submit a pull request. (Please test if everything is working).

function lang_en(id, data) {
    const translation = {
        "payoff": "Accept crypto anywhere",

        // PAGES
        "home": "home",
        "currencies": "currencies",
        "requests": "requests",
        "settings": "settings",
        "coinsettings": "currencysettings",
        "addresses": "addresses",

        // INTRO
        "enteryourname": "Please enter your name",
        "more": "More",
        "restorefrombackup": "Restore from backup",

        // CORE
        // notifications
        "datasaved": "Data saved",
        "pinmatch": "pincode does not match",
        "xratesx": "Unable to get exchange rate",
        "entercoinaddress": "Enter a " + data.currency + " address.",
        "label": "label (optional)",
        "errorvk": "Error verifying Viewkey",
        "invalidvk": "Invalid Viewkey",
        "novalidaddress": "is NOT a valid " + data.currency + " address.",
        "pickacurrency": "Pick a currency",
        "invalidlabel": "invalid label",
        "noactivecurrencies": "no active currencies",
        "addressremoved": "Address removed",
        "movedtoarchive": "Moved to archive",
        "requestrestored": "Request restored",
        "requestdeleted": "Request deleted",
        "requestsaved": "Request saved",
        "requiredfields": "Please fill in required fields",
        "requiredfield": "is a required field",
        "nofetchincoice": "Unable to fetch invoice.",
        "copy": "Copy",
        "copied": "copied to clipboard",
        "xcopy": "Unable to copy",
        "cashiernotallowed": "Not allowed in cashier mode",
        "decodeqr": "unable to decode qr",
        "invalidformat": "Invalid format",
        "invalidmacaroon": "Invalid macaroon format",
        "recentrequests": "Recent requests",
        "encodeyoraddress": "Encode your address on bitrequest.io/qr",
        // confirm
        "openurl": "Open " + data.url + "?",
        "showrequestsfor": "Show requests for " + data.address + "?",
        "areyousure": "Are you sure?",
        "openinvoice": "Open invoice: " + data.hash + "?",
        "sharefile": "Share " + data.filename + "?",
        // dialog
        "nofetchtokeninfo": "Unable to fetch token data.",
        "archiverequest": "Archive request?",
        "unarchiverequest": "Unarchive request?",
        "failedtofetchrequest": "Failed to fetch request",
        "downloadwallet": "Download " + data.currency + " wallet",

        // ADD ADDRESS
        "alreadyexists": "address already exists",
        "addaddress": "Add address",
        "adderc20token": "Add erc20 token",
        "erc20placeholder": "Pick erc20 token",
        "enteraddress": "Enter address",
        "noaddressyet": "I don't have a " + data.currency + " address yet",

        // ADDRESS INFO
        "showrequests": "Show requests",
        "newrequest": "New request",
        "addressinfo": "Address info",
        "editlabel": "Edit label",
        "removeaddress": "Remove address",
        "recentpayments": "Recent payments",
        "privatekey": "Private key",
        "secretviewkey": "Secret view key",
        "secretspendkey": "Secret spend key",

        // REQUEST INFO
        "currency": "Currency",
        "from": "From",
        "title": "Description",
        "amount": "Amount",
        "status": "Status",
        "Waiting for payment": "Waiting for payment",
        "paid": "Paid",
        "received": "Received",
        "insufficient": "Insufficient",
        "new": "New",
        "pending": "Pending",
        "canceled": "Canceled",
        "expired": "expired",
        "type": "Type",
        "created": "Created",
        "firstviewed": "First viewed",
        "sendon": "Request send on",
        "paidon": "Paid on",
        "amountreceived": "Amount received",
        "amountpaid": "Amount paid",
        "fiatvalue": "Fiat value",
        "fiatvalueon": "Fiat value on",
        "receivingaddress": "Receiving address",
        "fallbackaddress": "Fallback address",
        "paymentid": "Payment ID",
        "integratedaddress": "Integrated Address",
        "network": "Network",
        "incoming": "Incoming",
        "outgoing": "Outgoing",
        "point of sale": "Point of sale",
        "online purchase": "Online purchase",
        "transactions": "Transactions",
        "viewon": "View on",
        "source": "Source",
        "deleterequest": "Delete request",

        // REQUEST PANEL
        "sharerequest": "Share request",
        "openwallet": "Open wallet",
        "whatsyourname": "What's your name?",
        "whatsitfor": "What's it for?",
        "forexample": "eg",
        "send": "Send",
        "to": "to",
        "nodetection": "No payment detected",
        "lookuppayment": "Look for recent incoming " + data.currency + " payments on " + data.blockexplorer,
        "dontshowagain": "Don't show again",
        "dismiss": "dismiss",
        "activateintegrated": "Activate integrated addresses",
        "pendingrequest": "Pending request",
        "paymentsent": "Payment sent",
        "paymentreceived": "Payment received",
        "txbroadcasted": "Transaction broadcasted",
        "insufficientamount": "Insufficient amount",
        "txexpired": "Request expired",
        "viewdetails": "View details",
        "showqr": "Show qr-code",
        "waitingfor": "Waiting for",
        "unconfirmedtx": "Unconfirmed transaction",
        "amountshort": "short",
        "sharelocktitle": "Temporarily unable to share request.",
        "sharelockttext": "This address has a <span id='view_pending_tx' data-requestid='" + data.pending_requestid + "'>pending shared request</span>.",
        "waitforconfirm": "Please wait for the transaction to confirm before re-using the address.",
        "pickanotheraddress": "Pick another address:",
        // ** request suggestion placeholders ** //
        "lunch": "Lunch",
        "festivaltickets": "Festival tickets",
        "coffee": "Coffee",
        "present": "Present",
        "snowboarding": "Snowboarding",
        "movietheater": "Movie theater",
        "shopping": "Shopping",
        "videogame": "Video game",
        "drinks": "Drinks",
        "concerttickets": "Concert tickets",
        "camping": "Camping",
        "taxi": "Taxi",
        "zoo": "Zoo",
        // notifications
        "failedhistoric": "Failed to get historical " + data.ccsymbol + " price data",
        "closingsockets": "Closing sockets...",
        "nowriteaccess": "LNurl proxy access denied, check folder permissions",
        "notmonitored": "this address is not monitored",
        "lnoffline": "Lightning node is offline",
        "addlightningnode": "Add lightning node",
        "addressinuse": "Address in use",
        "minimal2": "Description should have minimal 2 characters",
        "minimal3": "Name should have minimal 3 characters",
        "checkyourform": "Please check your form",
        "entertitle": "Please enter a description",
        "successshare": "Successful share!",
        // confirm
        "opencoinsettings": "Open " + data.currency + " settings?",
        "viewpendingrequest": "View pending request?",
        "useinstead": "Use '" + data.thisinputvalue + "' instead?",
        "generatenewaddress": "Are you sure you want to generate a new " + data.currency + " address? It may not show up in some wallets",
        // dialog
        "undefinedaddress": "Undefined address, please ask for a new request",
        "invalidaddress": "Invalid " + data.payment + " address",

        // SHARE REQUEST
        "share": "share",
        "sharetitlename": (data.requestname === "Bitrequest") ? "Hi, I made a " + data.pagenameccparam + " bitrequest of " + data.amount + " " + data.uoa + " for '" + data.requesttitle + "'" : data.requestname + " sent a " + data.pagenameccparam + " bitrequest of " + data.amount + " " + data.uoa + " for '" + data.requesttitle + "'",
        "sharetitle": data.pagenameccparam + " payment request for " + data.amount + " " + data.uoa,
        "sharetitlechange": data.payment + " request for " + data.newccvalue + " " + data.newccsymbol,

        // SETTINGS
        "accountsettings": "Your name",
        "currencysettings": "Local Fiat Currency",
        "entercurrency": "Enter currency",
        "setasdefault": "Set as default",
        "langsettings": "language",
        "chooselanguage": "Choose language",
        "security": "Security",
        "pinsettings": "Passcode Lock",
        "bip39_passphrase": "Secret Phrase",
        "backupsecretphrase": "Backup secret phrase",
        "missingkeywarning": data.seedstrtitle + " for '<span class='adspan'>" + data.address + "</span>' is missing.<br/>Are you sure you want to use this address?",
        "emptyphrase": "Please enter your secret phrase",
        "notinwordlist": data.missing_word + " not in wordlist",
        "notbip39compatible": "Secret phrase not Bip39 compatible",
        "mustbe12characters": "Secret phrase must be 12 characters",
        "cannotsendfunds": "Bitrequest can not send funds!",
        "importtosend": "To send funds you need to restore your <span class='show_bip39 ref'>12 word secret phrase</span> in a bip39 compatible wallet:",
        "backup": "Backup App data",
        "backupwithgd": "Backup with Google Drive:",
        "nrchanges": "You have " + data.nr_changes + " changes in your app. Please backup your data.",
        "changein": "change in",
        "changesin": "changes in",
        "systembackup": "System Backup",
        "downloadbu": "download backup",
        "installlbu": "install backup",
        "restore": "Restore App data",
        "restorewithgd": "Restore from Google Drive:",
        "lastrestore": "Last restore:",
        "lastbackup": "Last backup:",
        "restorefromfile": "Restore from file",
        "differentsecretphrase": "Warning. Backup contains different secret phrase.",
        "secretphrasefrombackup": "Secret phrase from Backup",
        "currentsecretphrase": "Current secret phrase",
        "usesecretphrasefrombackup": "Use secret phrase from Backup",
        "keepcurrentsecretphrase": "Keep current secret phrase",
        "comparesecretphrases": "Compare secret phrases",
        "csvexport": "Export CSV",
        "includearchive": "Include archive",
        "includereceipt": "Include receipt",
        "receipt": "Receipt",
        "advanced": "Advanced",
        "url_shorten_settings": "Url shortener",
        "shorturlnotfound": "Request not found",
        "cmcapisettings": "Cryptocurrency price data",
        "fiatapisettings": "FIAT price data",
        "api_proxy": "API Proxy",
        "updateproxy": "Please update your proxy server " + data.version + " > " + data.proxy_version,
        "addapiproxy": "Add API proxy",
        "controlyourkeys": "Control your own keys and request limits:",
        "proxystep1": "Host the <a href='https://github.com/bitrequest/bitrequest.github.io/tree/master/proxy' target='blank' class='exit'>API proxy folder</a> on your server (php required).",
        "proxystep2": "Enter your API keys in 'config.php'.",
        "proxystep3": "Enter your server address below.",
        "addrpcproxy": "Add RPC proxy",
        "tryotherproxy": "Try other proxy",
        "apikeys": "API Keys",
        "apicallfailed": "Api call failed",
        "apididnotrespond": "Api did not repond",
        "contactform": "Contact form",
        "shipping": "shipping",
        "yourdetails": "Your details for online purchases.",
        "permissions": "Permissions",
        "teaminvite": "Team invite",
        "inviteteammembers": "Invite team members (staff, employees etc.) to make requests on your behalf.",
        "teaminviteexplainer": "This will install Bitrequest on your team member's device, pre-installed with your public keys and restricted access (cashier).",
        "teaminviteaccess": "Your team members are unable to access funds or make changes.",
        "teaminviteharetitle": "Bitrequest Team invitation from " + data.accountname,
        "teamupdate": "Team update",
        "invitationexpiresin": "Invitation expires in",
        "installcompleted": "Installation already completed!",
        "teamup": data.account + " wants to team up and make requests together with you!",
        "teamupdata": data.account + " wants you to update bitrequest with his latest public keys",
        "clickinstall": "By clicking on install, bitrequest will be installed on your device with " + data.account + "'s public keys and restricted access.",
        // notifications
        "nameisrequired": "Name is required",
        "currencysaved": "Currency saved",
        "currencynotsupported": "currency '" + data.currency + "' not supported",
        "noiosbu": "Downloads for IOS App unavailable at the moment",
        "downloaded": data.file + " gedownload",
        "filesize": "Filesize too big",
        "filetype": "Filetype '" + data.filetype + "' not supported",
        "selectbackup": "Select a Backup file",
        "unauthorized": "Unauthorized",
        "maxattempts": "Max attempts exeeded",
        "fourdigitpin": "Enter your 4 digit pin",
        "wrongpin": "Wrong pin",
        "nocsvexports": "No requests to export",
        "validateapikey": "Enter a valid API key",
        "unabletopost": "Unable to send Post request from " + data.fixed_url,
        "invalidapikey": "Invalid API key",
        "apicallerror": "API call error",
        "invalidapikeyname": "Invalid " + data.thisref + " API key",
        "addapikey": "Add " + data.apisrc + " Api key",
        "phname": "Name",
        "phaddress": "Address",
        "phzipcode": "Zip/postal code",
        "phcity": "City",
        "phcountry": "Country",
        "phemail": "email",
        "invalidchars": "contains invalid characters",
        "pleaseverify": "Please verify your secret phrase.",
        "owndevice": "Can't install invite on own device",
        "installcomplete": "Installation complete!",
        // confirm
        "includesecretphrase": "Include encrypted secret phrase in backup? Make sure you keep track of your backup files!",
        "sharebu": "Share system backup?",
        "installsb": "INSTALL SYSTEM BACKUP? ALL YOUR CURRENT APP DATA WILL BE REPLACED",
        "downloadfile": "Download: " + data.file + "?",
        "restorefile": "Restore: " + data.file + "?",
        "restorefromdevice": "Restore " + data.file + " from " + data.device + " device?",
        "restorewithoutsecretphrase": "Restore without secret phrase?",
        "keepexistingsecretphrase": "Are you sure you want to keep your existing secret phrase?",
        "sharecsvexport": "Share csv export?",
        "disableshorturls": "Are you sure you want to disable url shortening? This can affect the workflow of this app",
        "sendinvite": "Send invite",
        "updatealert": "Update? All you current public keys will be updated.",
        "installalert": "Install? All you current public keys will be replaced.",

        // COIN SETTINGS
        "confirmations": "Confirmations",
        "showsatoshis": "Show satoshis",
        "Use random address": "Use random address",
        "Share viewkey": "Share viewkey",
        "Integrated addresses": "Integrated addresses",
        "Reuse address": "Reuse address",
        "blockexplorers": "Blockexplorers",
        "chooseblockexplorer": "Choose Blockexplorer",
        "apis": "APIs",
        "addapi": "Add " + data.h_hint + " RPC:",
        "websockets": "Websockets",
        "addwebsocket": "Add " + data.h_hint + " websocket:",
        "layer2": "Layer 2",
        "Xpub": "Xpub",
        "bip32xpub": "BIP32 Extended public key",
        "addxpub": "Add " + data.currency + " Xpub key",
        "xpubmatch": "The above addresses match those in my " + data.currency + " wallet.",
        "xpubkeys": "I own the secret phrase / Xpriv key",
        "Key derivations": "Key derivations",
        "derivationpath": "Derivation path",
        "resetbutton": "reset",
        // notifications
        "unabletoconnect": "Unable to connect",
        "nodealreadyadded": "Node already added",
        "removedefaultnode": "Cannot remove default node",
        "rpcnoderemoved": "RPC node removed",
        "confirmmatch": "Confirm addresses are matching",
        "confirmpkownership": "Confirm privatekey ownership",
        "invalidxpub": "NOT a valid / supported " + data.currency + " Xpub key",
        "xpubsaved": "Xpub saved",
        "resetnotify": data.currency + " settings reset to default",
        // confirm
        "reusewarningalert": "Are you sure you want to generate new " + data.thiscurrency + " addresses? they may not show up in some wallets.",
        "reusealert": "Are you sure you want to reuse " + data.thiscurrency + " addresses?",
        "confirmremovenode": "Are you sure you want to remove '" + data.thisval + "'?",
        "disablexpub": "Disable Xpub address derivation?",
        "replacexpub": "Replace Xpub?",
        "uselegacy": "Use " + data.thiscurrency + " Legacy addresses?",
        "usesegwit": "Use " + data.thiscurrency + " SegWit addresses?",
        "resetconfirm": "Are you sure you want to reset " + data.currency + " settings?",
        // dialog
        "resetdialog": "Reset " + data.currency + " settings?",

        // LIGHTNING
        "Lightning network": "Lightning network",
        "lightningnode": "lightning node",
        "addnode": "Add node",
        "implementation": "Implementation",
        "tabyourboldcard": "Please tap your Boltcard to the back of this device",
        "controlyourlnkeys": "Control your own lightning node and keys:",
        "lnnodestep1": "Host the <a href='https://github.com/bitrequest/bitrequest.github.io/tree/master/proxy' target='blank' class='exit ref'>proxy folder</a> on your webserver.",
        "lnnodestep2": "Enter your lightning node's REST host and keys in 'config.php'.",
        "lnnodestep3": "Enter your server address below.",
        "enterlnapikey": "Enter proxy API key to unlock '" + data.proxy + "'",
        "viewinvoice": "View invoice",
        "noinvoicesfound": "No invoices found.",
        "invoiceslocked": "Node proxy locked, unable to fetch invoices.<br/>Please enter your proxy <span id='pw_unlock_invoices' data-pid='" + data.proxy_id + "' class='ref'>API key</span>.",
        "invoiceoffline": "Node offline, unable to fetch invoices.",
        // notifications
        "nodenotfound": "Node not found",
        "proxynotfound": "Proxy not found",
        "enterserver": "Please enter server address",
        "defaultproxy": data.fixed_url + " is a default proxy",
        "proxyexists": "Proxy already added",
        "invalidurl": "Invalid url",
        "selectimplementation": "Select implementation",
        "selectlnhost": "Select " + data.imp + " Host",
        "selectkeyname": "Select " + data.impkeyname,
        "entermacaroon": "Please enter 'invoice' macaroon",
        "invalidkeyformat": "Invalid key format",
        "proxylocked": "Current node proxy is locked, please enter your API key",
        "proxyoffline": "Current node is offline, try " + data.proxy_message + " proxy",
        "folderpermissions": "Unable to write to cache, please check your folder permissions.",
        "proxyadded": "Proxy added",
        "unabletoconnectto": "Unable to connect to " + data.value,
        "proxynameexists": data.imp + " node already added",
        "proxyinuse": data.imp + ": '" + data.name + "' uses this proxy, remove it first",
        "proxyremoved": "Proxy removed",
        "serviceremoved": "Service removed",
        "unknownproxy": "Unknown proxy server",
        "proxyunlocked": "Proxy unlocked!",
        "proxydatamissing": "Proxy data missing",
        "invoicecanceled": "Invoice canceled",
        // confirm
        "enablelightning": "Enable lightning payments?",
        "disablelightning": "Disable lightning payments?",
        "disableproxy": "Disable proxy " + data.set_proxy_val + "?",
        "enableproxy": "Enable proxy " + data.set_proxy_val + "?",
        // dialog
        "unabletoconnectln": "Unable to connect with lightning node",

        // BIP39
        "disclaimer": "Disclaimer!",
        "cannotbespend": "Funds received by addresses generated from your secret phrase can not be spend by Bitrequest.<br/>To spend your funds you wil need to restore your secret phrase in a <a href='https://www.bitrequest.io/compatible-wallets' target='_blank' class='ref'>compatible wallet.</a>",
        "compatiblewallets": "Compatible wallets",
        "important": "Important!",
        "abouttobecome": "You are about to become your own bank.",
        "inthenextscreen": "In the next screen, you will see your secret phrase.",
        "makesure": "Make sure to write it down and put it somewhere safe!",
        "understandandok": "I understand and am ok with this.",
        "entersecretphrase": "Enter your secret phrase:",
        "writedownsecretphrase": "Write down your secret phrase and put it somewhere safe.",
        "ifyouloseyourphrase": "If you lose your phrase,<br/>you will lose your money!",
        "understand": "I understand!",
        "verifycurrent": "Verify Current secret phrase:",
        "verifybackup": "Verify Backup:",
        "withgreatpower": "With great power comes great responsibility.",
        "remember": "Remember to backup your <span id='toseed'>Secret phrase</span>.",
        "overwritten": "Make sure to backup your current <span id='toseed'>Secret phrase</span>. It will be overwritten",
        "word": "word",
        "idothislater": "I do this later",
        "ivebackeditup": "I've backed it up!",
        "next": "next",
        "prev": "prev",
        "findmorewallets": "Find more wallets",
        // notifications
        "alreadyhavesecretphrase": "You already have a secret phrase",
        "wrongsecretphrase": "wrong secret phrase",
        "consent": "Please consent to continue.",
        "secretphrasedeleted": "Secret phrase deleted",
        "congratulations": "Congratulations. You are now your own bank!",
        "passphraseverified": "Passphrase verified",
        "backupasap": "Please backup your secret phrase asap",
        // confirm
        "resoresecretphrase": "Restore secret phrase",
        "areyousuredfp": "Are you sure you want to delete your secret phrase?",
        "restoresecretphrasefrombackup": "Are you sure you want to restore your secret phrase from backup? Your current secret phrase will be erased.",
        // dialog
        "continueatownrisk": "Warning! Continue at your own risk.",
        "ifyouloseyourdevice": "If you lose your device, uninstall your application or clear your browserdata, you'll need your secret phrase to recover your funds!",
        "deletingyoursecretphrase": "Warning! Deleting your secret phrase may result in lost of funds.",
        "continuewithbackup": "Continue only if you have a backup of your secret phrase.",

        // SOCKETS
        // notifications
        "youareoffline": "You are currently offline",
        "networks": "networks",
        "acceptthepayment": "Accept the payment in your lightning app...",
        "ndeftablimit": "Tapped too quick",
        "enteramount": "Please enter amount",
        "cardmax": "Request exceeds card's maximum",
        "minamount": "Minimum request amount is " + data.min,
        "waitingforpayment": "Waiting for payment",
        "websocketoffline": "node offline",

        // PIN PANEL
        "pleaseenter": "Please enter your pin",
        "createpin": "Create a 4-digit pin",
        "locktime": "Lock time",
        "resetpin": "Reset pin",
        "enternewpin": "Enter new pin",
        "minute": "minute",
        "minutes": "minutes",
        "never": "never",
        "pincodeactivated": "Pincode activated",
        "pincodedisabled": "Pincode disabled",
        "confirmyourpin": "Confirm your pincode",

        // LOCKSCREEN
        "unlockwithsecretphrase": "Unlock with secret phrase",
        "tomanyunlocks": "Too many unlock attempts",
        "enter12words": "Enter your 12 word<br/>secret phrase:",
        "tryagainin": "Please try again in",
        "unlock": "Unlock",

        // BUTTONS AND PANELS
        "cancelbttn": "cancel",
        "okbttn": "ok",
        "show": "Show",
        "hide": "Hide",
        "delete": "delete",
        "restorebttn": "restore",
        "showtransactions": "Show Transactions",
        "sharerequestbutton": "Share request",
        "addcoinaddress": "Add " + data.currency + " address",
        "generatewallet": "Create a wallet from secret phrase.",
        "pkownership": "I own the private key of this address.",
        "nopub": "Address / Xpub",
        "update": "update",
        "install": "install",
        "pay": "pay",

        //DIALOGS
        "totalchanges": "You have " + data.total_changes + " changes in your app",
        "nochanges": "You have 0 changes in your app",
        "havewallet": "Do you have a " + data.lnd_ref + " wallet on this device?",

        // DATES
        "sunday": "Sunday",
        "monday": "Monday",
        "tuesday": "Tuesday",
        "wednesday": "Wednesday",
        "thursday": "Thursday",
        "friday": "Friday",
        "saturday": "Saturday",
        "year": "year",
        "years": "years",
        "month": "month",
        "months": "months",
        "week": "week",
        "weeks": "weeks",
        "day": "day",
        "days": "days",
        "hour": "hour",
        "hours": "hours",
        "minute": "minute",
        "minutes": "minutes",
        "seconds": "seconds",
        "and": "and",
        "expiresin": "Expires in ",
        "fileexpired": "File expired",

        // LOADERTEXT
        "generatereceipt": "Generate receipt",
        "connecttolnur": "Connecting to " + data.url,
        "loadurl": "Loading " + data.url,
        "loading": "loading...",
        "gettokeninfo": "get token info",
        "checklightningstatus": "Check " + data.imp + " lightning status",
        "readingfromcache": "Reading " + data.ccsymbol + " rate from cache",
        "getccrates": "Get " + data.ccsymbol + " rates from " + data.api,
        "getfiatrates": "Get fiat rates",
        "readingfiatratesfromcache": "Reading fiat rates from cache",
        "fetchingfiatrates": "Fetching fiat rates from " + data.fiatapi,
        "generatelink": "Generating link",
        "loadingcamera": "Loading camera",
        "generatebu": "Generate system backup",
        "installationpackage": "Generate installation package",

        // RANDOM TERMS
        "address": "address",
        "choose": "Choose",
        "enable": "Enable",
        "disable": "Disable",
        "apikey": "API key",
        "yes": "yes",
        "no": "no",
        "verified": "verified",
        "error": "Error",
        "apierror": "api error",
        "success": "Success",
        "warning": "Warning!",
        "edit": "Edit",
        "enter": "Enter",

        // CHECK INTENTS
        "proto": data.proto + ": connect not available at the moment",
        "invalidurlscheme": "Invalid URL scheme",
        "usnotsupported": "URL scheme '" + data.proto + ":' is not supported",

        // GOOGLE AUTH
        "stopgauth": "Stop using Google Drive Backup.",
        "gauthsafely": "Safely backup your appdata.",
        "gauthsync": "Sync your data securely with Google Drive.",
        "signin": "Sign in",
        "backuptogd": "Back up to Google Drive",
        // notifications
        "ganot": "GoogleAuth not available",
        "gdsignedin": "Successfully signed in",
        "gdsignedout": "Successfully signed out",
        "filedeleted": "File deleted",
        "filenotfound": "File not found",
        // confirm
        "stopgdalert": "Are you sure you want to stop using Google Drive Backup?",
        "deletefile": "Delete" + " " + data.file + "?"
    }
    return translation[id];
}