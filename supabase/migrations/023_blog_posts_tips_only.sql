-- ============================================================
-- FuseID — Blog Posts: drop college_specific post type
-- ------------------------------------------------------------
-- The blog generator no longer produces school-spotlight posts.
-- Both post pools (recruiting-process topics and recruiting-tips
-- topics) now write to post_type = 'tips_guide'.
--
-- Existing college_specific rows are relabeled in place — their
-- content stays as-is. The CHECK constraint is narrowed to the
-- single allowed value, and the cron rotation key is renamed
-- (college_queue_index -> pool_a_topic_index) and reset to 0
-- since the index now references topic templates, not schools.
-- ============================================================

-- 1) Relabel the 20 existing college_specific rows
update public.blog_posts
   set post_type = 'tips_guide'
 where post_type = 'college_specific';

-- 2) Narrow the CHECK constraint. Postgres < 12 would need the
--    drop-then-add dance; this works on all currently-supported
--    versions and matches the original constraint name.
alter table public.blog_posts
  drop constraint if exists blog_posts_post_type_check;

alter table public.blog_posts
  add constraint blog_posts_post_type_check
  check (post_type in ('tips_guide'));

-- 3) Rotation keys: rename college_queue_index to pool_a_topic_index
--    (the index now selects a topic template, not a school) and
--    reset to 0; keep tips_topic_index as the Pool B counter under
--    a clearer name.
delete from public.cron_state where key = 'college_queue_index';
delete from public.cron_state where key = 'pool_a_topic_index';
insert into public.cron_state (key, value) values ('pool_a_topic_index', '0')
on conflict (key) do nothing;

-- Rename tips_topic_index -> pool_b_topic_index, preserving the
-- existing counter value so the rotation continues from where it was.
update public.cron_state
   set key = 'pool_b_topic_index'
 where key = 'tips_topic_index';

-- school_name column stays for now — the 20 relabeled rows still
-- reference schools in their content, so the column holds useful
-- metadata for those legacy rows. New posts leave it NULL.
