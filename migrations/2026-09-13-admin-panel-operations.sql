-- Admin panel, phase 2 (Operations) — docs/admin-panel.md.
--
-- Support tickets. There is no legacy feedback table on this site (learners
-- wrote to kontakt@ by mail), so there is nothing to backfill and no bridge
-- trigger: tickets are created by the learner through the authenticated
-- support-ticket-create function, or by staff (manual intake of an email)
-- through admin-support. Both go through the service role.
--
-- Additive only. RLS on with NO policies on both tables: the panel reads and
-- writes through capability-gated functions, never through a client key —
-- which is also what keeps an internal note from ever reaching a learner
-- (visibility is a column on its OWN row, and every learner-facing query
-- filters visibility = 'public').
--
-- The closure columns (closed_at … reopen_count) belong to Part 3 of the
-- spec; they are created here so the table is defined once.
--
-- How to test after applying:
--   SELECT count(*) FROM public.support_tickets;                 -- 0
--   As authenticated: SELECT * FROM public.support_tickets;      -- 0 rows (RLS, no policy)
-- Rollback: DROP TABLE public.support_ticket_messages; DROP TABLE public.support_tickets;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,               -- DM-XXXXXXXX, human-quotable, safe to paste into an email
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_email text,
  subject text,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('technical', 'payment', 'content', 'account', 'suggestion', 'other')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'open', 'waiting_user', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assignee_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  first_response_at timestamptz,                -- NULL = not yet answered, never "answered at an unknown time"
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  sla_due_at timestamptz,
  resolution text,
  tags text[] NOT NULL DEFAULT '{}',
  context jsonb,
  -- lifecycle closure
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  closure_reason text
    CHECK (closure_reason IS NULL OR closure_reason IN ('resolved_confirmed', 'no_response', 'duplicate', 'spam', 'withdrawn', 'merged', 'other')),
  resolution_category text
    CHECK (resolution_category IS NULL OR resolution_category IN ('answered', 'technical_fix', 'access_correction', 'payment_refund', 'content_correction', 'duplicate', 'no_action', 'other')),
  reopened_at timestamptz,
  reopen_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  author_type text NOT NULL CHECK (author_type IN ('user', 'admin', 'system')),
  author_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  -- THE LOAD-BEARING COLUMN. An internal note is a separate ROW with
  -- visibility = 'internal' — not a field on a shared row.
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),

  body text NOT NULL,
  delivery_status text CHECK (delivery_status IS NULL OR delivery_status IN ('queued', 'sent', 'failed')),
  delivery_error text
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status        ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user          ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assignee      ON public.support_tickets (assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_activity ON public.support_tickets (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority      ON public.support_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_closed        ON public.support_tickets (closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket       ON public.support_ticket_messages (ticket_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_visibility   ON public.support_ticket_messages (ticket_id, visibility);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: service-role only, reached through capability-gated functions

-- The directory and the cockpit count logins per user from audit_logs; the
-- table had no index on the columns every such query filters by.
CREATE INDEX IF NOT EXISTS idx_audit_logs_type_created ON public.audit_logs (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_type    ON public.audit_logs (user_id, event_type);
