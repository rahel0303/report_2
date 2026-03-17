-- ============================================================
-- Admin Panel Migration
-- Jalankan di database: socmed_report
-- ============================================================

-- 1. Buat tabel companies
CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trigger update updated_at untuk companies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Add company_id to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES public.companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- 4. Add company_id to dim_brand_active_months
ALTER TABLE l1_socmed.dim_brand_active_months ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE;

-- 5. Drop old unique constraint and add new one including company_id
ALTER TABLE l1_socmed.dim_brand_active_months DROP CONSTRAINT IF EXISTS dim_brand_active_months_brand_id_month_year_key;
ALTER TABLE l1_socmed.dim_brand_active_months ADD CONSTRAINT IF NOT EXISTS dim_brand_active_months_company_brand_month_key UNIQUE (company_id, brand_id, month_year);
