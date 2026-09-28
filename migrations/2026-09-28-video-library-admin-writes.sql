-- ============================================================================
-- Only the admins may write the video library (scorecard §3 #18).
-- NOT YET APPLIED — apply by hand (Supabase SQL editor, as postgres).
--
-- Finding (pg_policies on omqyueddktqeyrrqvnyq, measured 2026-09-28): every
-- signed-in account (signup is free) could insert, rewrite or delete the
-- video library, both the rows and the files:
--
--   public.video_library  "Authenticated users can insert videos"  INSERT  TO authenticated  WITH CHECK (true)
--   public.video_library  "Authenticated users can update videos"  UPDATE  TO authenticated  USING (true)
--   public.video_library  "Authenticated users can delete videos"  DELETE  TO authenticated  USING (true)
--   storage.objects       "Authenticated upload for video-library" INSERT  TO authenticated  WITH CHECK (bucket_id = 'video-library')
--   storage.objects       "Authenticated update for video-library" UPDATE  TO authenticated  USING (bucket_id = 'video-library')
--   storage.objects       "Authenticated delete for video-library" DELETE  TO authenticated  USING (bucket_id = 'video-library')
--
-- 11 rows, all published, the last created 2026-03-25. 34 objects in the
-- bucket: 12 with no owner (service role), the rest owned by the two admins,
-- 0 by anyone else, the last change 2026-03-25. So there is no sign the hole
-- was used. These three are the only non-SELECT policies on storage.objects
-- for a client role.
--
-- Why they were open: the one legitimate writer, src/pages/AdminVideosPage.jsx,
-- uploads the file and inserts the row with the admin's own JWT, so the
-- policies had to admit that JWT, and admitted every JWT. This file admits
-- only a JWT whose email is on the admin list, src/config/admins.js
-- ADMIN_EMAILS (the same list the SPA shows the admin links to).
-- tests/video-library-writes.test.mjs fails if the list below and
-- ADMIN_EMAILS ever differ: change both in one commit. The two profiles with
-- a role (both 'admin') are exactly these two addresses (measured 2026-09-28).
--
-- Why the email is safe to trust here: auth.jwt() is the token Supabase Auth
-- signed, and its email claim is auth.users.email, which is unique and changes
-- only through a confirmed email change. The residual risk is an admin
-- address that is freed (account deleted or email changed) and registered by
-- someone else, so remove an address here before it is freed.
--
-- Unchanged: the two public SELECT policies ("Published videos are viewable
-- by everyone" on the table, "Public read access for video-library" on the
-- bucket). The upload's insert(...).select() still reads the new row back,
-- since it is inserted published. The service role bypasses RLS as before.
--
-- PREVIEW before applying (expect the 6 rows above):
--   select schemaname, tablename, policyname, cmd, roles, qual, with_check
--     from pg_policies
--    where cmd <> 'SELECT'
--      and ((schemaname = 'public' and tablename = 'video_library')
--        or (schemaname = 'storage' and tablename = 'objects'
--            and (qual like '%video-library%' or with_check like '%video-library%')))
--    order by 1, 2, 4;
--
-- VERIFY after applying: the same query returns the 6 "Admin(s) …" policies,
-- every qual/with_check among them names auth.jwt() and 'email', and none is
-- bare true or the bucket check alone. Then, signed in as an admin, upload a
-- test video at /admin/videos (and delete it); signed in as anyone else, the
-- same insert answers "new row violates row-level security policy". Then
-- refresh tests/fixtures/db-policies.json and remove the video_library entry
-- from PENDING_APPLY in tests/rls-update-check.test.mjs.
--
-- The whole file is one transaction and ends with a guard that aborts it if
-- any client write policy on the table or the bucket still lacks the admin
-- check, so it either closes the hole or changes nothing.
--
-- ROLLBACK (recreates the policies exactly as they were on 2026-09-28; this
-- reopens the hole):
--   BEGIN;
--   DROP POLICY IF EXISTS "Admins can insert videos" ON public.video_library;
--   DROP POLICY IF EXISTS "Admins can update videos" ON public.video_library;
--   DROP POLICY IF EXISTS "Admins can delete videos" ON public.video_library;
--   DROP POLICY IF EXISTS "Admin upload for video-library" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin update for video-library" ON storage.objects;
--   DROP POLICY IF EXISTS "Admin delete for video-library" ON storage.objects;
--   CREATE POLICY "Authenticated users can insert videos" ON public.video_library
--     AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
--   CREATE POLICY "Authenticated users can update videos" ON public.video_library
--     AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
--   CREATE POLICY "Authenticated users can delete videos" ON public.video_library
--     AS PERMISSIVE FOR DELETE TO authenticated USING (true);
--   CREATE POLICY "Authenticated upload for video-library" ON storage.objects
--     AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (bucket_id = 'video-library'::text);
--   CREATE POLICY "Authenticated update for video-library" ON storage.objects
--     AS PERMISSIVE FOR UPDATE TO authenticated USING (bucket_id = 'video-library'::text);
--   CREATE POLICY "Authenticated delete for video-library" ON storage.objects
--     AS PERMISSIVE FOR DELETE TO authenticated USING (bucket_id = 'video-library'::text);
--   COMMIT;
-- ============================================================================

BEGIN;

-- the table -------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert videos" ON public.video_library;
DROP POLICY IF EXISTS "Authenticated users can update videos" ON public.video_library;
DROP POLICY IF EXISTS "Authenticated users can delete videos" ON public.video_library;

DROP POLICY IF EXISTS "Admins can insert videos" ON public.video_library;
CREATE POLICY "Admins can insert videos" ON public.video_library
  FOR INSERT TO authenticated
  WITH CHECK (lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

DROP POLICY IF EXISTS "Admins can update videos" ON public.video_library;
CREATE POLICY "Admins can update videos" ON public.video_library
  FOR UPDATE TO authenticated
  USING (lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'))
  WITH CHECK (lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

DROP POLICY IF EXISTS "Admins can delete videos" ON public.video_library;
CREATE POLICY "Admins can delete videos" ON public.video_library
  FOR DELETE TO authenticated
  USING (lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

-- the bucket ------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated upload for video-library" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for video-library" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for video-library" ON storage.objects;

DROP POLICY IF EXISTS "Admin upload for video-library" ON storage.objects;
CREATE POLICY "Admin upload for video-library" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-library'
              AND lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

DROP POLICY IF EXISTS "Admin update for video-library" ON storage.objects;
CREATE POLICY "Admin update for video-library" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'video-library'
         AND lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'))
  WITH CHECK (bucket_id = 'video-library'
              AND lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

DROP POLICY IF EXISTS "Admin delete for video-library" ON storage.objects;
CREATE POLICY "Admin delete for video-library" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'video-library'
         AND lower((select auth.jwt()) ->> 'email') IN ('zaid199660@gmail.com', 'baraawail101@gmail.com'));

-- the guard: abort if any client write policy on the table or the bucket
-- still admits a JWT without the admin check (e.g. one renamed in the
-- dashboard since this was measured).
DO $$
DECLARE
  open_policies text;
BEGIN
  SELECT string_agg(format('%I.%I %I (%s)', schemaname, tablename, policyname, cmd), ', ')
    INTO open_policies
    FROM pg_policies
   WHERE cmd <> 'SELECT'
     AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
     AND ((schemaname = 'public' AND tablename = 'video_library')
       OR (schemaname = 'storage' AND tablename = 'objects'
           AND (qual LIKE '%video-library%' OR with_check LIKE '%video-library%')))
     AND ((qual IS NOT NULL AND qual NOT LIKE '%auth.jwt()%''email''%')
       OR (with_check IS NOT NULL AND with_check NOT LIKE '%auth.jwt()%''email''%'));
  IF open_policies IS NOT NULL THEN
    RAISE EXCEPTION 'video library write policies without the admin check: %', open_policies;
  END IF;
END $$;

COMMIT;
