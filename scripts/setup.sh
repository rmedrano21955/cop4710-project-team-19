#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
#  PitWall — first-time setup script
#  Usage: bash scripts/setup.sh
# ─────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
header() { echo -e "\n${BOLD}$1${NC}"; echo "$(printf '─%.0s' {1..50})"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
cd "$ROOT"

echo -e "\n${BOLD}${RED}PitWall${NC} — Database Setup"
echo -e "F1 Statistics 2010–2024\n"

# ── 1. Check dependencies ───────────────────
header "1/6  Checking dependencies"

command -v node  >/dev/null 2>&1 || fail "Node.js not found. Install from https://nodejs.org"
command -v npm   >/dev/null 2>&1 || fail "npm not found."
command -v psql  >/dev/null 2>&1 || fail "psql not found. Install PostgreSQL: brew install postgresql@14"
ok "Node $(node -v), npm $(npm -v), psql $(psql --version | awk '{print $3}')"

# ── 2. Install npm dependencies ─────────────
header "2/6  Installing npm packages"
npm install --silent
ok "Dependencies installed"

# ── 3. PostgreSQL ────────────────────────────
header "3/6  PostgreSQL"

# Start if not running
if ! pg_isready -q 2>/dev/null; then
  info "PostgreSQL not running — starting..."
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
  fi
  pg_isready -q 2>/dev/null || fail "Could not start PostgreSQL. Start it manually and re-run."
fi
ok "PostgreSQL is running"

# Create .env.local if missing
if [ ! -f ".env.local" ]; then
  DB_USER="$(whoami)"
  echo "DATABASE_URL=postgresql://${DB_USER}@localhost:5432/pitwall" > .env.local
  ok "Created .env.local (user: ${DB_USER})"
else
  ok ".env.local already exists"
fi

# Load DATABASE_URL
export $(grep -v '^#' .env.local | xargs)

# Create database if missing
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\///')
if psql -lqt 2>/dev/null | cut -d\| -f1 | grep -qw "$DB_NAME"; then
  ok "Database '$DB_NAME' already exists"
else
  info "Creating database '$DB_NAME'..."
  createdb "$DB_NAME"
  ok "Database '$DB_NAME' created"
fi

# ── 4. Schema ────────────────────────────────
header "4/6  Running schema"
info "Creating tables (drops existing data)..."
psql "$DATABASE_URL" -f scripts/schema.sql -q
ok "Schema applied"

# ── 5. Seed data ─────────────────────────────
header "5/6  Seeding data"

DATA_DIR="$ROOT/data"
REQUIRED_FILES="drivers.csv constructors.csv circuits.csv races.csv results.csv status.csv driver_standings.csv constructor_standings.csv"
MISSING=""

for f in $REQUIRED_FILES; do
  [ ! -f "$DATA_DIR/$f" ] && MISSING="$MISSING $f"
done

if [ -n "$MISSING" ]; then
  echo ""
  warn "Missing CSV files in data/ directory:$MISSING"
  echo ""
  echo "  Download the Kaggle dataset:"
  echo "  1. Go to: https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020"
  echo "  2. Click Download"
  echo "  3. Unzip into the data/ folder so data/drivers.csv etc. exist"
  echo ""
  echo "  Or if you have the Kaggle CLI:"
  echo "  kaggle datasets download -d rohanrao/formula-1-world-championship-1950-2020 -p data/ --unzip"
  echo ""
  read -p "Press Enter once the CSV files are in data/, or Ctrl+C to cancel: "

  # Re-check
  MISSING=""
  for f in $REQUIRED_FILES; do
    [ ! -f "$DATA_DIR/$f" ] && MISSING="$MISSING $f"
  done
  [ -n "$MISSING" ] && fail "Still missing: $MISSING"
fi

ok "CSV files found"
info "Importing data (this takes ~30 seconds)..."
npx tsx scripts/seed.ts
ok "Data imported"

# ── 6. Driver headshots ──────────────────────
header "6/6  Driver headshots"
info "Fetching headshots from F1.com CDN..."
npx tsx scripts/enrich-headshots.ts
info "Fetching remaining headshots from formulaonehistory.com..."
npx tsx scripts/enrich-headshots-f1history.ts

# ── Done ─────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}Setup complete!${NC}"
echo ""
echo "  Start the dev server:"
echo -e "  ${CYAN}npm run dev${NC}"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
