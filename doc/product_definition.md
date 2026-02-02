# Product Definition: Tempered Glass Matching SaaS

## 1. Problem Statement (Shop Owner Perspective)
**"I have 500 types of tempered glass in stock, but I don't know which one fits the 50 new phone models released this month."**

Indian mobile shop owners face a specific chaos:
- **Velocity**: New phones launch weekly (Oppo, Vivo, Xiaomi, Samsung, Realme) with confusingly similar names (e.g., "5G" vs "4G" variants often have different screens).
- **Dead Stock**: Buying specific glass for every model is impossible. They rely on "Universal" or "Adjustable" glass but lack the mapping data.
- **Loss**: Attempting to fit the wrong glass wastes inventory (peeled off glass can't be resold) and angers customers.
- **Dependency**: They rely on unreliable WhatsApp groups or memory for compatibility.
- **Time Pressure**: Every wrong attempt costs 2–5 minutes in a busy shop, creating queues and lost walk-in sales.

## 2. Core Features

### Must-Have (MVP)
- **Instant Search**: Type "Redmi Note 12 Pro" → Get compatible screen profile and supported tempered glass SKUs (including cross-model equivalents).
- **Visual Confidence**: "Exact Fit" (Green), "Acceptable Fit" (Yellow), "Do Not Use" (Red).
- **Dimensional Data**: Dimensions are shown in expandable ‘Verify’ view to avoid slowing down staff.
- **Universal Recommender (Strict Guardrails)**: Suggests closest-fit universal glass with warning banner and no green status. Never mark universal as exact fit.
- **Feedback Loop**: "Report Mismatch" button for community correction.

### Nice-to-Have (v2)
- **Stock Management**: "I have 50 pcs of '11D Universal'. Tell me which phones this covers."
- **Printable Cheat Sheets**: Weekly PDF of "New Launches & What Glass Fits Them".
- **Staff Mode**: Shop owner sees fit + settings; Staff only sees fit (prevents data theft or config changes).

## 3. User Roles

| Role | Permissions |
| :--- | :--- |
| **Owner (Admin)** | - Full access to search & matching.<br>- Manage subscription & billing.<br>- Add/Remove Staff users.<br>- View search history/analytics. |
| **Staff (User)** | - Search only.<br>- Cannot see billing or manage account.<br>- "Shift" restrictions (optional). |
| **Platform Admin** | - Manage global database (Brands, Models, Profiles).<br>- Resolve reported mismatches.<br>- Manage tenant subscriptions. |

## 4. Subscription Tiers (Feature-Gated)

| Tier | Target | Key Features |
| :--- | :--- | :--- |
| **Basic** | Small Shops | - Unlimited Search (Manual Input)<br>- Exact Matches Only (Green status)<br>- **Limited Universal Suggestions** (5/day, Always Yellow, with Warnings)<br>- 1 User Limit |
| **Pro** | Standard | - **Unlimited Universal/Cross-Matching** (The "Money" Feature)<br>- 3 Users (Owner + 2 Staff)<br>- "What fits this?" (Reverse search from Glass stock) |
| **Enterprise** | Distributors | - Bulk API Access<br>- Branded White-label options<br>- Unlimited Users |

## 5. Non-Goals (What We Will NOT Build)
- **E-commerce**: We will NOT sell tempered glass or phone accessories.
- **Shop Inventory POS**: We will NOT track the shop's sales, cash flow, or general inventory (only matching logic).
- **Hardware Diagnostics**: We are not checking screen quality or functionality.
- **Case/Cover Matching**: Out of scope for Phase 1.
