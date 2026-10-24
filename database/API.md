# Marketplace API Reference

REST API for the marketplace, backed by MongoDB (Mongoose). JSON in / JSON out.

- **Base URL:** `http://127.0.0.1:4000` (LAN: `http://10.8.0.3:4000`)
- **Content type:** `application/json`
- **Auth:** JWT bearer token — `Authorization: Bearer <token>`
- **Source:** `~/Projects/marketplace/api`

---

## Conventions

### Roles
Every account has a `role` of `Seller`, `Admin`, or `Buyer`. Endpoints marked with a role require that role's token. Roles are enforced server-side.

### Authentication
1. `POST /api/auth/login` → returns `{ token, user }`.
2. Send `Authorization: Bearer <token>` on protected requests.
3. Tokens are signed JWTs, expire after `JWT_EXPIRES_IN` (default **7d**).

### Errors
All errors return a JSON body with a single `error` string:

```json
{ "error": "Forbidden" }
```

| Status | Meaning |
|--------|---------|
| `400` | Validation error / bad input |
| `401` | Missing/invalid token, or bad credentials |
| `403` | Authenticated but wrong role, or banned account |
| `404` | Resource not found |
| `409` | Conflict (username/email already taken) |
| `500` | Server error |

### IDs
MongoDB ObjectIds are 24-char hex strings, e.g. `"6ac5883824158b71a339a794"`.

### Pagination
Listing search returns `{ total, page, limit, items }`.

---

## Health

### `GET /health`
No auth. Liveness check.

```json
{ "status": "ok", "ts": "2026-10-07T02:10:23.118Z" }
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Create a Buyer or Seller account. New accounts start with `accountType: "Pending"`.

**Body**
| field | type | required | notes |
|-------|------|----------|-------|
| `role` | string | no | `Buyer` (default) or `Seller` |
| `username` | string | yes | unique |
| `email` | string | yes | unique |
| `password` | string | yes | |

**201**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "...", "username": "victor", "email": "...", "role": "Buyer", "accountType": "Pending" }
}
```

**Errors:** `400` missing fields / bad role · `409` username or email taken

---

### `POST /api/auth/login`
**Body**

| field | type | required |
|-------|------|----------|
| `identifier` | string | yes | email **or** username |
| `password` | string | yes |

`email` or `username` are accepted as aliases for `identifier`.

**200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "...", "username": "victor", "role": "Buyer", "accountType": "Active" }
}
```

**Errors:** `400` missing fields · `401` invalid credentials · `403` account banned

> The password hash is never returned.

---

### `POST /api/auth/forgot-password`
Initiates a password reset.

**Body:** `{ "email": "..." }`

**200:** `{ "ok": true }` — always returns `true`, regardless of whether the email exists (prevents account enumeration).

> Reset-token generation + email delivery is a stub in this build.

---

## Users — `/api/users`

### `GET /api/users/me` 🔒
Returns the full authenticated user. Buyer `paymentMethods` are populated.

Example (Buyer):
```json
{
  "_id": "6ac5883824158b71a339a794",
  "username": "victor",
  "email": "buyer@marketplace.test",
  "accountType": "Active",
  "role": "Buyer",
  "shippingAddresses": [
    { "_id": "...", "label": "Home", "line1": "123 Elm St", "city": "Starkville", "state": "MS", "postalCode": "39759", "country": "US" }
  ],
  "paymentMethods": [ { "_id": "...", "methodType": "card", "isDefault": true } ],
  "registerDate": "2026-10-06T23:46:00.527Z"
}
```

### `PATCH /api/users/me` 🔒
Update the current user's profile.

**Body** (all optional): `username`, `email`, `address` (a single address object, appended to `shippingAddresses`).

**200:** updated user object.

### `GET /api/users/:id`
Public profile (no auth). Returns `{ _id, username, role, registerDate }`.

**Errors:** `404`

---

## Listings — `/api/listings`

### `GET /api/listings`
Public search. Defaults to `status=Active`.

**Query params**
| param | type | default | notes |
|-------|------|---------|-------|
| `q` | string | — | full-text search (name, description, theme) |
| `theme` | string | — | exact theme filter |
| `status` | string | `Active` | `Active` \| `Pending` \| `Removed`; pass empty to include all |
| `min` | number | — | min price |
| `max` | number | — | max price |
| `page` | number | `1` | |
| `limit` | number | `20` | max 100 |

**200**
```json
{
  "total": 10,
  "page": 1,
  "limit": 1,
  "items": [
    {
      "_id": "6ac5883824158b71a339a7c2",
      "seller": { "_id": "...", "username": "craftcorner", "role": "Seller" },
      "name": "Leather Journal A5",
      "price": 28,
      "stock": 20,
      "description": "Full-grain, refillable.",
      "image": "",
      "scale": "A5",
      "theme": "stationery",
      "status": "Active",
      "creationDate": "2026-10-06T23:46:00.724Z"
    }
  ]
}
```

> Full-text search uses a MongoDB text index; results are ranked by relevance, otherwise sorted by `creationDate` desc.

---

### `GET /api/listings/:id`
Public. Returns a single listing with populated `seller` (`username`).
**Errors:** `404`

---

### `POST /api/listings` 🔒 Seller
Create a listing (owned by the calling seller). New listings start `status: "Pending"` unless specified.

**Body**
| field | type | required | default |
|-------|------|----------|---------|
| `name` | string | yes | |
| `price` | number | yes | |
| `stock` | number | yes | |
| `description` | string | no | `""` |
| `image` | string | no | `""` |
| `scale` | string | no | `""` |
| `theme` | string | no | `""` |
| `status` | string | no | `Pending` |

**201:** the created listing.
**Errors:** `401`/`403`

---

### `PATCH /api/listings/:id` 🔒 Seller (owner) or Admin
Update a listing. Sellers may only edit their own listings.

**200:** updated listing. **Errors:** `403` not owner · `404`

---

### `DELETE /api/listings/:id` 🔒 Seller (owner) or Admin
**Soft delete** — sets `status: "Removed"` (the record is kept).

**200:** the listing with `status: "Removed"`.

---

## Cart — `/api/cart` 🔒 Buyer

### `GET /api/cart`
Returns the buyer's cart (created lazily; returns an empty cart if none exists). Items have populated `listing` and a `lineTotal` virtual.

**200**
```json
{
  "_id": "...",
  "buyer": "6ac5883824158b71a339a794",
  "items": [
    { "_id": "...", "quantity": 2, "unitPrice": 28, "lineTotal": 56, "listing": { "name": "Leather Journal A5" } }
  ],
  "total": 56
}
```

### `POST /api/cart/items`
Add a listing to the cart (increments quantity if already present).

**Body:** `{ "listingId": "...", "quantity": 1 }` (quantity default 1)

**201:** the updated cart. **Errors:** `400` listing unavailable · `404`

### `DELETE /api/cart/items/:cartItemId`
Remove one line item by its cart-item `_id`.

**200:** the updated cart. **Errors:** `404`

### `DELETE /api/cart`
Clear the cart.

**200:** the emptied cart (`items: []`, `total: 0`).

---

## Orders — `/api/orders`

### `POST /api/orders/checkout` 🔒 Buyer
Converts the current cart into an Order: validates stock, decrements `listing.stock`, snapshots prices, creates the order, and clears the cart.

**Body:** `{ "paymentId": "<optional>" }`

**201**
```json
{
  "_id": "6ac5aa5294d8d33214ec7251",
  "buyer": "6ac5883824158b71a339a794",
  "items": [
    { "_id": "...", "listing": "6ac5883824158b71a339a7c2", "quantity": 2, "unitPrice": 28, "seller": "..." }
  ],
  "total": 56,
  "fulfillmentState": "Open",
  "shippingInfo": "",
  "createdAt": "2026-10-07T02:11:30.760Z"
}
```

**Errors:** `400` empty cart or unavailable/insufficient stock · `401`/`403`

### `GET /api/orders` 🔒
- **Buyer:** their own orders.
- **Seller:** orders containing any of their items.
- **Admin:** `403` on this route (use `/api/admin/overview`).

### `GET /api/orders/:id` 🔒
Full order with populated `items.listing`. Accessible to the owning buyer, a seller with items in the order, or an admin.
**Errors:** `403` · `404`

### `PATCH /api/orders/:id` 🔒 Seller or Admin
Update fulfillment.

**Body:** `{ "fulfillmentState": "Shipped", "shippingInfo": "USPS 9400..." }`

`fulfillmentState` ∈ `Open` · `Processing` · `Shipped` · `Delivered` · `Cancelled`

**200:** updated order. **Errors:** `400` invalid state · `404`

---

## Admin — `/api/admin` 🔒 Admin

All routes require an Admin token (guarded at the router level).

### `GET /api/admin/overview`
```json
{ "users": 6, "listings": 12, "orders": 4 }
```

### `GET /api/admin/accounts`
All users (lean documents).

### `POST /api/admin/accounts/:id/approve`
Sets `accountType: "Active"`.

### `POST /api/admin/accounts/:id/deny`
Sets `accountType: "Banned"`.

### `POST /api/admin/accounts/:id/ban`
Sets `accountType: "Banned"`.

### `GET /api/admin/listings?status=`
List listings, optionally filtered by `status` (`Pending`, `Active`, `Removed`).

### `POST /api/admin/listings/:id/approve`
Sets listing `status: "Active"` (approves a pending listing).

---

## Data model (quick reference)

`User` is a base collection with a Mongoose **discriminator** on `role`; all roles live in the `users` collection.

| Model | Key fields |
|-------|-----------|
| **User** (base) | `username`, `email`, `passwordHash` (never serialized), `accountType` (Pending/Active/Banned), `role` (Seller/Admin/Buyer), `registerDate` |
| **Seller** (`User`) | `earnings`, `paymentMethod` |
| **Admin** (`User`) | `adminLevel` |
| **Buyer** (`User`) | `shippingAddresses[]`, `paymentMethods[]` |
| **Listing** | `seller`, `name`, `price`, `stock`, `description`, `image`, `scale`, `theme`, `status` (Pending/Active/Removed), `creationDate` |
| **Cart** | `buyer` (unique), `items[]` (`listing`, `quantity`, `unitPrice`), `total` |
| **Order** | `buyer`, `items[]` (`listing`, `quantity`, `unitPrice`, `seller`), `total`, `fulfillmentState`, `shippingInfo`, `payment` |
| **Payment** | `methodType`, `token` (hidden), `isDefault`, `owner` + `ownerModel` |
| **RefundRequest** | `order`, `orderItem`, `reason`, `status` (Pending/Approved/Denied), `decisionReason` |
| **Notification** | `recipient` + `recipientModel`, `type`, `message`, `read` |

Domain methods implemented on the models: `Seller.createListing/editListing/removeListing/viewOrders`, `Admin.approveAccount/denyAccount/banAccount/approveListing/removeListing/viewAccounts/viewSiteOverview`, `Buyer.addToCart/removeFromCart/checkout/viewOrders/requestRefund/compareListings`, `Listing.isAvailable()`, `Cart.calculateTotal()`, `Payment.charge()`, `RefundRequest.approve()/deny()`.

---

## Quick start (curl)

```bash
BASE=http://127.0.0.1:4000

# log in as the demo buyer
TOKEN=$(curl -s -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"buyer@marketplace.test","password":"buyer1234"}' | jq -r .token)

# browse listings
curl -s "$BASE/api/listings?q=mug" | jq

# add to cart
curl -s -X POST $BASE/api/cart/items \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"listingId":"<LISTING_ID>","quantity":2}' | jq

# checkout
curl -s -X POST $BASE/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{}' | jq
```

## Demo accounts
| role | email | password |
|------|-------|----------|
| Admin | admin@marketplace.test | admin1234 |
| Seller | seller@marketplace.test | seller1234 |
| Seller | seller2@marketplace.test | seller1234 |
| Seller | seller3@marketplace.test | seller1234 |
| Buyer | buyer@marketplace.test | buyer1234 |
| Buyer | buyer2@marketplace.test | buyer1234 |

## Machine-readable spec
See [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.0) — import into Postman, Insomnia, or Swagger UI.
