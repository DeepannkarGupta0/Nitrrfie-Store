# Database

- `orders`: customer order, shipping data, line items, total (integer paise), status, and timestamps.
- `payments`: manual UPI reference, amount (integer paise), verification status, and timestamps. Customer-entered references remain unverified until staff confirms receipt in the bank account.
- `inventory`: one row per catalogue product with non-negative available quantity.
- `templates` and `designs`: custom design builder data.
- `error_logs`: server-side operational logs.

Run all SQL files under `supabase/migrations` in chronological order. The inventory migration seeds the current catalogue at quantity zero; set the actual quantities in Admin → Inventory before opening sales.
