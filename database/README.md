# Models and Minis — Database API

MongoDB + Express + Mongoose API implementing the marketplace class diagram
(`User` → `Seller` / `Admin` / `Buyer`, plus `Listing`, `Cart`/`CartItem`,
`Order`/`OrderItem`, `Payment`, `RefundRequest`, `Notification`).

> **Documentation** — [`API.md`](./API.md) (full endpoint reference) · [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.0, import into Postman/Insomnia/Swagger UI).

## Layout
```
database/
├─ docker-compose.yml        # MongoDB 7 + Mongo Express (browser UI :8082)
├─ .env.example              # compose secrets → copy to .env
├─ .gitignore
├─ LICENSE
├─ README.md                 # this file
├─ API.md                    # full endpoint reference
├─ openapi.yaml              # OpenAPI 3.0 spec
└─ api/
   ├─ .env.example           # API config → copy to .env
   ├─ package.json
   ├─ package-lock.json
   ├─ scripts/seed.js        # idempotent seeder (--reset to wipe)
   ├─ scripts/smoke.js       # end-to-end API test
   └─ src/
      ├─ server.js
      ├─ config/db.js
      ├─ middleware/auth.js  # JWT + role guard
      ├─ models/             # Mongoose schemas
      └─ routes/             # auth, users, listings, cart, orders, admin
```

## Build from scratch

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ and npm, [Docker](https://docs.docker.com/get-docker/) with Compose.

```bash
# 1. clone + enter
git clone <repo-url> marketplace
cd marketplace

# 2. create env files from the examples
cp .env.example .env                 # compose (Mongo root user/pw)
cp api/.env.example api/.env         # API (MONGO_URI, JWT_SECRET)
#    edit api/.env and set a real JWT_SECRET, e.g.:
#    openssl rand -hex 32

# 3. start the database (MongoDB + Mongo Express)
docker compose up -d

# 4. install API deps, seed, run
cd api
npm install
npm run seed                         # idempotent demo data
npm start                            # http://127.0.0.1:4000
```

Then open the API at `http://127.0.0.1:4000/health` and the DB browser at `http://127.0.0.1:8082`.

Verify the API end-to-end (server must be running):
```bash
cd api && npm run smoke              # 15 checks
```

> **Ports used:** API `4000`, MongoDB `127.0.0.1:27017`, Mongo Express `8082`.
> Change them in `api/.env` (`PORT`) and `docker-compose.yml` if they collide.

> **Docker permission note:** if `docker` fails with permission errors, your shell lacks the `docker` group (common in long-lived shells — a fresh login fixes it). Workaround: prefix commands with `sudo`, or run through a fresh login.

## Seeding
Two commands:
| command | behavior |
|---------|----------|
| `npm run seed` | **Idempotent.** Ensures demo users/listings/orders exist. Re-running is safe: upserts users (by email) and listings (by seller+name), skips orders/carts/refunds/notifications if already present. Run this whenever the DB is empty or partially populated — no data loss. |
| `npm run seed:reset` | **Destructive.** Drops the whole database, then seeds fresh. Use when you want a clean slate. |

Content seeded: 6 accounts (1 admin, 3 sellers, 2 buyers), 12 listings (10 active, 1 pending, 1 removed), 3 orders (one Shipped) built through the real cart→checkout flow, 2 carts (leftover), 2 payment methods, 1 pending refund request, 3 notifications.

> The seeder also works as a recovery script: if the DB is wiped (e.g. volume loss), `npm run seed` rebuilds a usable demo dataset in one step.
>

## Demo accounts
| role    | email                     | password   |
|---------|---------------------------|------------|
| Admin   | admin@marketplace.test    | admin1234  |
| Seller  | seller@marketplace.test   | seller1234 |
| Seller  | seller2@marketplace.test  | seller1234 |
| Seller  | seller3@marketplace.test  | seller1234 |
| Buyer   | buyer@marketplace.test    | buyer1234  |
| Buyer   | buyer2@marketplace.test   | buyer1234  |

## Endpoints
**Auth**
- `POST /api/auth/register` `{ role: Buyer|Seller, username, email, password }`
- `POST /api/auth/login` `{ identifier, password }` → `{ token, user }`
- `POST /api/auth/forgot-password` `{ email }`

**Users**
- `GET /api/users/me` · `PATCH /api/users/me` · `GET /api/users/:id`

**Listings**
- `GET /api/listings?q=&theme=&status=&min=&max=&page=&limit=` (public)
- `GET /api/listings/:id` (public)
- `POST /api/listings` (Seller)
- `PATCH /api/listings/:id` (Seller owner / Admin)
- `DELETE /api/listings/:id` (Seller owner / Admin — soft delete → status `Removed`)

**Cart** (Buyer)
- `GET /api/cart` · `POST /api/cart/items` `{ listingId, quantity }`
- `DELETE /api/cart/items/:cartItemId` · `DELETE /api/cart`

**Orders**
- `POST /api/orders/checkout` (Buyer)
- `GET /api/orders` · `GET /api/orders/:id`
- `PATCH /api/orders/:id` `{ fulfillmentState, shippingInfo }` (Seller/Admin)

**Admin**
- `GET /api/admin/overview` · `GET /api/admin/accounts`
- `POST /api/admin/accounts/:id/{approve|deny|ban}`
- `GET /api/admin/listings?status=` · `POST /api/admin/listings/:id/approve`

## Model → diagram mapping
- `User` (base, Mongo discriminator `role`) with methods `login`, `updateProfile`, `resetPassword`.
- `Seller` → `createListing`, `editListing`, `removeListing`, `viewOrders`.
- `Admin` → `approveAccount`, `denyAccount`, `banAccount`, `approveListing`, `removeListing`, `editListing`, `viewAccounts`, `viewSiteOverview`.
- `Buyer` → `addToCart`, `removeFromCart`, `checkout`, `compareListings`, `viewOrders`, `requestRefund`.
- `Listing.isAvailable()`, `Cart.calculateTotal()`, `CartItem` (lineTotal virtual),
  `Order`/`OrderItem`, `Payment.charge()` (gateway stub), `RefundRequest.approve()/deny()`.

