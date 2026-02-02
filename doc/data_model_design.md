# Data Model Design (Conceptual)

## 1. Global Data (Platform Owned)
*Read-Only for Tenants. Mutable only by Platform Editor/Approver.*

### Table: `brands`
- **Purpose**: Canonical list of mobile manufacturers.
- **Columns**: `id`, `name`, `slug` (for URLs), `is_active`.
- **Relationships**: One Brand -> Many Models.
- **Access**: READ (All), WRITE (Platform Editor).
- **Growth**: Low.
- **Versioning**: Soft-delete only.

### Table: `screens` (CRITICAL)
- **Purpose**: The geometric "Identity" of a phone's front face. This is the **Core Atom** of the system.
- **Columns**:
  - `id`: Unique identifier.
  - `geometry_hash`: SHA of dimensions to auto-detect duplicates (158.2mm x 76.4mm...).
  - `diagonal`: In inches.
  - `dimensions`: Width/Height in mm (High precision).
  - `curved`: Flat, 2.5D, 3D Curved, Foldable.
  - `cutout_shape`: Notch, Punch-hole (L/C/R), Dynamic Island, None.
  - `cutout_mask_svg`: **Normalized SVG** (0..1) representing holes/sensors relative to active area.
  - `active_area_mm`: Precise width/height of the display pixels.
  - `bezel_margin_mm`: Distance from active area to physical edge.
  - `corner_radius_mm`: Curvature of the screen corners (critical for edge-to-edge glass).
  - `fit_tolerances`: JSON defining per-edge tolerances (e.g., flat: +0.5/-2.0mm).
- **Relationships**: Used by `model_screen_map` and `tempered_glass_skus`.
- **Access**: READ (All), WRITE (Platform Editor).
- **Growth**: Medium (New form factors appear annually).
- **Versioning**: **Strict Immutable**. New geometry = New Record.

### Table: `mobile_models`
- **Purpose**: specific market devices (e.g., "Redmi Note 12 Pro 5G").
- **Columns**: `id`, `brand_id`, `name`, `aliases` (Array of street names), `release_date`.
- **Relationships**: Mapped to **one active screen at a time, with historical mappings preserved**.
- **Access**: READ (All), WRITE (Platform Editor).
- **Growth**: High (Weekly launches).
- **Versioning**: Soft-delete.

### Table: `model_screen_map` (CRITICAL)
- **Purpose**: The "Link" that connects a marketing name to a physical geometry.
- **Columns**:
  - `model_id`: FK to `mobile_models`.
  - `screen_id`: FK to `screens`.
  - `confidence`: Verified (1.0) vs Assumed (0.8).
  - `verified_by`: FK to Platform Admin ID.
  - `verification_source`: 'Physical Measurement', 'Spec Sheet', 'User Report'.
- **Relationships**: 1:1 (A phone has one screen).
- **Access**: READ (All), WRITE (Platform Approver).
- **Growth**: High (matches `mobile_models`).
- **Versioning**: Track history (Why did we map X to Y initially?).

### Table: `tempered_glass_skus`
- **Purpose**: Physical inventory items available in the market.
- **Columns**: `id`, `sku_code`, `screen_id` (The "Native" Fit), `marketing_name`, `manufacturer`.
  - **Geometry**: `glass_width_mm`, `glass_height_mm`, `corner_radius_mm`, `glass_curvature` (flat/2.5D/curved).
  - **Metadata**: `edge_coverage` (full/case-friendly), `thickness_mm`.
  - **Compatibility**: `cutout_mask_svg`, `cutout_alignment_offset_allowance_mm`.
  - **Verification**: `last_verified_at`, `verified_by`, `verification_source`.
- **Relationships**: Linked to `screens`.
- **Access**: READ (All), WRITE (Platform Editor).
- **Growth**: Medium.
- **Versioning**: Soft-delete.

### Table: `universal_glass_rules`
- **Purpose**: Defines "Acceptable Imperfection" rules for fuzzier matching in Basic/Pro plans.
- **Columns**:
  - `source_screen_id`: The glass being used.
  - `target_screen_id`: The phone it's being put on.
  - `fit_score`: 0-100%.
  - `warnings`: "Gap on left", "Covers sensor".
  - `is_safe`: Boolean guardrail.
- **Relationships**: Many-to-Many between Screens.
- **Access**: READ (Pro Tenants), WRITE (Platform Editor -> Propose), APPLY (Platform Approver).
- **Growth**: High (Combinatorial).
- **Versioning**: N/A, recomputed periodically.

---

## 2. Tenant Data (Shop Owned)
*Isolated by `tenant_id`.*

### Table: `tenants` (Shops)
- **Purpose**: The customer entity.
- **Columns**: `id` (UUID), `name`, `business_phone`, `status` (Active/Suspended).
- **Relationships**: Parent to all tenant data.
- **Access**: READ (Owner), WRITE (Payment System/Owner).
- **Growth**: Medium/High (10k target).
- **Versioning**: Audit status changes.

### Table: `tenant_users`
- **Purpose**: Staff/Owner logins.
- **Columns**: `id`, `tenant_id` (FK), `email`, `role` (Owner/Staff), `password_hash`.
- **Relationships**: Belong to Tenant.
- **Access**: READ (Self/Owner), WRITE (Owner).
- **Growth**: High (3-5 per tenant).
- **Versioning**: Soft-delete.

### Table: `plans`
- **Purpose**: Defines subscription tiers and features.
- **Columns**: `id`, `tier_name` (BASIC, PRO), `feature_flags` (JSON), `limits` (JSON), `monthly_price`, `yearly_price`.
- **Relationships**: Referenced by `subscriptions`.
- **Access**: READ (Public/Auth), WRITE (Platform Admin).
- **Growth**: Low.

### Table: `subscriptions` (CRITICAL)
- **Purpose**: Source of Truth for Access Control.
- **Columns**:
  - `tenant_id`: The shop.
  - `plan_tier`: BASIC, PRO, ENTERPRISE.
  - `status`: ACTIVE, PAST_DUE, CANCELLED.
  - `current_period_end`: Timestamp for expiration.
  - `features_snapshot`: JSON blob of limits at time of billing (prevents grandfathering issues).
- **Relationships**: 1:1 with Tenant (Active Sub).
- **Access**: READ (Tenant), WRITE (Billing System).
- **Growth**: High (Monthly renewals).
- **Versioning**: Keep history in specific history table.

---

## 3. Operations & Audit (System Owned)

### Table: `audit_logs` (CRITICAL)
- **Purpose**: The "Black Box" recorder for Global Data Changes.
- **Columns**:
  - `id`: Serial.
  - `entity_type`: 'Screen', 'ModelMap', 'Glass'.
  - `entity_id`: ID of changed row.
  - `action`: INSERT, UPDATE, DELETE.
  - `diff`: JSON {old: ..., new: ...}.
  - `actor_id`: ID of `DATA_EDITOR` or `DATA_APPROVER`.
  - `timestamp`: UTC.
- **Relationships**: Loose linkage to global tables.
- **Access**: READ (approver), WRITE (System).
- **Growth**: Very High.
- **Versioning**: Append-Only.

### Table: `mismatch_reports`
- **Purpose**: Community feedback queue.
- **Columns**:
  - `tenant_id`: Who reported it.
  - `model_id`: The phone.
  - `suggested_glass_id`: What we told them to use.
  - `actual_result`: "Too big", "Too small".
  - `photo_evidence`: URL.
  - `status`: NEW, INVESTIGATING, RESOLVED.
- **Access**: READ (Platform), WRITE (Tenant).
- **Growth**: Medium.
