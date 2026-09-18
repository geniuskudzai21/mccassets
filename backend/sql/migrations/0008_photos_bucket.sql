-- =============================================================================
-- 0008 - Photos storage bucket
--
-- Inspection photos are uploaded to Supabase Storage via signed URLs signed
-- with the service-role key and served back through the public URL. This
-- creates the required public `photos` bucket. Idempotent.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  TRUE,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;