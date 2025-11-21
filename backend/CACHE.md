# Cache Management

## Overview

The system **no longer uses caching by default** - every analysis is fresh. This ensures you always get the latest results from the codebase.

## Cache Location

All temporary files are stored in the backend directory:
- **Cloned repos**: `backend/tmp/repos/`
- **Zip files**: `backend/*.zip`
- **Redis cache**: In Redis database (if enabled)

## Clean Cache & Temp Files

### Quick Clean (Recommended)

```bash
cd backend
npm run clean
```

This will:
- ✓ Clear Redis database
- ✓ Remove `tmp/` directory
- ✓ Remove `repos/` directory  
- ✓ Remove any `.zip` files
- ✓ Recreate `tmp/repos/` directory

### Manual Clean

```bash
cd backend

# Remove temporary directories
rm -rf tmp/
rm -rf repos/
rm *.zip

# Clear Redis cache
redis-cli FLUSHDB

# Recreate temp directory
mkdir -p tmp/repos
```

## Why No Caching?

For hackathons, you want:
- **Fresh analysis** every time teams push updates
- **No stale results** from cached data
- **Latest code** always analyzed

## If You Want to Enable Caching

If you need caching for performance (e.g., analyzing the same repo multiple times during development):

1. Edit `backend/src/api/routes.ts` (around line 31):
```typescript
// Uncomment these lines:
const cached = await getCachedAnalysisResult(githubUrl);
if (cached) {
  return res.json({
    status: 'complete',
    cached: true,
    result: cached
  });
}
```

2. Edit `backend/src/api/processor.ts` (around line 95):
```typescript
// Uncomment these lines:
await updateJobStatus(jobId, 'analyzing', 'Caching results...');
console.log('Step 6: Caching results...');
await cacheAnalysisResult(githubUrl, analysis);
console.log('✓ Results cached');
```

3. Rebuild:
```bash
npm run build
```

## Cache Duration

If enabled, cache lasts:
- **24 hours** (86400 seconds)
- Stored in Redis with key: `analysis:{repoUrl}`

## Storage Locations

```
backend/
├── tmp/
│   └── repos/          ← Cloned repositories (temporary)
│       └── {uuid}/     ← Each analysis gets unique ID
├── *.zip               ← Zipped repos before S3 upload (temporary)
└── .gitignore          ← Ensures these don't get committed
```

## Clean on Startup

To always start fresh, add to your startup:

```bash
npm run clean && npm run dev
```

## Monitoring Storage

Check what's taking up space:

```bash
cd backend

# Check temp directory size
du -sh tmp/

# List cloned repos
ls -lh tmp/repos/

# Check Redis memory usage
redis-cli INFO memory
```

## Auto-Cleanup

The system automatically:
- ✓ Deletes cloned repos after analysis completes
- ✓ Removes zip files after S3 upload
- ✓ Uses unique IDs to avoid conflicts

## Troubleshooting

### "Disk full" error
```bash
npm run clean
```

### "Can't clone repo" error
Check if `tmp/repos/` is writable:
```bash
ls -ld backend/tmp/repos/
```

### Redis full
```bash
redis-cli FLUSHDB
```

## Best Practices

1. **Run `npm run clean`** periodically during development
2. **Don't commit** tmp/ or cache files (already in .gitignore)
3. **Monitor disk space** if analyzing many large repos
4. **Use caching** only for development/testing, not production

---

**TL;DR**: Run `npm run clean` to clear everything! 🧹

