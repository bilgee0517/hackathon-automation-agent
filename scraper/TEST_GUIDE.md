# 🧪 Quick Test Guide

## Test Single Project Import

Test the Devpost → Backend → Sanity pipeline with just one project!

### Quick Start

```bash
cd scraper

# Test with a single Devpost project
npm run test-import https://devpost.com/software/farmer-op
```

### What It Does

The test script will:
1. ✅ **Check configuration** (Sanity, backend)
2. 📋 **Scrape Devpost** for project info
3. 🤖 **Send to backend** for AI analysis  
4. 💾 **Create in Sanity** with enriched data
5. 📊 **Show summary** with Sanity Studio link

### Example Output

```bash
$ npm run test-import https://devpost.com/software/farmer-op

🧪 Testing Devpost to Sanity Integration
============================================================
✅ Backend available: http://localhost:3001
✅ Sanity configured: ks03r8vy

📦 Processing: https://devpost.com/software/farmer-op

📋 Step 1: Scraping Devpost...
URL: https://devpost.com/software/farmer-op
✅ Scraping complete!
   Title: Farmer OP
   Tagline: A farmer agent that helps you manage your crops
   Team members: 2
   Technologies: 4
   Awards: 1
   GitHub URLs: 1

🤖 Step 2: Sending to backend for AI analysis...
GitHub URL: https://github.com/user/farmer-op
✅ Job created: abc-123
⏳ Waiting for analysis (this may take a few minutes)...
   Running AI agent analysis...
   Analyzing codebase...
   Saving results to Sanity...
✅ Analysis complete!
   Sponsors detected: 3
   Main language: Python
   Total files: 45

💾 Step 3: Creating Sanity documents...
   ✅ Created hacker: John Doe
   ✅ Created hacker: Jane Smith
✅ Project created in Sanity!
   Project ID: project-abc123
   Team members: 2
   Sponsor integrations: 3
   Awards: 1
   Status: winner

============================================================
✨ SUCCESS! Test completed successfully!
============================================================

📊 Summary:
   Project: Farmer OP
   Sanity ID: project-abc123
   Has AI analysis: Yes ✅
   Team members: 2
   Sponsor integrations: 3

🔗 View in Sanity Studio:
   http://localhost:3333/structure/project;project-abc123
```

### Prerequisites

Before running the test:

1. **Backend must be running:**
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Environment configured:**
   ```bash
   # .env file should exist with:
   SANITY_PROJECT_ID=...
   SANITY_WRITE_TOKEN=...
   BACKEND_API_URL=http://localhost:3001
   ```

3. **Dependencies installed:**
   ```bash
   npm install
   ```

### Testing Different Projects

Try different Devpost projects:

```bash
# Winner with multiple awards
npm run test-import https://devpost.com/software/farmer-op

# Project without GitHub (Devpost data only)
npm run test-import https://devpost.com/software/some-project

# Recent submission
npm run test-import https://devpost.com/software/your-project
```

### What Gets Created in Sanity

After the test, you'll have:

- **2-3 Hacker documents** (team members)
- **1 Project document** with:
  - Devpost info (title, tagline, awards, video)
  - AI analysis (sponsor integrations, scores)
  - Team references
  - All metadata

### Verify in Sanity Studio

1. Open: http://localhost:3333
2. Navigate to: Structure → Project
3. Find your project by name
4. Check all fields are populated correctly

### Troubleshooting

**Backend not available:**
```bash
cd ../backend
npm run dev
```

**Sanity not configured:**
```bash
cp ../backend/.env .env
```

**Invalid URL:**
```
URL must be: https://devpost.com/software/project-name
```

### Next Steps

Once the test works:

1. **Import entire hackathon:**
   ```bash
   npm run import https://your-hackathon.devpost.com
   ```

2. **Or use the easy script:**
   ```bash
   ./import.sh
   ```

### Cleanup

To remove test data from Sanity:
1. Open Sanity Studio
2. Find the test project
3. Delete it (and its team members if needed)

---

**Ready to test?**

```bash
cd scraper
npm run test-import https://devpost.com/software/farmer-op
```

