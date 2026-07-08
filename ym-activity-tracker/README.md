# Rushton View 7th Ward — Young Men Activity Tracker

A shared web app that replaces the ward's Young Men activity-planning spreadsheet.
Deacons/Teachers/Priests views are just filters over one `activities` table — there is
only one record per activity, so an edit made from any view shows up everywhere.

Stack: a single Cloudflare Worker serves both the JSON API (`/api/*`) and the static
frontend (plain HTML/CSS/vanilla JS, no build step), backed by a Cloudflare D1 database.

## One-time setup

From this directory (`ym-activity-tracker/`):

```bash
npm install -g wrangler   # if you don't already have it

# Create the D1 database, then paste the returned database_id into wrangler.toml
wrangler d1 create ym-activity-tracker

# Apply the schema
wrangler d1 execute ym-activity-tracker --file=./schema.sql --remote

# Load the 2026 seed data (activities only — birthdays/discussion leaders start empty)
wrangler d1 execute ym-activity-tracker --file=./seed.sql --remote
```

### Secrets

Editing (add/edit/delete) requires a shared PIN. Reading is always public, no login.

```bash
wrangler secret put EDITOR_PIN
# enter the PIN the ward will share, e.g. a 4-6 digit number

wrangler secret put SESSION_SECRET
# enter a long random string (used only to sign edit-session tokens, e.g.
# `openssl rand -hex 32`) — never reuse the PIN itself here
```

## Deploy

```bash
wrangler deploy
```

That's it — one Worker serving the app at the URL wrangler prints.

## Local development

```bash
wrangler d1 execute ym-activity-tracker --file=./schema.sql --local
wrangler d1 execute ym-activity-tracker --file=./seed.sql --local
wrangler dev
```

`wrangler dev` runs against a local D1 database by default, so run the two commands above
with `--local` first (they're separate from the `--remote` copies used in production).

## How editing works

Click **Edit Mode** and enter the shared PIN. The Worker checks it against `EDITOR_PIN`
and returns a short-lived signed token (HMAC'd with `SESSION_SECRET`, ~12 hour expiry),
stored in `sessionStorage` and sent as `Authorization: Bearer <token>` on writes. Closing
the tab or the token expiring drops back to read-only — no accounts, no passwords per
person, just the one shared PIN.

## Reusing this for 2027

The activity data is just rows in D1. To reuse the template for a new year, bulk-update
the year on `activity_date` (and `assignment_date` for discussion leaders), e.g.:

```bash
wrangler d1 execute ym-activity-tracker --remote \
  --command "UPDATE activities SET activity_date = REPLACE(activity_date, '2026-', '2027-')"
```

Birthdays aren't year-specific and don't need updating.
