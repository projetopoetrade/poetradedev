# Supabase pg_cron Setup Guide

This project uses Supabase pg_cron for scheduled tasks instead of Vercel Cron Jobs.

## Why pg_cron?

- ✅ Works in all environments (production, preview, local)
- ✅ Better visibility and logging
- ✅ More control over schedules
- ✅ Free (included in Supabase)
- ✅ Can be managed via SQL

## Setup Instructions

### 1. Enable Required Extensions

In Supabase Dashboard, go to **Database > Extensions** and enable:

1. `pg_cron` - For scheduling jobs
2. `pg_net` - For making HTTP requests

### 2. Run the Migration

Option A - Using Supabase CLI:
```bash
supabase db push
```

Option B - Using Supabase Dashboard:
1. Go to **SQL Editor**
2. Copy the contents of `supabase/migrations/20250224000000_setup_pg_cron.sql`
3. Replace `YOUR_CRON_SECRET_HERE` with your actual `CRON_SECRET` from `.env.local`
4. Replace `www.pathoftrade.net` with your actual domain (if different)
5. Execute the SQL

### 3. Verify Jobs Are Scheduled

Run this SQL in Supabase SQL Editor:
```sql
SELECT * FROM cron_jobs_status;
```

You should see:
- `price-snapshot-hourly` - Runs every hour
- `cleanup-price-history-daily` - Runs daily at 3 AM
- `sync-ninja-products-daily` - Runs daily at 4 AM

### 4. Test Manually

You can trigger jobs manually:
```bash
# Test price snapshot
curl -X POST https://your-domain.com/api/tools/prices/snapshot \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test ninja sync
curl -X POST https://your-domain.com/api/admin/sync-ninja \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `price-snapshot-hourly` | `0 * * * *` | Fetches poe.ninja prices and saves to history |
| `cleanup-price-history-daily` | `0 3 * * *` | Deletes price history older than 90 days |
| `sync-ninja-products-daily` | `0 4 * * *` | Syncs new products from price history |

## Useful Commands

### Check Job Status
```sql
SELECT * FROM cron_jobs_status;
```

### Check Recent Runs
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Unschedule a Job
```sql
SELECT cron.unschedule('job-name-here');
```

### Reschedule with New Secret
```sql
SELECT reschedule_price_snapshot('YOUR_NEW_SECRET', 'www.pathoftrade.net');
```

### View Logs
```sql
SELECT * FROM get_recent_cron_logs(50);
```

## Troubleshooting

### Jobs not running?

1. Check if extensions are enabled:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. Check job status:
```sql
SELECT * FROM cron.job WHERE active = true;
```

3. Check recent runs for errors:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

### HTTP requests failing?

- Verify `CRON_SECRET` matches in both Supabase and Vercel
- Check that `pg_net` extension is enabled
- Verify the domain is correct in the job definition

## Local Development

For local development, you can:

1. Trigger endpoints manually with curl
2. Use a local cron scheduler like `node-cron`
3. Run the snapshot endpoint from the browser: `GET /api/tools/prices/snapshot`

## Migration from Vercel Cron

The `vercel.json` file has been removed. All scheduled tasks are now managed via pg_cron.

Benefits of this migration:
- Jobs run in all environments (not just production)
- Better debugging via Supabase Dashboard
- More flexible scheduling
- Can be updated without redeploying
