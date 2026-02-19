# fitbit-coach

Next.js App Router + Prisma 7 project for Fitbit OAuth and workout syncing.

## Environment Variables

- `DATABASE_URL`
- `FITBIT_CLIENT_ID`
- `FITBIT_CLIENT_SECRET`
- `FITBIT_REDIRECT_URI`
- `FITBIT_SCOPES`
- `CRON_SECRET`

## Fitbit Sync Cron

`vercel.json` schedules a daily cron to call `POST /api/fitbit/sync`.

The sync route accepts either header format:

- `x-cron-secret: <CRON_SECRET>`
- `Authorization: Bearer <CRON_SECRET>`

Vercel Cron can provide `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the project environment.

## Local Development

```bash
npm install
npm run dev
```

## Prisma

```bash
npx prisma migrate dev --name add_fitbit_models
npx prisma generate
```
