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

Run the setup script — it handles everything automatically:

```bash
bash scripts/setup.sh
```

The script will:
1. Check Node.js, npm, and PostgreSQL are installed
2. Install npm dependencies
3. Start PostgreSQL if it's not running
4. Create `.env.local` and the `pitwall` database
5. Apply the schema
6. Prompt you to place the Kaggle CSV files in `data/` (see below)
7. Import the data and fetch driver headshots

**Kaggle dataset:** Download "Formula 1 World Championship (1950–2024)" by Rohan Rao from Kaggle and unzip the CSVs into the `data/` folder. The setup script will wait for you to do this before continuing.

After setup, start the dev server:
```bash
npm run dev
```

## Data Source

Kaggle "Formula 1 World Championship (1950–2024)" by Rohan Rao — loaded via CSV bulk import, filtered to 2010–2024 seasons. Driver headshots from the OpenF1 API.
