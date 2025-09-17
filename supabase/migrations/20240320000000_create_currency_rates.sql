-- Create currency_rates table
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency)
);

-- Insert initial rates
INSERT INTO currency_rates (from_currency, to_currency, rate) VALUES
    ('BRL', 'BRL', 1.000000),
    ('BRL', 'USD', 0.200000),
    ('BRL', 'EUR', 0.180000),
    ('USD', 'BRL', 5.000000),
    ('USD', 'USD', 1.000000),
    ('USD', 'EUR', 0.900000),
    ('EUR', 'BRL', 5.555556),
    ('EUR', 'USD', 1.111111),
    ('EUR', 'EUR', 1.000000)
ON CONFLICT (from_currency, to_currency) 
DO UPDATE SET 
    rate = EXCLUDED.rate,
    last_updated = CURRENT_TIMESTAMP;

-- Create function to get conversion rate
CREATE OR REPLACE FUNCTION get_conversion_rate(
    p_from_currency VARCHAR(3),
    p_to_currency VARCHAR(3)
) RETURNS DECIMAL(10, 6) AS $$
BEGIN
    RETURN (
        SELECT rate 
        FROM currency_rates 
        WHERE from_currency = UPPER(p_from_currency) 
        AND to_currency = UPPER(p_to_currency)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to convert amount
CREATE OR REPLACE FUNCTION convert_amount(
    p_amount DECIMAL(10, 2),
    p_from_currency VARCHAR(3),
    p_to_currency VARCHAR(3)
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
    RETURN p_amount * get_conversion_rate(p_from_currency, p_to_currency);
END;
$$ LANGUAGE plpgsql;

-- Create view for current rates
CREATE OR REPLACE VIEW current_currency_rates AS
SELECT 
    from_currency,
    to_currency,
    rate,
    last_updated
FROM currency_rates
WHERE last_updated >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_currency_rates_lookup 
ON currency_rates(from_currency, to_currency);

-- Add RLS policies
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to currency rates"
    ON currency_rates FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to update rates"
    ON currency_rates FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated'); 