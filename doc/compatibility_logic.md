# Compatibility Engine Logic (Deterministic)

## 1. Decision Flow

1.  **Resolve Geometry**: Lookup `mobile_models` → `model_screen_map` → `screens` (Target Screen).
    -   *If no map*: Return `UnknownModelError`.
    -   *If mapped but low confidence*: Add `VerificationWarning`.
2.  **Fetch Exact Candidates**: Query `tempered_glass_skus` where `screen_id` == Target Screen ID.
3.  **Fetch Universal Candidates**: Query `universal_glass_rules` where `target_screen_id` == Target Screen ID AND `is_safe` == TRUE.
4.  **Apply Hard Filters (Rejections)**:
    -   **Curvature**: If screen is `curved` and glass is `flat` → REJECT. (Exception: 2.5D/Flat mix allowed with penalty).
    -   **Cutout**: Compare `cutout_mask_svg` (0..1 normalized). If glass material overlaps required screen sensor zone → REJECT.
    -   **Dimensions**: Check `glass_width/height` vs `screen.active_area_mm` + `fit_tolerances`.
        -   *Oversize*: If > max_tolerance → REJECT (Hanging edges).
        -   *Undersize*: If < min_tolerance → REJECT (Exposed distinct active area).
    -   **Corner Radius**: If `abs(glass.r - screen.r) > epsilon` → REJECT (Visual mismatch/lift).
5.  **Score & Categorize**:
    -   Exact Candidates → **GREEN** (Status: `EXACT`).
    -   Universal Candidates → **YELLOW** (Status: `UNIVERSAL`).
    -   Calculate `confidence_breakdown` (Geometry + Cutout + Tolerance).
6.  **Subscription Gating**:
    -   Compute ALL matches first.
    -   *Then*: If Tenant Plan is BASIC, mask/hide Universal results (e.g., hidden_count = 10). Do NOT hide exact matches.
7.  **Format Output**: Return structured JSON with `confidence_breakdown` and metadata.

## 2. Match Categories & Rules

### ✅ Exact Fit (GREEN)
*Criteria:*
-   `glass.screen_id` == `target.screen_id`.
-   **AND** Curvature Compatible.
-   **AND** Cutout mask intersection is clean.
-   **Output Status**: `EXACT`
-   **Confidence**: 1.0 (unless degraded by manual verification flag).

### ⚠️ Case-Friendly / Approximate (YELLOW)
*Criteria:*
-   `glass_width` within `fit_tolerances` (e.g. -2mm allowed for case-friendly).
-   `glass.screen_id` != `target.screen_id`.
-   **Condition**: `universal_glass_rules` record exists OR computed geometry is safe.
-   **Output Status**: `UNIVERSAL`
-   **Confidence**: 0.6 - 0.9.
-   **Mandatory Warning**: "Universal Glass - Center alignment required."

### ⛔ Hard Rejections (RED)
*Criteria:*
-   **Curvature Mismatch**: Flat on Curved.
-   **Oversize**: Exceeds `fit_tolerances.max_oversize_mm`.
-   **Blocked Sensor**: Glass material covers `cutout_mask_svg` keep-out zone.

## 3. Confidence Scoring (Structured)

Return a `confidence_breakdown` object:
```json
{
  "id_match": 1.0,           // 1.0 if native ID match, 0.0 otherwise
  "geometry_penalty": -0.05, // Penalty for size difference
  "cutout_penalty": -0.0,    // Penalty for offset
  "curvature_penalty": 0.0,  // Penalty for flat-on-2.5D
  "verification_bonus": 0.0  // +0.05 if physically verified
}
```
**Total Score** = `clamp(sum(components), 0.0, 1.0)`

## 4. Output Structure (API Response)

```json
{
  "request": {
    "brand": "Redmi",
    "model": "Note 12 Pro",
    "user_tier": "BASIC"
  },
  "screen_profile": {
    "id": 101,
    "dimensions_mm": { "w": 76.0, "h": 162.9 },
    "active_area_mm": { "w": 75.2, "h": 161.8 },
    "type": "flat",
    "cutout_mask_svg": "<path d='...'>"
  },
  "matches": [
    {
      "type": "EXACT",
      "sku_code": "TG-RED-N12P-OG",
      "name": "Super D Black",
      "status": "GREEN",
      "confidence": 1.0,
      "confidence_breakdown": {
        "id_match": 1.0, "geometry_penalty": 0.0
      },
      "metadata": { 
        "edge": "full", 
        "thickness": "0.33mm", 
        "glass_curvature": "flat",
        "corner_radius": "2.5mm"
      },
      "verification": {
        "source": "Physical Measurement",
        "verified_at": "2024-01-01T10:00:00Z"
      }
    },
    {
      "type": "UNIVERSAL",
      "sku_code": "TG-UNI-667-PH",
      "name": "Universal 11D",
      "status": "YELLOW",
      "confidence": 0.85,
      "warnings": ["Gap on bottom edge: 1.2mm"],
      "fit_reason": "Compatible dimensions, clear cutout."
    }
  ],
  "subscription_gating": {
    "hidden_universal_count": 12,
    "upgrade_message": "Upgrade to PRO for more results."
  }
}
```

## 5. Operations & Performance
-   **Pre-computation**: Maintain `precomputed_matches` (Screen ID -> JSON matches).
-   **Background Job**: Re-run matching logic when Screen or Glass data changes.
-   **Caching**: Cache API responses for 24h. Invalidate on `audit_log` events.
