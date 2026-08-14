# Product Requirements Document
## E-Commerce Backend API — Version 1

**Document status:** Final — Ready for Engineering
**Prepared for:** Backend Engineering Team
**Document owner:** Product / Architecture

---

## Table of Contents

1. Executive Summary
2. Product Vision
3. Business Goals
4. Problem Statement
5. Target Users
6. User Roles
7. Functional Requirements
8. Non-Functional Requirements
9. Complete Feature List
10. User Stories
11. Business Rules
12. Complete Business Logic (Module Deep-Dives)
13. Database Design
14. Entity Relationships
15. API Planning
16. Folder Architecture
17. Security Requirements
18. Validation Rules
19. Error Handling Strategy
20. Development Roadmap
21. Future Improvements
22. Risks and Assumptions
Appendix A — Architectural Decision Log

---

## 1. Executive Summary

This document specifies the requirements for **Version 1** of a production-grade E-Commerce Backend API — a scalable, single-seller online marketplace backend built to support Guest, Customer, and Administrator users. The system is designed around a **Product → Variant** catalog model, a fully data-driven **dynamic attribute (EAV)** system, atomic transactional business flows, and a set of clean domain abstractions (Storage, Search, Notifications) that allow the platform to grow — including future multi-vendor support, payment gateway integration, and search-engine migration — without requiring architectural rewrites.

The backend will be built on **Node.js, Express.js, PostgreSQL, and Prisma**, using **JWT + rotating refresh tokens** for authentication, and is designed to be handed directly to a backend engineering team for implementation with no further clarification required.

---

## 2. Product Vision

To provide a secure, reliable, and extensible backend foundation for a modern e-commerce storefront — one that correctly models real-world retail complexity (variants, dynamic attributes, inventory concurrency, immutable financial records) from day one, while deliberately deferring genuinely optional complexity (multi-vendor, live payment gateways, dedicated search engines) to clearly documented future phases.

The system is designed so that **every major subsystem can evolve independently** without breaking the others — the payment method can change, the search backend can change, the file storage backend can change, and the notification provider can change, all without touching unrelated business logic.

---

## 3. Business Goals

- Launch a fully functional single-seller online store capable of processing real orders end-to-end (browse → cart → checkout → payment confirmation → fulfillment).
- Support guest checkout to maximize conversion.
- Provide administrators with full operational control (catalog, orders, payments, coupons, reviews, users) via a dashboard-ready API.
- Establish a data model and codebase that can scale toward a real commercial product — more traffic, more products, more integrations — without requiring a schema or architecture rewrite.
- Maintain complete, immutable financial and historical accuracy (orders, payments, pricing) suitable for accounting, disputes, and audits.
- Keep Version 1 scope disciplined: full-featured where it matters (inventory integrity, security, financial correctness), intentionally simple where deferring complexity is the right engineering call (multi-vendor, live payment gateways, dedicated search engines).

---

## 4. Problem Statement

Small-to-mid-size businesses need an e-commerce backend that behaves like a real commercial platform — correct inventory handling under concurrency, trustworthy reviews, immutable order history, secure authentication — without the overhead of enterprise multi-vendor or multi-currency complexity they don't yet need. Most homegrown backends either under-engineer critical correctness concerns (overselling stock, mutable financial records, insecure auth) or over-engineer speculative features that slow down launch. This system is designed to hit the correct balance: **non-negotiable rigor around data integrity, money, and security; deliberate simplicity everywhere else**, with every simplification designed to be extended later without rework.

---

## 5. Target Users

| User Type | Description |
|---|---|
| **Guest** | Unauthenticated visitor. Can browse the catalog, search, filter, manage an anonymous cart, and complete a full purchase via guest checkout. |
| **Customer** | Registered, authenticated user. Can do everything a Guest can, plus maintain an address book, wishlist, order history, submit verified reviews, and manage sessions across multiple devices. |
| **Administrator** | Full operational access to the platform: catalog management, order management, payment confirmation, inventory, coupons, review moderation, and user oversight. |

---

## 6. User Roles

Version 1 implements exactly two authenticated roles, modeled as an **enum**, not a boolean, to support future RBAC expansion without schema changes:

```
enum Role {
  CUSTOMER
  ADMIN
}
```

**Future-reserved roles (not implemented in v1, documented for RBAC extensibility):** `SUPER_ADMIN`, `ORDER_MANAGER`, `SUPPORT_STAFF`, `CATALOG_MANAGER`.

All authorization is enforced through **reusable authorization middleware** (e.g., `requireAuth`, `requireRole([...])`) rather than inline role checks in controllers, so introducing granular RBAC later is a middleware/permission-table change, not a codebase-wide refactor.

---

## 7. Functional Requirements

The system must support the following functional capabilities:

1. User registration, login, logout, and secure session management (multi-device).
2. Password reset via email.
3. Customer address book management (create, update, delete, set default shipping/billing).
4. Hierarchical category management (up to 3 levels: Department → Category → Subcategory).
5. Brand management.
6. Product catalog management with Product → Variant architecture.
7. Dynamic, category-scoped product attributes (EAV model) with admin-configurable rules (required, filterable, display order).
8. Product image galleries at both Product and Variant level, with fallback behavior.
9. Variant-level inventory management with transactional, race-condition-safe stock control.
10. Guest and Customer shopping cart, with guest-to-customer cart merge on login.
11. Product-level wishlist management.
12. Order-level coupon system (fixed, percentage with cap, free shipping).
13. Atomic, all-or-nothing checkout (inventory validation, coupon validation, payment record, order creation, address snapshotting, order item snapshotting).
14. Admin-confirmed manual payment recording (gateway-ready `Payment` entity).
15. Full order lifecycle management with a complete, queryable status audit trail.
16. Verified-purchase-only product reviews with admin moderation (hide/remove).
17. Full-text search, multi-attribute filtering, sorting, and pagination across the product catalog.
18. Configurable shipping methods and tax rate application at checkout.
19. Transactional email notifications for all key account and order events (best-effort, non-blocking).
20. Admin dashboard-supporting endpoints for catalog, order, payment, coupon, review, and basic sales analytics.

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | JWT + rotating, hashed, revocable refresh tokens; RBAC-ready authorization middleware; Helmet; tiered rate limiting; explicit CORS allow-list; input validation/sanitization; HTTPS enforced in production; bcrypt/Argon2 password hashing; no internal error detail (stack traces, SQL, Prisma errors) ever exposed to clients. |
| **Data Integrity** | All checkout-critical operations (inventory, payment, coupon usage, order creation) execute inside atomic PostgreSQL transactions with row-level locking where needed. Financial and historical data (OrderItem pricing, addresses, customer contact info) is immutably snapshotted at time of transaction. |
| **Auditability** | Full `OrderStatusHistory` audit trail; structured logging with request correlation IDs; every entity has `createdAt`/`updatedAt`; soft-deletable entities include `deletedAt`. |
| **Scalability** | Variant-level inventory and pricing; EAV-based dynamic attributes; abstracted Storage, Search, and Notification services; API versioning (`/api/v1/`) from day one; stateless access tokens enabling horizontal scaling. |
| **Maintainability** | Centralized error handling with domain-specific exceptions; standardized response envelope; layered folder architecture (routes → controllers → services → repositories/Prisma); consistent naming and status-code conventions. |
| **Performance** | Proper PostgreSQL indexing (GIN indexes for full-text search and JSONB where applicable, composite indexes for EAV filtering); offset-based pagination for v1; denormalized fields (`avgRating`, `salesCount`) for expensive-to-compute sort/display values. |
| **Observability** | Structured (JSON) production logging (Pino recommended); per-request correlation ID propagated through logs and included in error responses; startup validation of required environment variables (fail-fast). |
| **Availability** | Email/notification failures must never fail or roll back a business transaction (best-effort, async, post-commit dispatch). |
| **Portability** | File storage, search, and notification delivery are all implemented behind interfaces/abstractions to permit swapping providers (local disk → S3, Postgres search → Elasticsearch/Meilisearch, direct SMTP → job-queued providers) without business-logic changes. |

---

## 9. Complete Feature List

**Authentication & Sessions:** Register, Login, Logout (current device), Logout (all devices), Admin Force Logout, Refresh Token rotation, Password Reset, Email Verification.

**Users & Addresses:** Profile management, Address book (CRUD, default shipping/billing flags).

**Catalog:** Categories (hierarchical, 3-level), Brands, Products, Product Variants, Dynamic Attributes (EAV), Category–Attribute mapping, Product Images (product-level + variant-level).

**Inventory:** Variant-level stock, transactional stock decrement, out-of-stock handling.

**Shopping:** Cart (guest + customer, merge-on-login), Wishlist (product-level).

**Commerce:** Coupons (fixed/percentage/free shipping), Checkout (atomic, all-or-nothing), Orders, Order Items (snapshotted), Order Addresses (snapshotted), Order Status History, Payments (manual/admin-confirmed, gateway-ready), Shipping Methods, Tax calculation.

**Post-Purchase:** Reviews (verified-purchase-only, editable, admin moderation).

**Discovery:** Full-text search, filtering (category, brand, price, attributes, availability), sorting (newest, oldest, price asc/desc, highest rated, best selling), pagination.

**Admin:** Catalog management, order management, payment confirmation, coupon management, review moderation, user management, basic sales/inventory analytics.

**Platform:** API versioning, standardized response envelope, centralized error handling, structured logging with request correlation, security middleware baseline, transactional email notifications.

---

## 10. User Stories

**Guest**
- As a Guest, I want to browse and search products so I can decide what to buy without creating an account.
- As a Guest, I want to add items to a cart and complete checkout with just my email and shipping details, so I can purchase quickly.
- As a Guest, I want my cart to merge into my account cart if I register or log in mid-shopping, so I don't lose my selections.

**Customer**
- As a Customer, I want to save multiple addresses so I can check out faster in the future.
- As a Customer, I want to save products to a wishlist without committing to a specific variant, so I can decide on size/color later.
- As a Customer, I want to view my order history and its status timeline, so I know exactly where my order stands.
- As a Customer, I want to leave a review only after I've received a product, so reviews on the platform are trustworthy.
- As a Customer, I want to stay logged in across my phone and browser independently, and be able to log out of all devices if I suspect my account is compromised.

**Administrator**
- As an Administrator, I want to create products with category-specific attribute fields auto-generated in the form, so I don't have to manually configure irrelevant fields.
- As an Administrator, I want to confirm payments manually for Version 1, so I can operate the store before a payment gateway is integrated.
- As an Administrator, I want to view a full audit trail of every order's status changes, so I can support customers and resolve disputes.
- As an Administrator, I want to hide inappropriate reviews without deleting the customer's account or purchase history.
- As an Administrator, I want to see best-selling products and low-stock variants at a glance, so I can make restocking and merchandising decisions.

---

## 11. Business Rules

1. Every `Product` must have at least one `ProductVariant`; simple products have exactly one default variant.
2. Price, SKU, and stock quantity are always tracked at the **Variant** level — never at the Product level.
3. Attributes are defined independently of categories and linked via a many-to-many `CategoryAttribute` mapping with `isRequired`, `isFilterable`, and `displayOrder` metadata.
4. Category depth is soft-limited to 3 levels (Department → Category → Subcategory), enforced at the application layer.
5. Child categories do **not** inherit attribute mappings from parent categories in v1.
6. Stock is validated and decremented only at checkout, inside a single database transaction using row-level locking (`SELECT ... FOR UPDATE`). Stock is never reserved at add-to-cart time.
7. Checkout is strictly **all-or-nothing**: if any line item fails stock validation, the entire order fails, no order/payment/inventory/coupon-usage record is created, and the customer is told exactly which item(s) failed.
8. Orders always store an **immutable snapshot** of: item pricing/details (`OrderItem`), shipping/billing address (`OrderAddress`), and customer contact info (name, email, phone) — regardless of later changes to Product, Variant, Address, or User records.
9. Every order status transition must be recorded in `OrderStatusHistory` (previous status, new status, changed by, optional reason, timestamp).
10. Payment is modeled as an independent domain entity (`Payment`), not a status flag on `Order`. In v1, only an authenticated Admin can transition an order from `PENDING` to `PAID`, via a single atomic transaction that updates `Payment`, `Order.status`, and `OrderStatusHistory` together.
11. Coupons apply to the entire order only in v1 (no product/category scoping), one coupon per order (no stacking), and all coupon rules (validity window, usage limits, minimum order amount) must be validated and usage recorded inside the same transaction as order creation.
12. A Customer may submit exactly one review per Product, and only if they have at least one `OrderItem` for that product with an associated Order in `DELIVERED` status. Existing reviews are edited, not duplicated.
13. Reviews publish immediately in v1 (no pre-moderation queue); Admins may hide/remove reviews post-publish.
14. Wishlist operates at the **Product** level (not Variant), distinct from Cart/Order/Inventory, which always operate at the Variant level.
15. Product images may exist at the Product level (default/shared gallery) and optionally at the Variant level (override gallery); variant-specific images take display precedence when present.
16. All business/domain entities (Products, Variants, Categories, Coupons, etc.) use soft-delete (`deletedAt` timestamp) rather than hard deletion. User accounts are deactivated, not deleted. Hard deletion is reserved for ephemeral/system data only (expired refresh tokens, OTPs, cache entries, temp files).
17. Guest checkout is permitted without account creation; guest carts are identified by an anonymous token and merged into the customer's cart on login/registration (same-variant quantities are summed).
18. All monetary fields use `Decimal` (`NUMERIC(12,2)`) with an accompanying ISO 4217 `currencyCode` — never floating-point types.
19. All primary keys are UUIDs. All entities carry `createdAt`/`updatedAt`; soft-deletable entities also carry `deletedAt`.
20. Authorization is role-based (`CUSTOMER`, `ADMIN` in v1) and enforced exclusively through reusable middleware, never inline controller checks.

---

## 12. Complete Business Logic (Module Deep-Dives)

Each module below follows the required structure: Business Goal, Inputs, Validations, Business Rules, Database Operations, Success Flow, Failure Cases, Edge Cases, Security Considerations, Scalability Considerations, Future Enhancements.

### 12.1 Authentication & Session Management

**Business Goal:** Securely authenticate Guests into Customers, and Customers/Admins into the platform, with revocable, multi-device session support.

**Inputs:** Email, password (registration/login); refresh token (refresh flow); device metadata (user agent, IP).

**Validations:** Email format and uniqueness; password strength (minimum length/complexity); refresh token existence, non-revocation, non-expiry, and hash match.

**Business Rules:** Access tokens are short-lived (~15 min) and stateless. Refresh tokens are long-lived (~7–30 days), stored hashed in the database, and rotate on every use. Reuse of an already-rotated (revoked) refresh token is treated as compromise and revokes the entire session family for that user.

**Database Operations:** Insert `User` on registration; insert `RefreshToken` row on login/refresh; update `revokedAt`/`lastUsedAt` on rotation; bulk-revoke on "logout all devices" or "admin force logout."

**Success Flow:** Register/Login → issue access token + refresh token → store hashed refresh token with device metadata → client uses access token until expiry → client silently refreshes via refresh token → rotation issues new pair.

**Failure Cases:** Invalid credentials → `401 UNAUTHORIZED`. Expired/revoked/reused refresh token → `401` + full session-family revocation on reuse detection.

**Edge Cases:** User logged in on 5+ devices simultaneously; refresh token used concurrently from two requests (race condition — handle via atomic revoke-then-issue).

**Security Considerations:** Passwords hashed with bcrypt/Argon2; refresh tokens hashed at rest (never stored plaintext); rate-limited auth endpoints; no user-enumeration leakage on login/registration error messages.

**Scalability Considerations:** Stateless access tokens allow horizontal API scaling without shared session state; only refresh operations touch the database.

**Future Enhancements:** OAuth/social login, 2FA/MFA, device trust and anomaly detection.

### 12.2 Product Catalog (Product, Variant, Attributes)

**Business Goal:** Model a flexible catalog supporting both simple and configurable products without requiring schema changes for new categories/attributes.

**Inputs:** Product name, description, category, brand, base metadata; one or more variants (SKU, price, stock, attribute values); images.

**Validations:** Every product must have ≥1 variant; variant SKU uniqueness; required attributes (per `CategoryAttribute.isRequired`) must have values before a product can be published.

**Business Rules:** Price/stock/SKU live only on `ProductVariant`. Attributes are assigned to categories via `CategoryAttribute`, not hardcoded to Product/Variant tables.

**Database Operations:** Insert `Product` → insert ≥1 `ProductVariant` rows → insert `VariantAttributeValue` links → insert `ProductImage` rows (product- and/or variant-scoped).

**Success Flow:** Admin selects category → form dynamically renders required/optional attributes per `CategoryAttribute` → admin fills product + variant details → system persists catalog entry.

**Failure Cases:** Missing required attribute → `VALIDATION_ERROR` with field-level detail; duplicate SKU → `409 CONFLICT`.

**Edge Cases:** Product with a single default variant (simple product) must behave identically to a "no variants" product from the customer's perspective; category attribute mapping changes after products already exist (products aren't retroactively invalidated).

**Security Considerations:** Only `ADMIN` can create/update/delete catalog entries.

**Scalability Considerations:** EAV model with indexed `VariantAttributeValue.attributeValueId` supports efficient faceted filtering without schema growth.

**Future Enhancements:** Attribute inheritance from parent categories; bulk product import/export; multi-vendor `sellerId` scoping.

### 12.3 Inventory & Checkout Concurrency

**Business Goal:** Guarantee that stock can never be oversold, even under concurrent checkout requests.

**Inputs:** Cart contents (variant IDs + quantities) at checkout time.

**Validations:** Each requested quantity must not exceed current available stock at the moment of the transaction.

**Business Rules:** Stock is not reserved at add-to-cart time. At checkout, a single database transaction locks the relevant variant rows (`SELECT ... FOR UPDATE`), re-validates stock, decrements it, and only then proceeds to create the order. All-or-nothing: any single failed item aborts the entire transaction.

**Database Operations:** Row-level lock on `ProductVariant` stock column → validate → decrement → insert `Order`, `OrderItem`(s), `Payment`, `OrderAddress`(es), `OrderStatusHistory`, `CouponUsage` (if applicable) — all within one transaction.

**Success Flow:** Checkout initiated → transaction begins → stock locked and validated → order and related records created → transaction commits → cart cleared.

**Failure Cases:** Insufficient stock on any item → transaction rolled back entirely → `OUT_OF_STOCK` error response identifying the specific unavailable variant(s).

**Edge Cases:** Two customers checking out the last unit simultaneously — row-level locking guarantees only one transaction succeeds; the other receives a clean out-of-stock failure, not a corrupted order.

**Security Considerations:** Server-side stock re-validation is mandatory regardless of what the client believed was available (never trust client-side cart state for final pricing/availability).

**Scalability Considerations:** Locking is scoped to only the specific variant rows involved, minimizing contention versus table-level locks.

**Future Enhancements:** Redis-based cart reservation system with configurable TTL (e.g., 15 minutes) to improve UX by soft-reserving stock before checkout begins.

### 12.4 Orders, Payments, and Status Lifecycle

**Business Goal:** Maintain an accurate, auditable, immutable record of every transaction and its lifecycle.

**Inputs:** Cart, selected shipping/billing address, selected shipping method, optional coupon code, guest contact info (if applicable).

**Validations:** Coupon validity (active, within date window, minimum order amount met, usage limits not exceeded); address completeness; stock availability (see 12.3).

**Business Rules:** Order statuses: `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` reachable from `PENDING`/`PAID`, `REFUND_REQUESTED → REFUNDED` reachable from `PAID`/`PROCESSING`/`SHIPPED`/`DELIVERED`, and `RETURNED` reachable from `DELIVERED`. Every transition is recorded in `OrderStatusHistory`. Payment confirmation (`PENDING → PAID`) is an Admin-only action in v1, executed transactionally alongside `Payment` record creation/update and history logging.

**Database Operations:** Insert `Order` (with snapshotted customer contact fields), `OrderItem`(s) (with full pricing/detail snapshot), `OrderAddress`(es), initial `OrderStatusHistory` row; later, Admin payment confirmation inserts/updates `Payment` and appends a new `OrderStatusHistory` row.

**Success Flow:** Checkout completes → Order created in `PENDING` → Admin confirms payment out-of-band → Order moves to `PAID` → fulfillment proceeds through `PROCESSING → SHIPPED → DELIVERED`.

**Failure Cases:** Invalid/expired coupon → `COUPON_INVALID`/`COUPON_EXPIRED`; stock failure → `OUT_OF_STOCK` (order not created).

**Edge Cases:** Guest order with no `customerId` must still support the full lifecycle and history exactly like a registered customer's order; a product/variant referenced by a historical order being later soft-deleted must not affect the ability to view that order.

**Security Considerations:** Status transitions validated against the allowed state machine server-side; only `ADMIN` can move orders through fulfillment/payment states.

**Scalability Considerations:** `OrderStatusHistory` as an append-only table supports high write volume and simple indexing by `orderId`.

**Future Enhancements:** `PAYMENT_PENDING` state and webhook-driven automatic payment confirmation once a real gateway (Stripe, PayPal, etc.) is integrated — achieved by adding a new `Payment.method` value and a webhook handler, without changing the `Payment`/`Order` data model.

### 12.5 Coupons

**Business Goal:** Enable order-level promotional discounts with abuse-resistant usage controls.

**Inputs:** Coupon code entered at checkout.

**Validations:** Coupon exists, `isActive = true`, current date within `startsAt`/`expiresAt`, cart subtotal ≥ `minOrderAmount`, total usage < `usageLimit`, this customer's usage < `usageLimitPerUser`.

**Business Rules:** One coupon per order; no stacking; discount types are `FIXED_AMOUNT`, `PERCENTAGE` (with optional `maxDiscount` cap), or `FREE_SHIPPING`; applies to the entire order only in v1.

**Database Operations:** Validate `Coupon` row → insert `CouponUsage` (couponId, userId/guestEmail, orderId) within the same transaction as order creation.

**Success Flow:** Valid code applied → discount calculated → reflected in order totals → usage recorded atomically with order creation.

**Failure Cases:** `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_USAGE_LIMIT_REACHED`, `COUPON_MIN_ORDER_NOT_MET`.

**Edge Cases:** Coupon expires between cart application and checkout submission — must be re-validated at checkout time, not trusted from an earlier client-side check.

**Security Considerations:** All coupon math (discount amount, cap enforcement) computed server-side only — never trust a client-submitted discount amount.

**Scalability Considerations:** `usageLimitPerUser` enforcement via indexed lookup on `CouponUsage(couponId, userId)`.

**Future Enhancements:** Product/category-scoped coupons; coupon stacking rules; automatic promotional coupons (no code required).

### 12.6 Reviews

**Business Goal:** Provide trustworthy, purchase-verified product feedback.

**Inputs:** Rating (1–5), title, comment, tied to a specific `OrderItem`.

**Validations:** Customer must have a `DELIVERED` order containing this product; one review per `(customerId, productId)`.

**Business Rules:** Reviews publish immediately; Admins may set `isHidden`; customers may edit (not duplicate) their existing review.

**Database Operations:** Insert/update `Review` row linked to `OrderItem` (for verification) and `Product` (for display/aggregation); recalculate and persist `Product.avgRating` asynchronously.

**Success Flow:** Delivered order exists → customer submits review → review published with `isVerifiedPurchase = true` → product's average rating updated.

**Failure Cases:** No qualifying delivered order → `FORBIDDEN`/`REVIEW_NOT_ELIGIBLE`; duplicate review attempt → resolved as an edit, not an error, from the client's perspective (upsert semantics).

**Edge Cases:** Customer purchased the same product twice (two separate delivered orders) — still only one review permitted per product.

**Security Considerations:** Eligibility check enforced server-side on every submission, never trusted from client state.

**Scalability Considerations:** `avgRating` denormalized on `Product` to avoid expensive live aggregation on every catalog listing/search request.

**Future Enhancements:** Helpful-vote counts, image attachments on reviews, seller/admin replies, pre-moderation queue option.

### 12.7 Search, Filtering, Sorting, Pagination

**Business Goal:** Allow customers to efficiently discover products across a growing catalog.

**Inputs:** Search query string, filter parameters (category, brand, price range, attribute values, availability), sort key, page/limit.

**Validations:** Sanitized query input; page/limit bounds (e.g., max limit enforced server-side to prevent abuse).

**Business Rules:** Search implemented via PostgreSQL full-text search (`tsvector`/GIN index) plus trigram fuzzy matching; filtering via indexed joins through `VariantAttributeValue`; sorting includes newest, oldest, price asc/desc, highest rated (`avgRating`), best selling (`salesCount`); pagination is offset-based (`page`, `limit`) for v1.

**Database Operations:** Indexed `SELECT` queries against `Product`/`ProductVariant`/`VariantAttributeValue`/`Category`/`Brand`, with `COUNT` for pagination `meta.total`.

**Success Flow:** Query parameters parsed → `SearchService` interface builds and executes query → results + pagination metadata returned in standard envelope.

**Failure Cases:** Invalid filter/sort parameter → `VALIDATION_ERROR`.

**Edge Cases:** Empty result sets return a valid, well-formed empty envelope, not an error.

**Security Considerations:** All search/filter inputs parameterized (Prisma default) to prevent SQL injection; input length/complexity limits to prevent abusive queries.

**Scalability Considerations:** `SearchService` is an abstracted interface — the Postgres implementation can be replaced by Elasticsearch/Meilisearch later without changing controllers or business logic.

**Future Enhancements:** Dedicated search engine migration; typo-tolerant relevance ranking; synonym handling; cursor-based pagination for very large catalogs.

---

## 13. Database Design

### 13.1 Core Conventions

- **Primary keys:** UUID on every table.
- **Timestamps:** `createdAt`, `updatedAt` on every table.
- **Soft delete:** `deletedAt` (nullable timestamp) on all soft-deletable business entities (Product, ProductVariant, Category, Brand, Coupon, etc.). Hard delete reserved for `RefreshToken` (post-expiry cleanup), OTP records, and other ephemeral/system-managed data.
- **Monetary fields:** `Decimal` / `NUMERIC(12,2)`, always paired with a `currencyCode` (ISO 4217, e.g. `"USD"`) column.
- **Enums:** `Role`, `OrderStatus`, `PaymentStatus`, `CouponType`, `AttributeInputType`.

### 13.2 Core Entities (Representative Field Lists)

- **User**: id, email, passwordHash, role (`Role`), fullName, phone, isActive, emailVerifiedAt, createdAt, updatedAt.
- **RefreshToken**: id, userId, tokenHash, deviceName, ipAddress, createdAt, lastUsedAt, expiresAt, revokedAt.
- **Address**: id, userId, label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefaultShipping, isDefaultBilling, createdAt, updatedAt, deletedAt.
- **Category**: id, name, slug, parentId (self-referencing, nullable), displayOrder, createdAt, updatedAt, deletedAt.
- **Brand**: id, name, slug, logoUrl, description, createdAt, updatedAt, deletedAt.
- **Attribute**: id, name, inputType (`AttributeInputType`), createdAt, updatedAt.
- **AttributeValue**: id, attributeId, value, createdAt, updatedAt.
- **CategoryAttribute**: id, categoryId, attributeId, isRequired, isFilterable, displayOrder, createdAt. (unique on `categoryId + attributeId`)
- **Product**: id, categoryId, brandId (nullable), name, slug, description, avgRating, salesCount, isActive, createdAt, updatedAt, deletedAt.
- **ProductVariant**: id, productId, sku, price (Decimal), currencyCode, stockQuantity, isActive, createdAt, updatedAt, deletedAt.
- **VariantAttributeValue**: id, variantId, attributeValueId. (unique on `variantId + attributeValueId`)
- **ProductImage**: id, productId, variantId (nullable), url, altText, displayOrder, isPrimary, createdAt.
- **Wishlist**: id, customerId, productId, createdAt. (unique on `customerId + productId`)
- **Cart**: id, customerId (nullable), guestToken (nullable), createdAt, updatedAt.
- **CartItem**: id, cartId, variantId, quantity, createdAt, updatedAt.
- **Coupon**: id, code, type (`CouponType`), discountValue, maxDiscount (nullable), minOrderAmount, usageLimit (nullable), usageLimitPerUser (nullable), startsAt, expiresAt, isActive, createdAt, updatedAt, deletedAt.
- **CouponUsage**: id, couponId, userId (nullable), guestEmail (nullable), orderId, usedAt.
- **ShippingMethod**: id, name, cost (Decimal), currencyCode, estimatedDeliveryDays, isActive, createdAt, updatedAt, deletedAt.
- **Order**: id, customerId (nullable), guestEmail, customerName, customerEmail, customerPhone, status (`OrderStatus`), subtotal, discountAmount, taxAmount, shippingAmount, totalAmount, currencyCode, couponId (nullable), shippingMethodId, createdAt, updatedAt.
- **OrderAddress**: id, orderId, type (`SHIPPING`/`BILLING`), fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, createdAt.
- **OrderItem**: id, orderId, productId (nullable ref), variantId (nullable ref), productName, variantSku, variantAttributesSnapshot, unitPrice, quantity, subtotal, currencyCode, createdAt.
- **OrderStatusHistory**: id, orderId, fromStatus, toStatus, changedBy (userId, nullable for system), reason (nullable), createdAt.
- **Payment**: id, orderId, method, amount, currencyCode, status (`PaymentStatus`), referenceNumber, notes, paidAt, createdAt, updatedAt.
- **Review**: id, customerId, productId, orderItemId, rating, title, comment, isVerifiedPurchase, isHidden, createdAt, updatedAt. (unique on `customerId + productId`)

### 13.3 Indexing Strategy

- GIN index on `Product` full-text search vector (name + description).
- Trigram (`pg_trgm`) index for fuzzy search support.
- Composite index on `VariantAttributeValue(attributeValueId, variantId)` for filtering.
- Composite unique index on `CategoryAttribute(categoryId, attributeId)`.
- Index on `Order(status)`, `Order(customerId)`, `Order(guestEmail)`.
- Index on `OrderStatusHistory(orderId)`.
- Index on `RefreshToken(userId)`, `RefreshToken(tokenHash)`.
- Index on `CouponUsage(couponId, userId)`.

---

## 14. Entity Relationships

- `User (1) — (N) Address`
- `User (1) — (N) RefreshToken`
- `Category (1) — (N) Category` (self-referencing parent/child)
- `Category (N) — (N) Attribute` via `CategoryAttribute`
- `Attribute (1) — (N) AttributeValue`
- `Category (1) — (N) Product`; `Brand (1) — (N) Product`
- `Product (1) — (N) ProductVariant`
- `ProductVariant (N) — (N) AttributeValue` via `VariantAttributeValue`
- `Product (1) — (N) ProductImage`; `ProductVariant (1) — (N) ProductImage` (optional override)
- `User (1) — (N) Wishlist (N) — (1) Product`
- `User/Guest (1) — (1) Cart (1) — (N) CartItem (N) — (1) ProductVariant`
- `Coupon (1) — (N) CouponUsage (N) — (1) Order`
- `Order (1) — (N) OrderItem`; `Order (1) — (N) OrderAddress`; `Order (1) — (N) OrderStatusHistory`; `Order (1) — (1..N) Payment`
- `Order (N) — (1) ShippingMethod`
- `Customer (1) — (N) Review (N) — (1) Product`; `Review (1) — (1) OrderItem` (verification link)

---

## 15. API Planning

All endpoints are prefixed `/api/v1/`.

**Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/forgot-password`, `POST /auth/reset-password`.

**Users & Addresses:** `GET/PATCH /users/me`, `GET/POST /users/me/addresses`, `PATCH/DELETE /users/me/addresses/:id`.

**Catalog (public):** `GET /categories`, `GET /brands`, `GET /products`, `GET /products/:slug`, `GET /products/:id/variants`.

**Catalog (admin):** `POST/PATCH/DELETE /admin/categories`, `/admin/brands`, `/admin/attributes`, `/admin/products`, `/admin/products/:id/variants`, `/admin/products/:id/images`.

**Cart:** `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`.

**Wishlist:** `GET /wishlist`, `POST /wishlist/:productId`, `DELETE /wishlist/:productId`.

**Coupons:** `POST /cart/apply-coupon`, `DELETE /cart/remove-coupon`; `POST/PATCH/DELETE /admin/coupons`.

**Checkout & Orders:** `POST /checkout`, `GET /orders`, `GET /orders/:id`, `GET /orders/:id/history`; `PATCH /admin/orders/:id/status`, `POST /admin/orders/:id/payment`.

**Reviews:** `POST /products/:id/reviews`, `PATCH /reviews/:id`, `GET /products/:id/reviews`; `PATCH /admin/reviews/:id/hide`.

**Search:** `GET /search?query=&category=&brand=&minPrice=&maxPrice=&attr[color]=&sort=&page=&limit=`.

**Admin analytics:** `GET /admin/analytics/sales`, `GET /admin/analytics/best-selling`, `GET /admin/analytics/low-stock`.

All list endpoints return the standard `meta` pagination object; all endpoints return the standard success/error envelope defined in Section 19.

---

## 16. Folder Architecture

```
src/
  config/           # env validation, db client, constants
  middlewares/       # auth, requireRole, rateLimiters, errorHandler, requestId, validate
  modules/
    auth/
    users/
    addresses/
    categories/
    brands/
    products/
    attributes/
    inventory/
    cart/
    wishlist/
    coupons/
    orders/
    payments/
    reviews/
    search/
    admin/
    notifications/
      NotificationService.ts   # interface
      providers/nodemailerProvider.ts
    storage/
      StorageService.ts        # interface
      providers/localStorageProvider.ts
  each module/: routes.ts, controller.ts, service.ts, validation.ts
  shared/
    errors/          # AppError + domain-specific exception classes
    utils/
    types/
  app.ts
  server.ts
prisma/
  schema.prisma
  migrations/
```

Each module follows a strict **routes → controller → service → Prisma** layering; controllers never contain business logic, and services never format HTTP responses directly.

---

## 17. Security Requirements

- JWT access tokens (short-lived) + hashed, rotating, revocable refresh tokens stored in `RefreshToken`, with reuse-detection triggering full session-family revocation.
- Password hashing via bcrypt or Argon2.
- Reusable `requireAuth` / `requireRole([...])` middleware — no inline role checks in controllers.
- Helmet for secure HTTP headers.
- Tiered rate limiting: strict on auth/password-recovery endpoints, moderate on public APIs, separately configured for admin APIs.
- Explicit CORS origin allow-list (no wildcard).
- Server-side input validation and sanitization on every endpoint (Express Validator), independent of client-side validation.
- Parameterized queries throughout (Prisma default) to prevent SQL injection.
- HTTPS enforced in production.
- No internal error detail (stack traces, SQL/Prisma errors) ever returned to clients — centralized error handler sanitizes all responses.
- Per-request correlation ID (`requestId`) attached to logs and, where applicable, error responses.
- Startup validation of all required environment variables — application fails fast on missing configuration rather than failing unpredictably at runtime.

---

## 18. Validation Rules

- All request bodies/query params validated via Express Validator schemas defined per module.
- Validation errors return `error.code = "VALIDATION_ERROR"` with an `error.details` array identifying each affected field and the specific issue.
- Required-attribute validation for product publishing is driven dynamically by `CategoryAttribute.isRequired`, not hardcoded per category.
- Monetary and quantity fields validated as positive, correctly-typed `Decimal`/integer values.
- Coupon, stock, and payment business-rule validation happens server-side inside the relevant transaction — never trusted from client-submitted values.

---

## 19. Error Handling Strategy

**Standard response envelope:**

```json
// Success
{ "success": true, "message": "string", "data": { }, "meta": { "page": 1, "limit": 20, "total": 143 } }

// Error
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "string", "details": [ { "field": "variantId", "issue": "string" } ] } }
```

**Starter error code taxonomy:**

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request failed field-level validation |
| `UNAUTHORIZED` | Missing/invalid authentication |
| `FORBIDDEN` | Authenticated but not permitted |
| `NOT_FOUND` | Resource does not exist |
| `OUT_OF_STOCK` | Checkout/inventory validation failure |
| `COUPON_INVALID` | Coupon code does not exist or is inactive |
| `COUPON_EXPIRED` | Coupon outside its validity window |
| `COUPON_USAGE_LIMIT_REACHED` | Global or per-user usage limit exceeded |
| `COUPON_MIN_ORDER_NOT_MET` | Cart subtotal below coupon minimum |
| `REVIEW_NOT_ELIGIBLE` | No qualifying delivered order for review |
| `TOKEN_EXPIRED` | Access/refresh token expired |
| `TOKEN_REUSED_COMPROMISED` | Revoked refresh token reused — session family revoked |
| `CONFLICT` | Duplicate/unique-constraint violation (e.g., SKU) |
| `INTERNAL_ERROR` | Unhandled server error (sanitized for clients) |

**Implementation approach:** Controllers/services throw domain-specific exceptions extending a base `AppError` (carrying `code`, `httpStatus`, `message`, optional `details`). A single centralized Express error-handling middleware catches all thrown errors (including Prisma and Express Validator errors), maps them to the standard envelope, logs them with the request's correlation ID, and ensures no internal implementation detail ever reaches the client in production.

---

## 20. Development Roadmap

**Phase 1 — Foundation**
Project scaffolding, environment/config validation, Prisma schema + migrations for core entities, auth module (register/login/refresh/logout), security middleware baseline, standardized response envelope and error handling.

**Phase 2 — Catalog**
Categories (hierarchical), Brands, Attributes, CategoryAttribute mapping, Products, Variants, VariantAttributeValue, Product Images, admin catalog endpoints.

**Phase 3 — Shopping & Inventory**
Cart (guest + customer, merge-on-login), Wishlist, variant-level inventory, transactional stock validation logic.

**Phase 4 — Checkout & Orders**
Addresses + OrderAddress snapshotting, Shipping Methods, Tax handling, Coupons + CouponUsage, atomic checkout transaction, Order/OrderItem/OrderStatusHistory, admin-confirmed Payment flow.

**Phase 5 — Post-Purchase & Discovery**
Reviews (verified purchase, moderation), Search/Filter/Sort/Pagination, denormalized `avgRating`/`salesCount` maintenance.

**Phase 6 — Platform Hardening**
Notification service (transactional emails, best-effort async), structured logging + request correlation, admin analytics endpoints, full security review, API documentation (Swagger), test coverage pass.

**Phase 7 — Launch Readiness**
Load/concurrency testing of checkout flow, staging deployment, final security audit, documentation handoff.

---

## 21. Future Improvements

*(Explicitly out of Version 1 scope — documented here rather than folded into agreed v1 requirements.)*

- Multi-vendor marketplace support (`sellerId` on products, vendor onboarding, split payouts, commission logic).
- Live payment gateway integration (Stripe, PayPal, etc.) with `PAYMENT_PENDING` status and webhook-driven confirmation.
- Redis-based cart/stock reservation system with configurable TTL.
- Background job queue (BullMQ + Redis) for email/notification dispatch.
- Dedicated search engine (Elasticsearch/Meilisearch/Algolia) migration behind the existing `SearchService` abstraction.
- Cloud file storage (AWS S3) migration behind the existing `StorageService` abstraction.
- Product/category-scoped coupons; coupon stacking.
- Attribute inheritance from parent to child categories.
- Variant-level wishlist option (in addition to product-level).
- Review helpful-vote counts, image attachments, and admin/seller replies.
- Granular RBAC (`SUPER_ADMIN`, `ORDER_MANAGER`, `SUPPORT_STAFF`, `CATALOG_MANAGER`) with a full permission table.
- Jurisdiction-aware tax calculation (e.g., TaxJar/Avalara integration) and multi-currency support.
- Live carrier shipping-rate integration (FedEx/UPS/DHL APIs).
- Admin notifications (low-stock alerts, new-order alerts).
- Customer-behavior analytics pipeline (funnels, page views), likely via a dedicated data warehouse/tool.
- Cursor-based pagination for large-catalog performance.
- OAuth/social login, 2FA/MFA.
- Partial order fulfillment / backorder support.

---

## 22. Risks and Assumptions

**Assumptions:**
- Version 1 operates as a single-seller store; multi-vendor readiness is structural only, not functional.
- Only one currency is configured at launch, though the schema is currency-aware.
- Admins are trusted operators; no granular permission separation exists in v1.
- Manual/admin-confirmed payment is an acceptable real business process for launch (COD, bank transfer, or similar).
- Catalog and traffic volume at launch do not require a dedicated search engine or offset-pagination alternatives.

**Risks:**
- **Manual payment confirmation introduces operational latency and human error risk** — mitigated by the `Payment` audit fields (`referenceNumber`, `notes`) and full status history, but this is a process risk, not just a technical one.
- **EAV model complexity** — while necessary for dynamic attributes, EAV queries are more complex than fixed columns; must be carefully indexed and query-optimized as catalog size grows, or filtering performance could degrade.
- **Email deliverability** — fire-and-forget async email in v1 has no retry queue; failed emails (e.g., order confirmations) are logged but not automatically retried until the future job-queue enhancement is implemented. This is an accepted v1 trade-off.
- **Offset pagination at scale** — acceptable for v1 catalog size; will need migration to cursor-based pagination if catalog/order volume grows significantly, as offset pagination degrades at very deep pages.
- **Single flat ADMIN role** — no separation of duties; any admin account compromise grants full platform control. Mitigated by strong auth/session security, but a real risk until granular RBAC is introduced.

---

## Appendix A — Architectural Decision Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Single-seller v1, vendor-ready schema | Avoids premature multi-vendor complexity while not blocking future expansion |
| 2 | Product → Variant model | Matches real-world catalog needs (inventory, images, pricing per variant) |
| 3 | EAV for attributes | Enables new categories/attributes without schema changes |
| 4 | Category–Attribute many-to-many with rules | Supports dynamic admin forms and relevant filtering |
| 5 | Hierarchical categories, 3-level soft limit, no inheritance | Predictable UX and validation; depth relaxable later |
| 6 | Transactional row-locking inventory control | Prevents overselling without requiring Redis infrastructure in v1 |
| 7 | All-or-nothing checkout | Simpler, predictable transaction and payment model |
| 8 | Full order status set incl. deferred states | Future refund/return/gateway support without order-model redesign |
| 9 | Payment as independent entity | Gateway-agnostic financial architecture |
| 10 | Simple order-level coupons, no stacking | Avoids complex, error-prone discount-calculation ordering |
| 11 | Verified-purchase-only reviews | Trust and authenticity |
| 12 | Stateful, rotating, multi-device refresh tokens | Full revocability and mobile-app readiness |
| 13 | Snapshotted addresses and order items | Immutable financial/historical accuracy |
| 14 | Product-level wishlist | Matches natural "interest vs. purchase intent" browsing behavior |
| 15 | Hybrid product/variant image galleries | Avoids redundant uploads while supporting visual variants |
| 16 | Soft-delete standard, hard-delete only for ephemeral data | Historical integrity and auditability |
| 17 | Guest checkout with token-based cart and merge-on-login | Reduces checkout friction, maximizes conversion |
| 18 | Flat ADMIN/CUSTOMER roles, enum-based, middleware-enforced | Simple now, RBAC-ready later |
| 19 | Native PostgreSQL search/filter/sort, offset pagination | No added infrastructure for v1 scale, abstracted for future engine swap |
| 20 | Standard response envelope + centralized error handling + request IDs | Predictable frontend integration and production debuggability |
| 21 | API versioning from day one (`/api/v1/`) | Zero-cost now, essential for future breaking changes |
| 22 | UUID PKs, Decimal money + currency code, `deletedAt` convention | Security, financial correctness, and consistency across the schema |
**End of Document**
