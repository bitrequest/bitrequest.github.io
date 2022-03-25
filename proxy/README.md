## Update

Replace the 'v1' folder, make sure you leave the config.php file.

## API Proxy

* Control your own keys and request limits.
* Host this folder on your webserver as your personal API proxy.
* Enter your API keys in the config.php file.
* In the bitrequest app go to Settings -> Advanced -> API Proxy and connect to your webserver.

## Lightning RPC proxy

* Connect your lightning node to the bitrequest app securely.
* Host this folder on your webserver as your personal Lightning RPC proxy.
* Enter your lightning Host and keys in the config.php file.
* In the bitrequest app go to Currencies -> Bitcoin -> Settings -> Lightning Network and connect to your webserver.
* Select your lightning node.

## Lightning setup:

### Connect:

* **LND:** host: {REST host}, key: {Invoice Macaroon (hex)}
* **Eclair:** host: {REST host}, key: {Password}
* **C-lightning:** host: {REST host}, key: {Invoice Macaroon (hex)}
* **LNbits:** host: {API host}, key: 'Invoice/read key'

### Settings:

* **API key:**  Secure your for your lightning proxy calls with your personal key. (optional)  
* **successAction:**  Display a personal message in your clients wallet after a succesfull payment. (optional)  
* **callback:**  Status updates get posted to this url. [Documentation and sample templates](https://github.com/bitrequest/webshop-integration/). (optional)  
* **local_tracking:**  receive callbacks for point of sale requests.
* **remote_tracking:** receive callbacks for shared requests.  
* **logo:** Display your logo on lnurl enabled lightning wallets. (512x512px / base-64 encoded) 

## Lightning API:

* ln-create-invoice
* ln-invoice-status
* ln-request-status
* ln-invoice-decode
* ln-list-invoices

**Endpoint:** {Api proxy} /proxy/v1/ln/api/

imp {$implementation} : "lnd" / "eclair" / "c-lightning" / "lnbits"

### ln-create-invoice:

POST  

Payload:

    {
      "fn": "ln-create-invoice",
      "imp": {$implementation},
      "amount": {$amount},
      "memo": {$memo},
      "id": {$unique id} (required for c-lightning label),
      "expiry": {$expiry} (in seconds),
      "x-api": {$api-key} (optional),
    }

Response:

    {
      "bolt11": "lnbcrt100n1p3r3zvnpp59xxgzarekeh0dg0qa5hu4ap4xlpjl3jd7v4yhx6cqq5668vv8c8qdp8w3jhxapqd9h8vmmfvdjjqctsdyszsnzw24fyc2gcqzpgxqz95sp5cq3lu0kgawn2djhfa7rq34v539t5lnslnyrsdt7zpxqa4z2zx0kq9qyyssqs6akvn2wsx6wjratycg0wmwqhtmgl0cqw4m0xqhj7cgy4uxk6alsln578y8x66utkch7vkav0kz2zc6yx4pygre27h2vtzrat803pqcqj8wzxp",
      "hash": "298c817479b66ef6a1e0ed2fcaf43537c32fc64df32a4b9b580029ad1d8c3e0e",
      "invoice": $decoded bolt11,
      "proxy": "app.bitrequest.io",
    }

### ln-request-status:

POST  

Payload:

    {
      "fn": "ln-request-status",
      "id": {$payment-id},
      "x-api": {$api-key} (optional),
    }

Response:

    {
        "pid": {$payment-id},
        "status": "waiting" / "pending" / "paid" / "canceled",
        "rqtype": "local" / "checkout" / "outgoing" / "incoming",
        "proxy": "app.bitrequest.io",
        "version": "0.001"
    }


### ln-invoice-status:

POST  

Payload:

    {
      "fn": "ln-invoice-status",
      "imp": {$implementation},
      "hash": {$payment-hash},
      "x-api": {$api-key} (optional),
    }

Response:

    {
        "status": "pending" / "paid" / "canceled",
        "bolt11": "lnbc3u1p3rvxtvpp5ff3a7s2ltau6y23zm3l7xchk95k98wx0ey5l3jyd5ddzz9u97msqhp5a5y3dq8ac8zusau6wwlm927da6cqvxzzqr70rjtvzqf3q2dhwuxscqpjxqyjw5qrzjqftzw4d5r9nsau4nkakrxxdvkm0xgl6yxwuk4lp9yykz5kql0j5vzzkcgvqq8tgqqqqqqqqqqqqqphgq9qsp52kfc2x26ngwp55g0atdv626d2gqaelww6zm7gsv69nnevucy5shq9qy9qsqqeryqqec8gdlfnmvqcs4swwupw0wv2vzhgdzaew9hmgs3z50gfrr3r6lrkfyrxc2gv92sz7cg8hau40s3n5qwdc6a4s2l4fnh7fv2wgqc3zcsn",
        "hash": "4a63df415f5f79a22a22dc7fe362f62d2c53b8cfc929f8c88da35a211785f6e0",
        "amount": "300000",
        "amount_paid": "300000",
        "timestamp": "1647712620000",
        "txtime": "1647712620000",
        "conf": "1",
        "proxy": "app.bitrequest.io",
        "version": "0.001"
    }

### ln-invoice-decode:

POST  

Payload:

    {
      "fn": "ln-invoice-decode",
      "imp": {$implementation},
      "hash": {$payment-hash},
      "x-api": {$api-key} (optional),
    }

Response:

    {
        "decoded bolt11 invoice"
    }

### ln-list-invoices:

POST  

Payload:

    {
      "fn": "ln-list-invoices",
      "imp": {$implementation},
      "x-api": {$api-key} (optional),
    }

Response:

    [{bolt 11 invoices}]
