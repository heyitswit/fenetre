# Fenêtre

A self-hosted scheduling and booking platform for freelancers. Clients book meetings directly from your public profile — no back-and-forth emails.

Ps: It's my first time with sveltekit's remote function, I think I need to learn a few optimisation tips to reduce latency

![Hero](img/hero.gif)

## Screenshots

![Booking flow](img/booking-flow.png)
![Admin — Bookings](img/panel-bookings.png)

## Features

- **Public booking pages** — shareable `/:username/:event-slug` links for each event type
- **Availability management** — define working hours and block time off
- **Google Calendar sync** — reads busy slots and writes confirmed bookings
- **Automated emails** — confirmation, reminders, and cancellations via Resend (MJML templates)
- **Cron jobs** — send reminders, mark completed bookings, flag abandoned ones
- **Multi-user** — admin can manage multiple freelancer accounts with a shared directory
- **French company enrichment** — optional Pappers API integration to prefill client details
- **i18n** — built-in internationalization with Paraglide
- **Dark mode** — system-aware with manual toggle

## Tech Stack

| Layer     | Choice                                                   |
| --------- | -------------------------------------------------------- |
| Framework | SvelteKit (Svelte 5)                                     |
| Language  | TypeScript                                               |
| Styling   | Tailwind CSS v4                                          |
| Database  | PostgreSQL + Drizzle ORM                                 |
| Auth      | Better Auth (email/password, Google OAuth, GitHub OAuth) |
| Email     | Resend + MJML + Handlebars                               |
| Runtime   | Bun                                                      |
| Container | Docker                                                   |

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- Docker & Docker Compose (for the database)
- A [Resend](https://resend.com) account (email)
- A Google Cloud project with OAuth 2.0 credentials and the Calendar API enabled

## Setup

```bash
git clone https://github.com/gradleless/fenetre
cd fenetre
cp .env.example .env
```

Fill in `.env` — see [Environment Variables](#environment-variables) below.

### Development

```bash
bun install
bun run db:start      # starts Postgres via Docker Compose
bun run db:push       # push schema to the database
bun run dev
```

### Production (Docker Compose)

```bash
docker compose up -d
```

The app is available at `http://localhost:3000` by default.

On first run, navigate to `/setup` to create the initial admin account.

## Environment Variables

| Variable               | Required | Description                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                                                |
| `ORIGIN`               | Yes      | Public URL of the app (e.g. `https://yourdomain.com`)                       |
| `BETTER_AUTH_SECRET`   | Yes      | Random secret — generate with `openssl rand -base64 32`                     |
| `RESEND_API_KEY`       | Yes      | Resend API key                                                              |
| `RESEND_FROM_EMAIL`    | Yes      | Sender address                                                              |
| `PUBLIC_APP_URL`       | Yes      | Used by cron endpoints (`http://app:3000` in Docker, otherwise your domain) |
| `CRON_SECRET`          | Yes      | Shared secret for cron route auth — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`     | OAuth    | Google OAuth client ID                                                      |
| `GOOGLE_CLIENT_SECRET` | OAuth    | Google OAuth client secret                                                  |
| `GOOGLE_CALENDAR_ID`   | No       | Fallback calendar ID (default: `primary`)                                   |
| `GITHUB_CLIENT_ID`     | No       | GitHub OAuth client ID                                                      |
| `GITHUB_CLIENT_SECRET` | No       | GitHub OAuth client secret                                                  |
| `REGISTRATION_OPEN`    | No       | Set to `true` to allow public self-registration (default: `false`)          |
| `PAPPERS_API_KEY`      | No       | [Pappers](https://www.pappers.fr/api) key for French company lookup         |

## Database Commands

```bash
bun run db:push       # sync schema (dev)
bun run db:generate   # generate migration files
bun run db:migrate    # run migrations
bun run db:studio     # open Drizzle Studio
```

## Available Scripts

```bash
bun run dev           # start dev server
bun run build         # production build
bun run preview       # preview production build
bun run check         # svelte-check type checking
bun run lint          # check formatting with Prettier
bun run format        # format code with Prettier
bun run auth:schema   # regenerate Better Auth schema file
```

## Admin

After logging in, `/admin` gives access to:

- **Bookings** — view and manage all scheduled sessions
- **Event Types** — create and configure booking forms
- **Availability** — set working hours
- **Users** — manage accounts (admin only)
- **Settings** — connect Google Calendar, update profile

## Embed Widget

`static/booking-widget.js` lets you embed a booking modal on any external website (portfolio, marketing page, etc.) without an iframe tag in your markup.

**Include the script:**

```html
<script
	src="https://your-fenetre-instance.com/booking-widget.js"
	data-url="https://your-fenetre-instance.com"
	data-username="alice"
></script>
```

**Open the event type picker** (lists all event types for a user):

```html
<button data-booking>Book a call</button>
```

**Open a specific event type directly:**

```html
<button data-event="discovery-30min">Book a discovery call</button>
```

**Optional attributes on each button:**

| Attribute       | Description                                               |
| --------------- | --------------------------------------------------------- |
| `data-username` | Override the default username set on the script tag       |
| `data-from`     | Source tag passed to the booking (default: `"portfolio"`) |

The modal closes automatically when the booking is confirmed or when the user clicks outside it.

## License

MIT
