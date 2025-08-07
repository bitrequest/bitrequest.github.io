# API / Lightning Proxy README

## Update

Replace the 'v1' folder, making sure to leave the config.php file intact.

## API Proxy

* Control your own keys and request limits.
* Host this folder on your webserver as your personal API proxy.
* Enter your API keys in the config.php file.
* In the Bitrequest app, go to Settings -> Advanced -> API Proxy and connect to your webserver.

## URL Shortener

* Use your webserver for your personal shortlinks.
* In the Bitrequest app, go to Settings -> Advanced -> URL Shortener and connect to your proxy server.

## Lightning RPC Proxy

* Connect your Lightning node to the Bitrequest app securely.
* Host this folder on your webserver as your personal Lightning RPC proxy.
* Enter your Lightning host and keys in the config.php file.
* In the Bitrequest app, go to Currencies -> Bitcoin -> Settings -> Lightning Network and connect to your webserver.
* Select your Lightning node.

## Folder permissions

(For Nginx) you might have to chmod the following api folders to 777 (Apply to enclosed) in order to cache files: "ln/api" and "inv/api".

## Lightning Setup:

### Connect:

* **LND:** host: {REST host}, key: {Invoice Macaroon (hex)}
* **core-lightning:** host: {API host}, key: 'Invoice Rune'
* **LNbits:** host: {API host}, key: 'Invoice/read key'

### Settings:

* **API key:**  Secure your Lightning proxy calls with your personal key. (optional)  
* **successAction:**  Display a personal message in your client's wallet after a successful payment. (optional)  
* **callback:**  Set callback URL to receive status updates. [Documentation and sample templates](https://github.com/bitrequest/webshop-integration/). (optional)  
* **local_tracking:**  Receive callbacks for point-of-sale requests.
* **remote_tracking:** Receive callbacks for shared requests.  
* **logo:** Display your logo on LNURL-enabled Lightning wallets. (512x512px / base64-encoded) 

## Lightning API:

Available endpoints:
* ln-create-invoice
* ln-invoice-status
* ln-request-status
* ln-invoice-decode
* ln-list-invoices

**Endpoint:** {API proxy}/proxy/v1/ln/api/

imp {$implementation} : "lnd" / "core-lightning" / "lnbits"

### ln-create-invoice:

POST  

Payload:

```json
{
  "fn": "ln-create-invoice",
  "imp": "{$implementation}",
  "amount": "{$amount}",
  "memo": "{$memo}",
  "id": "{$unique id}", // required for core-lightning label
  "expiry": "{$expiry}", // in seconds
  "x-api": "{$api-key}" // optional
}
```

Response:

```json
{
  "bolt11": "lnbcrt100n1p3r3zvnpp59xxgzarekeh0dg0qa5hu4ap4xlpjl3jd7v4yhx6cqq5668vv8c8qdp8w3jhxapqd9h8vmmfvdjjqctsdyszsnzw24fyc2gcqzpgxqz95sp5cq3lu0kgawn2djhfa7rq34v539t5lnslnyrsdt7zpxqa4z2zx0kq9qyyssqs6akvn2wsx6wjratycg0wmwqhtmgl0cqw4m0xqhj7cgy4uxk6alsln578y8x66utkch7vkav0kz2zc6yx4pygre27h2vtzrat803pqcqj8wzxp",
  "hash": "298c817479b66ef6a1e0ed2fcaf43537c32fc64df32a4b9b580029ad1d8c3e0e",
  "invoice": "$decoded bolt11",
  "proxy": "app.bitrequest.io"
}
```

### ln-request-status:

POST  

Payload:

```json
{
  "fn": "ln-request-status",
  "id": "{$payment-id}",
  "x-api": "{$api-key}" // optional
}
```

Response:

```json
{
    "pid": "{$payment-id}",
    "status": "waiting" | "pending" | "paid" | "canceled",
    "rqtype": "local" | "checkout" | "outgoing" | "incoming",
    "proxy": "app.bitrequest.io",
    "version": "0.001"
}
```

### ln-invoice-status:

POST  

Payload:

```json
{
  "fn": "ln-invoice-status",
  "imp": "{$implementation}",
  "hash": "{$payment-hash}",
  "x-api": "{$api-key}" // optional
}
```

Response:

```json
{
    "status": "pending" | "paid" | "canceled",
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
```

### ln-invoice-decode:

POST  

Payload:

```json
{
  "fn": "ln-invoice-decode",
  "imp": "{$implementation}",
  "hash": "{$payment-hash}",
  "x-api": "{$api-key}" // optional
}
```

Response:

```json
{
    "decoded bolt11 invoice"
}
```

### ln-list-invoices:

POST  

Payload:

```json
{
  "fn": "ln-list-invoices",
  "imp": "{$implementation}",
  "x-api": "{$api-key}" // optional
}
```

Response:

```json
[{bolt11 invoices}]
```