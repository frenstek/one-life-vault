-- ═══════════════════════════════════════════════════════════════════════════
-- INVOICING — for NDIS claiming
-- ═══════════════════════════════════════════════════════════════════════════

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL DEFAULT '',
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'claimed', 'paid', 'rejected', 'void')),

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  service_period_start DATE,
  service_period_end DATE,

  -- NDIS claiming
  claim_reference TEXT,
  claim_type TEXT DEFAULT 'standard'
    CHECK (claim_type IN ('standard', 'cancellation', 'irregular')),

  -- Plan manager / billing
  bill_to TEXT,           -- e.g. plan manager name or "NDIA" or "Self"
  bill_to_email TEXT,

  -- Totals (auto-calculated from items, but stored for quick reads)
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- File attachment (for uploaded invoices)
  file_name TEXT,
  storage_path TEXT,
  file_type TEXT,
  file_size BIGINT,

  -- Notes
  notes TEXT,

  -- Audit
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- NDIS support item
  support_item_number TEXT,    -- e.g. "01_011_0107_1_1"
  support_item_name TEXT NOT NULL,
  description TEXT,

  -- Service details
  service_date DATE,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'hours',   -- hours, each, km, etc.
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- GST
  gst_applicable BOOLEAN DEFAULT FALSE,

  -- Computed
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,

  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate invoice numbers: INV-YYYYMM-001
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;
  prefix := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-';
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE prefix || '%';
  NEW.invoice_number := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_participant ON invoices(participant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
