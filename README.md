# Vlogger World Tracker

A map of YouTube videos by place, topic and channel. Built with React, Vite and Leaflet,
deployed to GitHub Pages on every push to `main`.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Data

All data is static JSON in [`public/data/`](public/data/), so no server or database is needed.

| File | What it holds |
| --- | --- |
| `categories.json` | Topics: travel, history, geopolitics, invention, culture (id, name, icon, colour) |
| `channels.json` | YouTube channels (`id`, `name`, `country` as ISO code, `url`) |
| `videos/<category>.json` | Videos whose **main** topic is that category |

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
- `place` is optional. Videos without one are kept but not pinned yet.
- `era` is optional (years, negative for BC). It is planned for a history timeline.
