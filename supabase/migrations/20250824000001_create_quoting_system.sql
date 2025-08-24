-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    
    -- Basic information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    
    -- Address
    address TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Additional info
    notes TEXT,
    tags TEXT[],
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Constraints
    CONSTRAINT unique_client_email_per_org UNIQUE(organization_clerk_id, email)
);

-- Create services table (if not already created by another migration)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    
    -- Service details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Pricing
    rate_type TEXT CHECK (rate_type IN ('hourly', 'fixed', 'custom')) DEFAULT 'fixed',
    rate DECIMAL(10, 2),
    unit TEXT, -- e.g., 'hour', 'day', 'project'
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Constraints
    CONSTRAINT unique_service_name_per_org UNIQUE(organization_clerk_id, name)
);

-- Create quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    
    -- Quote number (auto-generated)
    quote_number TEXT NOT NULL,
    
    -- Client reference
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Status tracking
    status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'declined', 'expired', 'converted')) DEFAULT 'draft',
    
    -- Validity
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    
    -- Financial details
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- Calculated discount amount
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    
    -- Additional fields
    terms_and_conditions TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Assignment
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    assigned_to_clerk_user_id TEXT,
    assigned_to_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_quote_number_per_org UNIQUE(organization_clerk_id, quote_number),
    CONSTRAINT valid_discount CHECK (
        (discount_type = 'percentage' AND discount_value >= 0 AND discount_value <= 100) OR
        (discount_type = 'fixed' AND discount_value >= 0) OR
        discount_type IS NULL
    )
);

-- Create quote_items table
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    organization_clerk_id TEXT NOT NULL,
    
    -- Item type and reference
    item_type TEXT CHECK (item_type IN ('product', 'service', 'custom')) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES services(id) ON DELETE RESTRICT,
    
    -- Item details (for all types)
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    
    -- Quantity and pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    
    -- Discounts (item level)
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0, -- Calculated discount amount
    
    -- Totals
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0, -- quantity * unit_price
    total DECIMAL(10, 2) NOT NULL DEFAULT 0, -- subtotal - discount_amount
    
    -- Order
    display_order INTEGER DEFAULT 0,
    
    -- Warehouse (for product reservation)
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    CONSTRAINT valid_item_reference CHECK (
        (item_type = 'product' AND product_id IS NOT NULL) OR
        (item_type = 'service' AND service_id IS NOT NULL) OR
        (item_type = 'custom')
    ),
    CONSTRAINT valid_item_discount CHECK (
        (discount_type = 'percentage' AND discount_value >= 0 AND discount_value <= 100) OR
        (discount_type = 'fixed' AND discount_value >= 0) OR
        discount_type IS NULL
    )
);

-- Create quote_events table for tracking
CREATE TABLE quote_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    organization_clerk_id TEXT NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'updated', 'sent', 'viewed', 'approved', 
        'declined', 'commented', 'expired', 'converted'
    )),
    event_metadata JSONB,
    
    -- User tracking
    user_id TEXT, -- Could be clerk user or client
    user_type TEXT CHECK (user_type IN ('team', 'client')),
    user_name TEXT,
    
    -- IP and user agent for client tracking
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create quote_comments table
CREATE TABLE quote_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    organization_clerk_id TEXT NOT NULL,
    
    -- Comment details
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal comments not visible to clients
    
    -- User tracking
    user_id TEXT,
    user_type TEXT CHECK (user_type IN ('team', 'client')),
    user_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Create quote_access_tokens table
CREATE TABLE quote_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    organization_clerk_id TEXT NOT NULL,
    
    -- Token details
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Validity
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '60 days'),
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    
    -- Creation
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_clients_org ON clients(organization_clerk_id);
CREATE INDEX idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX idx_services_org_status ON services(organization_clerk_id, status);
CREATE INDEX idx_quotes_org_status ON quotes(organization_clerk_id, status);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_assigned ON quotes(assigned_to_clerk_user_id) WHERE assigned_to_clerk_user_id IS NOT NULL;
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product ON quote_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_quote_items_service ON quote_items(service_id) WHERE service_id IS NOT NULL;
CREATE INDEX idx_quote_events_quote ON quote_events(quote_id);
CREATE INDEX idx_quote_comments_quote ON quote_comments(quote_id);
CREATE INDEX idx_quote_access_tokens_token ON quote_access_tokens(token) WHERE is_active = true;

-- Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients (all org members can manage)
CREATE POLICY "Members can view clients" ON clients
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Members can create clients" ON clients
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Members can update clients" ON clients
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- RLS Policies for services
CREATE POLICY "Members can view services" ON services
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Admins can manage services" ON services
    FOR ALL
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- RLS Policies for quotes (members can create and manage)
CREATE POLICY "Members can view quotes" ON quotes
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Members can create quotes" ON quotes
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

CREATE POLICY "Members can update own quotes or admins all" ON quotes
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND (
            created_by_clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
            OR assigned_to_clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
            OR is_admin_user()
        )
    );

CREATE POLICY "Admins can delete quotes" ON quotes
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- RLS Policies for quote_items
CREATE POLICY "Members can manage quote items" ON quote_items
    FOR ALL
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- RLS Policies for quote_events
CREATE POLICY "Members can view and create events" ON quote_events
    FOR ALL
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- RLS Policies for quote_comments
CREATE POLICY "Members can manage comments" ON quote_comments
    FOR ALL
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- RLS Policies for quote_access_tokens
CREATE POLICY "Members can manage tokens" ON quote_access_tokens
    FOR ALL
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number(p_org_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_quote_number TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get count of quotes for this year
    SELECT COUNT(*) + 1 INTO v_count
    FROM quotes
    WHERE organization_clerk_id = p_org_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    -- Generate quote number: QT-YYYY-XXXXX
    v_quote_number := 'QT-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    
    RETURN v_quote_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate quote item totals
CREATE OR REPLACE FUNCTION calculate_quote_item_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    
    -- Calculate discount amount
    IF NEW.discount_type = 'percentage' THEN
        NEW.discount_amount := NEW.subtotal * (NEW.discount_value / 100);
    ELSIF NEW.discount_type = 'fixed' THEN
        NEW.discount_amount := LEAST(NEW.discount_value, NEW.subtotal);
    ELSE
        NEW.discount_amount := 0;
    END IF;
    
    -- Calculate total
    NEW.total := NEW.subtotal - NEW.discount_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate item totals
CREATE TRIGGER trigger_calculate_quote_item_totals
    BEFORE INSERT OR UPDATE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_item_totals();

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals(p_quote_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(10, 2);
    v_discount_amount DECIMAL(10, 2);
    v_tax_amount DECIMAL(10, 2);
    v_total DECIMAL(10, 2);
    v_discount_type TEXT;
    v_discount_value DECIMAL(10, 2);
    v_tax_rate DECIMAL(5, 2);
BEGIN
    -- Get quote discount and tax info
    SELECT discount_type, discount_value, tax_rate
    INTO v_discount_type, v_discount_value, v_tax_rate
    FROM quotes
    WHERE id = p_quote_id;
    
    -- Calculate subtotal from items
    SELECT COALESCE(SUM(total), 0) INTO v_subtotal
    FROM quote_items
    WHERE quote_id = p_quote_id;
    
    -- Calculate quote-level discount
    IF v_discount_type = 'percentage' THEN
        v_discount_amount := v_subtotal * (v_discount_value / 100);
    ELSIF v_discount_type = 'fixed' THEN
        v_discount_amount := LEAST(v_discount_value, v_subtotal);
    ELSE
        v_discount_amount := 0;
    END IF;
    
    -- Calculate tax (after discount)
    v_tax_amount := (v_subtotal - v_discount_amount) * (v_tax_rate / 100);
    
    -- Calculate total
    v_total := v_subtotal - v_discount_amount + v_tax_amount;
    
    -- Update quote
    UPDATE quotes
    SET 
        subtotal = v_subtotal,
        discount_amount = v_discount_amount,
        tax_amount = v_tax_amount,
        total = v_total,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_quote_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory for quote
CREATE OR REPLACE FUNCTION reserve_quote_inventory(
    p_quote_item_id UUID,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_warehouse_id UUID;
    v_quantity DECIMAL;
    v_quote_id UUID;
    v_quote_number TEXT;
    v_result JSON;
BEGIN
    -- Get quote item details
    SELECT qi.product_id, qi.warehouse_id, qi.quantity, qi.quote_id, q.quote_number
    INTO v_product_id, v_warehouse_id, v_quantity, v_quote_id, v_quote_number
    FROM quote_items qi
    JOIN quotes q ON qi.quote_id = q.id
    WHERE qi.id = p_quote_item_id
    AND qi.item_type = 'product';
    
    -- If not a product, return success
    IF v_product_id IS NULL THEN
        RETURN json_build_object('success', true, 'message', 'Not a product item');
    END IF;
    
    -- Reserve inventory using existing function
    v_result := reserve_inventory(
        v_product_id,
        v_warehouse_id,
        v_quantity::INTEGER,
        v_quote_number,
        'quote',
        'Reserved for quote ' || v_quote_number,
        p_user_name
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release quote reservations
CREATE OR REPLACE FUNCTION release_quote_reservations(
    p_quote_id UUID,
    p_reason TEXT DEFAULT 'Quote expired or cancelled'
)
RETURNS JSON AS $$
DECLARE
    v_released_count INTEGER := 0;
    v_quote_number TEXT;
    r RECORD;
BEGIN
    -- Get quote number
    SELECT quote_number INTO v_quote_number
    FROM quotes
    WHERE id = p_quote_id;
    
    -- Find and release all reservations for this quote
    FOR r IN 
        SELECT id 
        FROM stock_movements 
        WHERE reference_number = v_quote_number 
        AND reference_type = 'quote'
        AND status = 'reserved'
    LOOP
        PERFORM release_reservation(r.id, p_reason);
        v_released_count := v_released_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'released_count', v_released_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert quote to sale
CREATE OR REPLACE FUNCTION convert_quote_to_sale(
    p_quote_id UUID,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_quote_number TEXT;
    v_completed_count INTEGER := 0;
    r RECORD;
BEGIN
    -- Get quote number
    SELECT quote_number INTO v_quote_number
    FROM quotes
    WHERE id = p_quote_id;
    
    -- Complete all reservations for this quote
    FOR r IN 
        SELECT id 
        FROM stock_movements 
        WHERE reference_number = v_quote_number 
        AND reference_type = 'quote'
        AND status = 'reserved'
    LOOP
        -- Convert reservation to sale
        UPDATE stock_movements
        SET 
            movement_type = 'sale',
            reference_type = 'sale',
            status = 'completed'
        WHERE id = r.id;
        
        -- Execute the completion
        PERFORM complete_reservation(r.id, NULL, 'Quote converted to sale', p_user_name);
        v_completed_count := v_completed_count + 1;
    END LOOP;
    
    -- Update quote status
    UPDATE quotes
    SET 
        status = 'converted',
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_quote_id;
    
    RETURN json_build_object(
        'success', true,
        'completed_count', v_completed_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE clients IS 'Store client/customer information for quotes and sales';
COMMENT ON TABLE services IS 'Service catalog with pricing for quotes';
COMMENT ON TABLE quotes IS 'Quote/proposal records with pricing and discounts';
COMMENT ON TABLE quote_items IS 'Line items in quotes (products, services, custom items)';
COMMENT ON TABLE quote_events IS 'Activity tracking for quotes';
COMMENT ON TABLE quote_comments IS 'Comments and discussions on quotes';
COMMENT ON TABLE quote_access_tokens IS 'Secure tokens for client access to quotes';