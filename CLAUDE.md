# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StarShop - полноценный интернет-магазин для Telegram Mini App. Специализируется на онлайн товарах: донатах в игры (Mobile Legends, PUBG Mobile, Free Fire, Steam) и подписках на сервисы для жителей Приднестровья.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript with strict mode
- **UI**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **File Storage**: Vercel Blob
- **Telegram**: Telegram Mini App SDK, Telegram Bot API
- **Package Manager**: Bun
- **Deployment**: Vercel

## Development Commands

```bash
# Development
bun dev              # Start dev server

# Database
bunx prisma generate # Generate Prisma Client
bunx prisma migrate dev # Run migrations
bunx prisma studio   # Open Prisma Studio
bun run seed         # Seed database with test data

# Build & Deploy
bun run build        # Build for production (includes prisma generate)
bun start            # Start production server
bun run lint         # Run ESLint
```

## Project Structure

```
app/
  api/                # API Routes
    products/         # Product CRUD
    orders/           # Order management
    reviews/          # Review system
    admin/stats/      # Admin statistics
    upload/           # File upload (Vercel Blob)
    telegram/webhook/ # Telegram bot webhook
    auth/telegram/    # Telegram authentication
  admin/              # Admin dashboard with editable tables
  orders/             # User orders page
    [id]/review/      # Review creation page
  product/[id]/       # Product detail page with order flow
  profile/            # User profile
  layout.tsx          # Root layout with TelegramProvider
  page.tsx            # Home page with product catalog

components/           # React components
  CategoryTabs.tsx    # Tab navigation
  Header.tsx          # Navigation header
  ProductCard.tsx     # Product display card
  ReviewCard.tsx      # Review display

lib/
  prisma.ts           # Prisma client singleton
  telegram.ts         # Telegram bot helpers
  hooks/
    useTelegramUser.ts # Custom hook for user auth

prisma/
  schema.prisma       # Database schema
  seed.ts             # Seed data

providers/
  TelegramProvider.tsx # Telegram Mini App integration

types/
  index.ts            # TypeScript type definitions
```

## Database Schema

### Models
- **User**: Telegram users (telegramId, username, orders, reviews)
- **Product**: Shop items (name, category, gameType, prices, discount, image)
- **Order**: Purchase orders (orderNumber, user, product, payment details, status)
- **Review**: User reviews (order, user, rating, comment)

### Enums
- ProductCategory: GAME, SERVICE
- GameType: MOBILE_LEGENDS, PUBG_MOBILE, FREE_FIRE, STEAM, OTHER
- PaymentMethod: APB_TRANSFER, CARD_TRANSFER
- OrderStatus: PENDING, PAID, PROCESSING, COMPLETED, REJECTED

## Key Features

### Order Flow
1. User selects product → enters Player ID
2. Chooses payment method (АПБ переводилка or bank card)
3. Uploads payment screenshot
4. Screenshot sent to admin via Telegram bot with buttons (Complete/Reject)
5. Admin updates order status
6. User can leave review after completion
7. Review automatically posted to Telegram channel

### Admin Dashboard (app/admin/page.tsx)
- **Excel-like editing**: Click any cell to edit price, discount, sort order
- Real-time product table updates
- Statistics dashboard: total users, orders, revenue
- Orders by status breakdown
- Recent orders list

### Telegram Integration
- **Authentication**: Verifies Telegram WebApp init data
- **Bot notifications**: Sends order details to admin chat
- **Review publishing**: Posts reviews to channel automatically
- **Webhook**: Handles admin button callbacks (complete/reject orders)

## Architecture Notes

### Path Aliases
`@/*` maps to root directory (tsconfig.json)

### Styling
- Dark blue theme (--background: #0a1128, --indigo-dye, --cerulean)
- Raleway font (Cyrillic + Latin)
- Tailwind CSS 4 with custom CSS variables in globals.css
- Responsive design for mobile (Telegram Mini App)

### API Design
- RESTful API routes in app/api/
- All routes return JSON
- Error handling with appropriate status codes
- Admin routes require authentication (should add middleware)

### File Upload
- Uses Vercel Blob for screenshot storage
- POST /api/upload accepts FormData with file
- Returns public URL for stored file

### Environment Variables
Required in .env:
- DATABASE_URL (PostgreSQL connection string)
- TELEGRAM_BOT_TOKEN (from @BotFather)
- TELEGRAM_ADMIN_CHAT_ID (admin's Telegram chat ID)
- TELEGRAM_CHANNEL_ID (for review posts)
- BLOB_READ_WRITE_TOKEN (Vercel Blob storage)

## Development Notes

- Russian language UI (target audience: Приднестровье)
- Mobile-first design for Telegram Mini App
- Uses localStorage for caching authenticated user
- No traditional authentication - relies on Telegram WebApp verification
- Prisma Client is generated at build time (postinstall hook)

## Deployment (Vercel)

1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Configure PostgreSQL database (Vercel Postgres or Supabase)
4. Deploy: `vercel --prod`
5. Set Telegram webhook: `curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"`

## Testing Locally

1. Set up local PostgreSQL or use cloud database
2. Copy .env.example to .env and fill in values
3. Run `bunx prisma migrate dev` to create tables
4. Run `bun run seed` to add test products
5. Start dev server: `bun dev`
6. Open in Telegram Web App or use ngrok for testing Mini App features
