# Vlogger World Tracker

A map of YouTube videos by place, topic and channel. Built with React, Vite and Leaflet, with the
data in a Supabase database. Deployed to GitHub Pages on every push to `main`.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Setup

The site reads everything from Supabase. Put the project's address and publishable key in
`.env.local` (this file is not committed):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

For the deployed site, add the same two values as repository secrets
(**Settings → Secrets and variables → Actions**); the deploy workflow passes them to the build.

A new database is set up by running, in the Supabase SQL editor:

1. [`supabase/schema.sql`](supabase/schema.sql): the tables and their access rules
2. [`supabase/seed.sql`](supabase/seed.sql): a backup of all topics, channels, videos and corrections,
   exported from the live database (it only adds rows that are missing, so it is safe to run again).
   User accounts aren't in it: people sign up again and an admin approves them.

## Adding and editing videos

Everything is done on the site's edit page (`#/edit`): sign in, then add videos, correct a video's
countries or pin, set channels' countries, and (admins) manage topics and approve members.
Changes show on the map straight away; there is nothing to commit.

## Data

| Where | What it holds |
| --- | --- |
| `categories` table | Topics (id, name, emoji icon, colour, tab order) |
| `channels` table | YouTube channels (id, name, country as ISO code, link, optional logo) |
| `channels_extra` table | Channels added or edited on the edit page (their name, country and link win) |
| `videos` table | One row per video: channel, title, topics, countries, optional place and years |
| `video_overrides` table | Corrections made on the edit page (countries, place) |
| `public/data/world.json` | Country borders for shading ([Natural Earth](https://www.naturalearthdata.com/), public domain) |

- **Countries** are ISO 3166 two-letter codes. The first one gets the map pin and flag.
  `EARTH` means a video about the whole world: it shades the entire map and is listed under "Earth".
- **A place** is optional. Videos without one still shade their countries and appear in the sidebar.
- **Years** (`era_from`, `era_to`; negative for BC) are optional and drive the History timeline.

**Channel logos:** put the image in `public/logos/` (square, about 128–256 px) and set the channel's
`logo` to `logos/<file>.png` in the `channels` table (a full `https://` link works too). The logo
replaces the country flag on the channel button and appears under each video in the sidebar.

Credits: Veritasium logo by Derek Muller, public domain, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Veritasium_square_logo.png).
