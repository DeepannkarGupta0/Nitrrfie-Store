-- Existing installations: remove obsolete print-on-demand integration columns.
ALTER TABLE public.orders DROP COLUMN IF EXISTS qikink_order_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS qikink_response;
ALTER TABLE public.payments ALTER COLUMN gateway SET DEFAULT 'manual_upi';
NOTIFY pgrst, 'reload schema';
