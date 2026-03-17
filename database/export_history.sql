-- Tabel untuk menyimpan history export PPTX per user
-- Schema: public

CREATE TABLE IF NOT EXISTS public.export_history (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name             VARCHAR(255) NOT NULL,
  brand_name       VARCHAR(255) NOT NULL,
  period           VARCHAR(20)  NOT NULL,
  slide_count      INTEGER      NOT NULL,
  is_partial       BOOLEAN      NOT NULL DEFAULT false,
  config           JSONB        NOT NULL DEFAULT '{}',
  gcs_object_name  VARCHAR(500),
  cover_image_url  TEXT,
  exported_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id
  ON public.export_history(user_id);

CREATE INDEX IF NOT EXISTS idx_export_history_brand_period
  ON public.export_history(brand_name, period);
