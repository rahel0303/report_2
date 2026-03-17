-- Tabel untuk tracking brand aktif per bulan
-- Admin set langsung via DB, bukan via admin panel
-- Kalau ada row (brand_id, month_year) → brand aktif di bulan itu

CREATE TABLE IF NOT EXISTS l1_socmed.dim_brand_active_months (
  id          SERIAL PRIMARY KEY,
  brand_id    INTEGER NOT NULL,       -- FK ke l1_socmed.dim_brands.id
  month_year  VARCHAR(7) NOT NULL,    -- format: MM-YYYY, e.g. '02-2026'
  UNIQUE (brand_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_dim_brand_active_months_month_year
  ON l1_socmed.dim_brand_active_months(month_year);

-- Contoh insert:
-- INSERT INTO l1_socmed.dim_brand_active_months (brand_id, month_year) VALUES (1, '02-2026');
-- INSERT INTO l1_socmed.dim_brand_active_months (brand_id, month_year) VALUES (2, '02-2026');
