-- PostgreSQL schema para RPG 2D Online MVP
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  username text UNIQUE NOT NULL,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  gold integer NOT NULL DEFAULT 10,
  x integer NOT NULL DEFAULT 64,
  y integer NOT NULL DEFAULT 64,
  inventory jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  label text NOT NULL,
  description text,
  value integer NOT NULL DEFAULT 1,
  sprite text
);

CREATE TABLE IF NOT EXISTS character_items (
  id serial PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_id integer REFERENCES items(id),
  quantity integer NOT NULL DEFAULT 1
);
