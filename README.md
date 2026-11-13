# Vlogger World Tracker

A map of YouTube videos by place, topic and channel. Built with React, Vite and Leaflet,
deployed to GitHub Pages on every push to `main`.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Adding videos

### From your computer

```bash
npm run add -- "https://www.youtube.com/playlist?list=PL..." --category history --countries EG
npm run add -- https://youtu.be/VIDEO_ID --category geopolitics --era 1914:1918
npm run add -- <url> --category history --era 500BC:300BC --dry-run   # preview only
npm run add -- --help                                                  # all options
```

- Videos are read with the YouTube Data API if `YT_API_KEY` is set, otherwise with [yt-dlp](https://github.com/yt-dlp/yt-dlp).
- Countries come from flag emojis and country names in each title. `--countries` is used for videos whose title names none.
- Videos that are already on the site are skipped. Running a playlist again only adds its new videos, and running it with another `--category` adds that topic to them.
- Private, deleted and members-only videos are skipped.
- Each video gets a pin at its country's centre unless you pass `--no-pin`. Edit `place` in the JSON to move a pin to a city.
- `--ai` asks Claude to read each title and description and fill in countries, era and an exact place. It needs `ANTHROPIC_API_KEY` (or `ant auth login`) and costs a little per video. Check its results before you push.

Then commit `public/data` and push. The site redeploys by itself.

### From GitHub (no computer needed)

1. One-time setup: in **Settings → Secrets and variables → Actions**, add `YT_API_KEY`. This is a free key from the
   [Google Cloud console](https://console.cloud.google.com/apis/library/youtube.googleapis.com). Add `ANTHROPIC_API_KEY` too if you want to use Claude.
2. Open **Actions → Add videos → Run workflow**, paste the URL, pick the topic and press **Run**.

The workflow commits the new videos and redeploys the site.

## Data

All data is static JSON in [`public/data/`](public/data/), so no server or database is needed.

| File | What it holds |
| --- | --- |
| `categories.json` | Topics: travel, history, geopolitics, invention, culture (id, name, icon, colour) |
| `channels.json` | YouTube channels (`id`, `name`, `country` as ISO code, `url`) |
| `videos/<category>.json` | Videos whose **main** topic is that category |
| `world.json` | Country borders for shading ([Natural Earth](https://www.naturalearthdata.com/), public domain) |

One video:

```json
{
  "id": "37f88pxl8OQ",
  "channel": "nadir-on-the-go-bangla",
  "title": "Topkapı Palace…",
  "categories": ["travel", "history"],
  "countries": ["TR"],
  "place": { "name": "Topkapı, Istanbul, Türkiye", "lat": 41.01, "lng": 28.98 },
  "era": { "from": 1465, "to": 1856 }
}
```

- `id` is the YouTube video ID (the part after `watch?v=`).
- `channel` must match an `id` in `channels.json`.
- `categories`: the first one decides which file the video lives in; list more if it fits several.
- `countries`: ISO 3166 two-letter codes. The first is used for the map pin and flag.
- `place` is optional. Videos without one still shade their countries and appear in the sidebar.
- `era` is optional (years, negative for BC). It drives the timeline slider shown inside a topic.
- `needsReview: true` marks videos whose country couldn't be found. Fill in `countries` and remove the flag.

To add a new topic, add it to `categories.json` and create an empty `videos/<id>.json` containing `[]`.
