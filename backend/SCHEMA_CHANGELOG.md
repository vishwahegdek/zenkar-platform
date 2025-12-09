# Schema Changelog

## 2025-12-09: Payments and Status Features
- **Added `Payment` Model**:
  - Fields: `id`, `amount`, `date`, `note`, `orderId`, `createdAt`.
  - Relation: Many-to-One with `Order`.
- **Modified `Order` Model**:
  - Added `discount` (Decimal) field to handle balance write-offs.
  - Added `payments` (Payment[]) relation.
  - *Note*: `advanceAmount` is kept for data safety but logic migrates it to `Payment`.
- **Migration**: `20251209094435_add_payments` created.
  - Includes explicit SQL to create `Payment` table and add `discount` column.
  - Includes drift resolution for `images` table and `Product` modifications.

## 2025-12-09: Drift Resolution (Catch-up)
- **Resolved Drift**: The database had `images` table and `Product` changes (`sku` removed, `deleted_at` added) that were not in migration history.
- **Action**: Created and applied catch-up migrations (`catchup_images`, `catchup_real`) and verified schema sync.

## 2025-12-07: Image Uploads
- **Added `Image` Model**:
  - Fields: `keyRaw`, `keyOptimized`, `keyThumbnail`.
  - Relations: Linked to `Product` and `OrderItem`.
- **Modified `Product`**:
  - Removed `sku` (unused).
  - Added `isDeleted`, `deletedAt` for soft deletes.

## 2025-12-06: Initial Schema
- **Models**: `Customer`, `Product`, `Order`, `OrderItem`.
- **Enums**: Application status strings.
