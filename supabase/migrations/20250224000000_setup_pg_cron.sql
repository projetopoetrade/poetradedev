-- ============================================================================
-- pg_cron Setup for Automated Price Snapshots
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Enable pg_cron extension in Supabase Dashboard:
--    Go to: Database > Extensions > Search for "pg_cron" > Enable
--
-- 2. Enable pg_net extension (required for HTTP calls):
--    Go to: Database > Extensions > Search for "pg_net" > Enable
--
-- 3. Run this migration in Supabase SQL Editor or via CLI
--
-- 4. Set the CRON_SECRET environment variable in Vercel and note its value
--    Then replace 'YOUR_CRON_SECRET_HERE' below with the actual secret
--
-- ============================================================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to track cron job status
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id SERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log cron job execution
CREATE OR REPLACE FUNCTION log_cron_execution(
    p_job_name TEXT,
    p_status TEXT,
    p_message TEXT DEFAULT NULL,
    p_response_body TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO cron_job_logs (job_name, status, message, response_body)
    VALUES (p_job_name, p_status, p_message, p_response_body);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CRON JOB: Price Snapshot (Every hour)
-- ============================================================================
-- This calls the /api/tools/prices/snapshot endpoint to fetch and store prices

-- IMPORTANT: Replace YOUR_CRON_SECRET_HERE with your actual CRON_SECRET
-- and pathoftrade.net with your actual domain

SELECT cron.schedule(
    'price-snapshot-hourly',
    '0 * * * *', -- Every hour at minute 0
    $job$
    SELECT
        net.http_post(
            url := 'https://www.pathoftrade.net/api/tools/prices/snapshot',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 60000
        );
    $job$
);

-- ============================================================================
-- CRON JOB: Cleanup old price history (Daily at 3 AM)
-- ============================================================================
-- Keep only last 90 days of price history to avoid table bloat

SELECT cron.schedule(
    'cleanup-price-history-daily',
    '0 3 * * *', -- Every day at 3 AM
    $job$
    DELETE FROM currency_price_history
    WHERE snapshot_at < NOW() - INTERVAL '90 days';
    $job$
);

-- ============================================================================
-- CRON JOB: Sync products from ninja data (Daily at 4 AM)
-- ============================================================================

SELECT cron.schedule(
    'sync-ninja-products-daily',
    '0 4 * * *', -- Every day at 4 AM
    $job$
    SELECT
        net.http_post(
            url := 'https://www.pathoftrade.net/api/admin/sync-ninja',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer YOUR_CRON_SECRET_HERE'
            ),
            body := '{}'::jsonb,
            timeout_milliseconds := 120000
        );
    $job$
);

-- ============================================================================
-- Utility functions
-- ============================================================================

-- View to check cron job status
CREATE OR REPLACE VIEW cron_jobs_status AS
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
ORDER BY jobid;

-- Function to unschedule a job (if needed)
CREATE OR REPLACE FUNCTION unschedule_cron_job(p_job_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    SELECT cron.unschedule(p_job_name) INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to reschedule a job with a new secret
CREATE OR REPLACE FUNCTION reschedule_price_snapshot(p_secret TEXT, p_domain TEXT DEFAULT 'www.pathoftrade.net')
RETURNS VOID AS $$
BEGIN
    -- Unschedule existing
    PERFORM cron.unschedule('price-snapshot-hourly');
    
    -- Reschedule with new secret
    PERFORM cron.schedule(
        'price-snapshot-hourly',
        '0 * * * *',
        format($job$
            SELECT net.http_post(
                url := 'https://%s/api/tools/prices/snapshot',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer %s'
                ),
                body := '{}'::jsonb,
                timeout_milliseconds := 60000
            );
        $job$, p_domain, p_secret)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Monitor job logs
-- ============================================================================

-- Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_job_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_job_logs(job_name);

-- Function to get recent job logs
CREATE OR REPLACE FUNCTION get_recent_cron_logs(p_limit INT DEFAULT 50)
RETURNS TABLE (
    id INT,
    job_name TEXT,
    status TEXT,
    message TEXT,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.id,
        cl.job_name,
        cl.status,
        cl.message,
        cl.response_body,
        cl.created_at
    FROM cron_job_logs cl
    ORDER BY cl.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant permissions
-- ============================================================================
-- Allow service role to manage cron jobs

GRANT USAGE ON SCHEMA cron TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO service_role;
GRANT ALL PRIVILEGES ON TABLE cron_job_logs TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA cron TO service_role;
