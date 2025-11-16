# Deployment Instructions

## Initial Deployment with Database Seeding

To deploy the application with initial data from `prisma/seed.ts`:

### 1. Set Environment Variables in Vercel

Go to your Vercel project dashboard:
- Navigate to **Settings** → **Environment Variables**
- Add the following variable:
  - **Name**: `SEED_DATABASE`
  - **Value**: `true`
  - **Environment**: Production (or all environments)

### 2. Deploy or Redeploy

- Push your code to trigger a new deployment, OR
- Click "Redeploy" in Vercel dashboard

The build process will:
1. Generate Prisma Client
2. Push schema to database (`prisma db push`)
3. **Seed the database** (because `SEED_DATABASE=true`)
4. Build the Next.js application

### 3. Remove Seed Variable (Optional but Recommended)

After the first successful deployment with seeded data:

- Go back to **Settings** → **Environment Variables**
- Delete the `SEED_DATABASE` variable OR set it to `false`
- This prevents re-seeding on every deployment

## Manual Database Seeding

If you prefer to seed the database manually:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run seed
```

## Environment Variables Required

Make sure these are set in Vercel:

- `DATABASE_URL` - PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from @BotFather
- `TELEGRAM_ADMIN_CHAT_ID` - Admin's Telegram chat ID
- `TELEGRAM_CHANNEL_ID` - Channel ID for posting reviews
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `SEED_DATABASE` - (Optional) Set to `true` for initial data seeding

## Troubleshooting

If seed fails:
1. Check Vercel build logs for errors
2. Verify DATABASE_URL is correct
3. Ensure database is accessible from Vercel
4. Check that seed file (`prisma/seed.ts`) is committed to repository
