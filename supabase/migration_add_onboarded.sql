-- Run this once in Supabase SQL Editor if you already ran schema.sql
-- before this update. New installs get this from schema.sql directly.

alter table profiles add column if not exists onboarded boolean not null default false;
