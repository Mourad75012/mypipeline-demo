# Marketplace Backlog

A prioritized backlog for building a multi-vendor merchant site — an Amazon-like marketplace
where many independent sellers list products and buyers use one cart, one checkout, and one
support relationship.

- **Source of truth:** [`tasks/tasks.json`](tasks/tasks.json) — 46 tasks in Task Master format.
- **Product definition:** [`scripts/prd.txt`](scripts/prd.txt) — the PRD these tasks derive from.
- **Per-task files:** `tasks/task_001.txt` … `tasks/task_046.txt`, regenerated with `npm run generate`.

```bash
npm run list                              # whole backlog
node scripts/dev.js next                  # next unblocked task, respecting dependencies
node scripts/dev.js show 17               # one task in full
node scripts/dev.js set-status --id=1 --status=done
```

---

## How this is prioritized

Four rules, applied in order. Where they conflict, the earlier rule wins.

**1. Retire the biggest risk first.** Task 7 — the payment provider account — has no code
dependencies and sits in Phase 0 anyway. Marketplace payment accounts require business
verification that takes weeks of calendar time and is entirely outside engineering's control.
It is the longest-lead item in the project and the one most likely to invalidate design
assumptions. Start the paperwork on day one.

**2. Make revenue possible before making it good.** Phase 1 is one indivisible slice: browse →
cart → checkout → pay → confirm. Every task in it exists because the slice does not work
without it. Nothing that merely improves the path belongs in Phase 1.

**3. Follow the dependency graph, not the wish list.** Seller onboarding (22) is genuinely
important and still comes after the buyer path, because seller value is entirely derived from
buyer demand existing. A seller portal with no buyers is worth nothing.

**4. Defer anything that needs data you do not have yet.** Recommendations (41) before traffic
produce embarrassing suggestions. Search relevance work (31) before a large catalog optimizes
a problem you do not have. Performance work (36) before real traffic optimizes the wrong pages.

### Priority field mapping

| `tasks.json` | Meaning |
|---|---|
| `high` | Must ship to reach the next phase gate. 33 tasks. |
| `medium` | Needed before public launch or before scaling, not before the gate. 8 tasks. |
| `low` | Growth work. Deferrable indefinitely without blocking revenue. 5 tasks. |

Sizing: **S** ≤ 3 days · **M** 1–2 weeks · **L** 2–4 weeks · **XL** > 4 weeks, split before starting.

---

## Phase 0 — Foundation (tasks 1–7)

**Gate:** a commit deploys to staging automatically, and a user can register and log in.

| # | Task | Pri | Size |
|---|---|---|---|
| 1 | Application scaffolding and shared tooling | high | M |
| 2 | Core database schema and migrations | high | L |
| 3 | CI/CD pipeline and environments | high | M |
| 4 | Buyer authentication and session management | high | M |
| 5 | Design system and base UI components | high | M |
| 6 | Observability baseline | medium | S |
| 7 | Payment provider account and split-payment spike | high | S + weeks of waiting |

Two decisions here are effectively irreversible and deserve real time:

- **The money model (task 2).** Double-entry ledger from the first migration, money as integer
  minor units with an explicit currency. Retrofitting correct accounting onto a marketplace
  that has already moved real money is a multi-month remediation.
- **The catalog model (task 2, implemented in task 8).** Product → Variant → Offer, where
  several sellers attach competing offers to one shared variant. Per-seller independent
  products duplicate the catalog, split reviews across the duplicates, and make price
  comparison impossible.

Task 3 matters more than it looks: the current `Jenkinsfile` only echoes and runs `run.sh`.
Until deployment is automated, every later task pays a manual release tax.

---

## Phase 1 — MVP: the buyer's money path (tasks 8–21)

**Gate:** one real buyer pays real money for a real product, and the money settles correctly.

| # | Task | Pri | Size |
|---|---|---|---|
| 8 | Catalog domain: products, variants, offers | high | L |
| 9 | Category taxonomy and attribute schema | high | M |
| 10 | Internal catalog seeding tool | high | S |
| 11 | Category browse and product listing pages | high | M |
| 12 | Product detail page | high | M |
| 13 | Basic keyword search (Postgres full-text) | high | S |
| 14 | Shopping cart | high | M |
| 15 | Address book and delivery options | high | M |
| 16 | Checkout flow | high | L |
| 17 | Payment integration and card tokenization | high | L |
| 18 | Order creation, ledger entries, confirmation | high | L |
| 19 | Transactional notification infrastructure | high | M |
| 20 | Buyer order history and order detail | high | M |
| 21 | Inventory reservation and stock management | high | M |

**No seller portal in this phase.** Task 10 is a deliberately unpolished internal tool for
staff to seed the catalog by hand, and the first seller is onboarded as a database record.
That is enough to prove the money path, and it unblocks every storefront task for a few days
of work instead of a few weeks.

**Tasks 16, 17, 18 and 21 are one continuous slice.** A partially built checkout has exactly
zero value. Plan them together, not as four independent tickets.

**Search stays on Postgres full-text here.** It is adequate to roughly 10,000 listings and
defers an entire piece of infrastructure out of the MVP. Task 13 starts logging zero-result
queries from day one — that log is what tells you when task 31 has become necessary, and it
is what makes task 31 tractable when you get there.

---

## Phase 2 — Multi-vendor (tasks 22–29)

**Gate:** a seller onboards, lists, sells and gets paid with zero platform staff involvement.

| # | Task | Pri | Size |
|---|---|---|---|
| 22 | Seller accounts, onboarding, KYC | high | L |
| 23 | Seller listing management | high | L |
| 24 | Seller inventory management | high | M |
| 25 | Multi-seller order splitting and fulfillment | high | L |
| 26 | Commission calculation and seller ledger | high | L |
| 27 | Seller payouts | high | L |
| 28 | Seller dashboard and performance metrics | medium | M |
| 29 | Bulk catalog import and export | medium | M |

This is where the platform stops being a shop and becomes a marketplace, and it is where
regulation bites: KYC/AML verification is a legal requirement for handling third-party funds,
not a product choice. A seller must not be able to list or receive funds before verification
completes — enforce that in the state machine, not in the UI.

Task 25 is the genuinely hard one. One buyer payment becomes several independent fulfillment
obligations with independent timelines, independent failures, and independent refunds — while
the buyer must still see one coherent order.

Tasks 26 and 27 are correctness work, not feature work. Sellers reconcile these numbers
against their own books, and discrepancies destroy trust permanently. Two cases that are
routinely missed and should be modeled explicitly: a refund arriving after the payout has
already been sent, and a seller's balance going negative when refunds exceed sales in a period.

---

## Phase 3 — Trust and scale (tasks 30–38)

**Gate:** safe to open public seller signup and spend money on acquisition.

| # | Task | Pri | Size |
|---|---|---|---|
| 30 | Reviews and ratings | high | M |
| 31 | Search service: facets, autocomplete, relevance | high | L |
| 32 | Returns and refunds | high | L |
| 33 | Admin back-office and content moderation | high | L |
| 34 | Fraud controls and risk review | high | M |
| 35 | Security hardening and penetration test | high | M |
| 36 | Performance, caching, and CDN | medium | M |
| 37 | GDPR and data protection compliance | high | M |
| 38 | Accessibility audit and remediation | medium | M |

Three of these gate public signup specifically, and none of them can be added quickly once the
problem shows up:

- **33 — moderation.** The moment sellers self-onboard without staff review, prohibited and
  counterfeit listings arrive. The tooling takes longer to build than the problem takes to appear.
- **34 — fraud.** Fraud arrives the moment payments work and scales the moment signup opens.
  Excessive chargebacks put the payment account itself at risk, which is existential rather
  than merely expensive.
- **35 — security.** The highest-value item is the object-level authorization audit: can a user
  reach another user's order, another seller's listings, another seller's payouts? Broken
  object-level authorization is the most common and most damaging API vulnerability.

Task 30 is high within this phase because reviews compound. They are the primary trust signal
on a marketplace where the buyer has no relationship with the seller, and starting late means
the catalog stays thin on reviews for a long time afterwards.

Task 36 is deliberately late — it exists to be executed against measurements from real traffic
rather than predictions. The measurement setup already exists from task 6.

---

## Phase 4 — Growth (tasks 39–46)

No gate. Sequence by measured impact.

| # | Task | Pri | Size |
|---|---|---|---|
| 39 | Promotions, coupons, discounts | medium | L |
| 40 | Wishlist and save for later | low | S |
| 41 | Recommendations | low | L |
| 42 | Product questions and answers | low | M |
| 43 | Seller API | low | L |
| 44 | Internationalization and multi-currency | medium | XL — split first |
| 45 | Analytics and business intelligence | medium | M |
| 46 | Progressive web app and mobile experience | low | L |

**Consider pulling task 45's event collection forward into Phase 3.** Search relevance (31),
promotions (39), and recommendations (41) all need it to know whether they worked. The
dashboards can wait; the events cannot be collected retroactively.

**Task 44 is four projects wearing one hat** — translation, currency, tax, and logistics —
and should be split before anyone starts it. Two of its hardest constraints are already
satisfied by earlier decisions: money is stored as minor units with an explicit currency
(task 2), and prices are captured on order lines rather than referenced live (task 18).
Those are the parts that would have been prohibitive to retrofit.

---

## Explicitly out of scope

Owned logistics and warehousing, a Prime-style subscription, third-party advertising, and
first-party retail where the platform sells its own inventory. Each is a separate product
with its own roadmap, and each would change the model above substantially.

## What to watch for

- **Payment provider verification (task 7)** is the critical path from day one and no amount
  of engineering effort shortens it.
- **Cold start.** Hand-recruit sellers in one focused category. A narrow catalog that is deep
  beats a broad one that is thin.
- **Scope creep toward Amazon parity.** The phase boundaries are commitments. Anything not on
  the money path in Phase 1 is deferred, including things that feel obviously necessary.
