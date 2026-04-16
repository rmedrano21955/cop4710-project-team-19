# PitWall — COP 4710 Team 19

Formula 1 historical statistics browser (2010–2024), built for COP 4710 Theory and Structure of Databases at FSU.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **PostgreSQL 14** — raw SQL via `pg`, no ORM
- **Tailwind CSS** — dark F1 pit-wall theme
- **Recharts** — cumulative points chart on Compare page

## Features

- **Drivers** — card grid with search, nationality filter, career stats modal
- **Races** — season → race cascading selectors, 4-table JOIN results table
- **Standings** — driver/constructor championship tabs, SUM + GROUP BY
- **Constructors** — card grid with driver counts and detail view
- **Circuits** — table with expandable race history rows
- **Compare** — head-to-head stats with CASE WHEN aggregation + Recharts line chart
- **Admin** — full CRUD for drivers, constructors, and circuits

## Setup

1. Install dependencies: `npm install`
2. Start PostgreSQL and create the database: `createdb pitwall`
3. Run schema: `psql pitwall < scripts/schema.sql`
4. Place Kaggle CSVs in `data/` then seed: `npx tsx scripts/seed.ts`
5. Copy `.env.local.example` to `.env.local` and set `DATABASE_URL`
6. Run dev server: `npm run dev`

## Data Source

Kaggle "Formula 1 World Championship (1950–2024)" by Rohan Rao — loaded via CSV bulk import, filtered to 2010–2024 seasons. Driver headshots from the OpenF1 API.
