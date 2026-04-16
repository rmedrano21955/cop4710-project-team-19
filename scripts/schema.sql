-- PitWall Database Schema
-- F1 Statistics 2010-2024

DROP TABLE IF EXISTS constructor_standings CASCADE;
DROP TABLE IF EXISTS driver_standings CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS status CASCADE;
DROP TABLE IF EXISTS circuits CASCADE;
DROP TABLE IF EXISTS constructors CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;

-- Independent tables
CREATE TABLE drivers (
  driver_id    INTEGER PRIMARY KEY,
  driver_ref   VARCHAR(255) NOT NULL,
  number       VARCHAR(10),
  code         VARCHAR(3),
  forename     VARCHAR(255) NOT NULL,
  surname      VARCHAR(255) NOT NULL,
  dob          DATE,
  nationality  VARCHAR(255),
  url          VARCHAR(512),
  headshot_url TEXT
);

CREATE TABLE constructors (
  constructor_id  INTEGER PRIMARY KEY,
  constructor_ref VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  nationality     VARCHAR(255),
  url             VARCHAR(512)
);

CREATE TABLE circuits (
  circuit_id  INTEGER PRIMARY KEY,
  circuit_ref VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  location    VARCHAR(255),
  country     VARCHAR(255),
  lat         DECIMAL,
  lng         DECIMAL,
  alt         INTEGER,
  url         VARCHAR(512)
);

CREATE TABLE status (
  status_id INTEGER PRIMARY KEY,
  status    VARCHAR(255) NOT NULL
);

-- Dependent tables
CREATE TABLE races (
  race_id    INTEGER PRIMARY KEY,
  year       INTEGER NOT NULL,
  round      INTEGER NOT NULL,
  circuit_id INTEGER NOT NULL REFERENCES circuits(circuit_id),
  name       VARCHAR(255) NOT NULL,
  date       DATE,
  time       VARCHAR(20),
  url        VARCHAR(512)
);

CREATE TABLE results (
  result_id         INTEGER PRIMARY KEY,
  race_id           INTEGER NOT NULL REFERENCES races(race_id),
  driver_id         INTEGER NOT NULL REFERENCES drivers(driver_id),
  constructor_id    INTEGER NOT NULL REFERENCES constructors(constructor_id),
  number            INTEGER,
  grid              INTEGER,
  position          INTEGER,
  position_text     VARCHAR(10),
  position_order    INTEGER NOT NULL,
  points            DECIMAL NOT NULL DEFAULT 0,
  laps              INTEGER,
  time              VARCHAR(50),
  milliseconds      INTEGER,
  fastest_lap       INTEGER,
  rank              INTEGER,
  fastest_lap_time  VARCHAR(20),
  fastest_lap_speed VARCHAR(20),
  status_id         INTEGER NOT NULL REFERENCES status(status_id)
);

CREATE TABLE driver_standings (
  driver_standing_id INTEGER PRIMARY KEY,
  race_id            INTEGER NOT NULL REFERENCES races(race_id),
  driver_id          INTEGER NOT NULL REFERENCES drivers(driver_id),
  points             DECIMAL NOT NULL DEFAULT 0,
  position           INTEGER,
  position_text      VARCHAR(10),
  wins               INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE constructor_standings (
  constructor_standing_id INTEGER PRIMARY KEY,
  race_id                 INTEGER NOT NULL REFERENCES races(race_id),
  constructor_id          INTEGER NOT NULL REFERENCES constructors(constructor_id),
  points                  DECIMAL NOT NULL DEFAULT 0,
  position                INTEGER,
  position_text           VARCHAR(10),
  wins                    INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_races_year ON races(year);
CREATE INDEX idx_races_circuit ON races(circuit_id);
CREATE INDEX idx_results_race ON results(race_id);
CREATE INDEX idx_results_driver ON results(driver_id);
CREATE INDEX idx_results_constructor ON results(constructor_id);
CREATE INDEX idx_results_status ON results(status_id);
CREATE INDEX idx_driver_standings_race ON driver_standings(race_id);
CREATE INDEX idx_driver_standings_driver ON driver_standings(driver_id);
CREATE INDEX idx_constructor_standings_race ON constructor_standings(race_id);
CREATE INDEX idx_constructor_standings_constructor ON constructor_standings(constructor_id);
CREATE INDEX idx_drivers_nationality ON drivers(nationality);
CREATE INDEX idx_drivers_surname ON drivers(surname);
