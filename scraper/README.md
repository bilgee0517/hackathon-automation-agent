# Devpost Project Scraper

Scrapes all projects from the Self-Evolving Agents Hack hackathon on Devpost.

## Installation

```bash
npm install
```

## Usage

### Test the scraper on a single project:
```bash
npm run test
```

### Run the full scraper:
```bash
npm run scrape
```

This will:
1. Scrape all project URLs from the gallery (pages 1-2)
2. Visit each project page and extract data
3. Save each project as a JSON file in the `projects/` directory

## Output

All project data is saved in the `projects/` directory:
- `{slug}.json` - Individual project files
- `_project-urls.json` - List of all project URLs
- `_summary.json` - Scraping statistics

## Data Structure

Each project JSON contains:
```json
{
  "title": "Project Name",
  "slug": "project-slug",
  "url": "https://devpost.com/software/project-slug",
  "tagline": "Short one-liner description",
  "description": "Full story content as text",
  "videoURL": "https://youtube.com/...",
  "coverImage": "https://...",
  "technologies": ["tech1", "tech2"],
  "teamMembers": ["Name 1", "Name 2"],
  "awards": ["Winner – Best use of X"],
  "status": "winner",
  "links": {
    "github": "https://github.com/...",
    "demo": "https://...",
    "other": []
  },
  "hackathon": {
    "name": "Self-Evolving Agents Hack",
    "url": "https://devpost.com/..."
  },
  "stats": {
    "likes": 0,
    "comments": 0
  },
  "scrapedAt": "2025-11-21T..."
}
```

## Notes

- The scraper includes a 1-second delay between requests to be polite
- Failed requests are retried up to 3 times with exponential backoff
- Projects with awards automatically get `status: "winner"`
- All output is saved in JSON format for easy processing

