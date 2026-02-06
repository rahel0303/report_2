-- Migration: Add reports table
-- Jalankan script ini jika database sudah ada dan hanya perlu menambahkan tabel reports

-- Tabel reports untuk menyimpan laporan user
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slides JSONB NOT NULL DEFAULT '[]',
    config JSONB NOT NULL DEFAULT '{}',
    report_type VARCHAR(50) DEFAULT 'report', -- 'report' atau 'template'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);

-- Trigger untuk auto-update updated_at
-- (Pastikan function update_updated_at_column sudah ada dari schema.sql)
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verifikasi
SELECT 'Table reports created successfully!' as status;
