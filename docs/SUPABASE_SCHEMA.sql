-- =========================================================================
-- STRIDESENSE - SUPABASE POSTGRESQL SCHEMA
-- Execute this in your Supabase SQL Editor: https://supabase.com/dashboard/project/sgooptohhldguitvhbrl/sql
-- =========================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Devices Table
create table if not exists public.devices (
    id text primary key, -- e.g., 'insole_left_01'
    user_id uuid references auth.users(id) on delete cascade,
    name text not null default 'StrideSense Smart Insole',
    battery_pct integer default 100,
    battery_voltage numeric(4, 2) default 4.20,
    firmware_version text default 'v1.4.2-TinyML',
    calibration_status text default 'CALIBRATED',
    last_seen timestamptz default now()
);

-- 3. Telemetry Table (Time-Series Sensor Stream)
create table if not exists public.telemetry (
    id bigserial primary key,
    device_id text not null references public.devices(id) on delete cascade,
    created_at timestamptz default now(),
    activity text not null, -- 'Standing', 'Walking', 'Running', 'Sitting', 'Fall'
    confidence numeric(4, 3) not null default 0.95,
    steps integer not null default 0,
    cadence numeric(5, 1) not null default 0.0,
    symmetry numeric(5, 1) not null default 100.0,
    fall_alert boolean not null default false,
    
    -- Pressure Sensor Readings (12-bit ADC: 0 - 4095)
    p1 integer not null default 0, -- Heel
    p2 integer not null default 0, -- Midfoot Lateral
    p3 integer not null default 0, -- Midfoot Medial
    p4 integer not null default 0, -- Forefoot Lateral
    p5 integer not null default 0, -- Forefoot Medial
    p6 integer not null default 0, -- Big Toe
    
    -- IMU Kinematics
    pitch numeric(5, 1) not null default 0.0,
    roll numeric(5, 1) not null default 0.0,
    svm_a numeric(5, 2) not null default 1.00
);

-- Index for fast time-series retrieval
create index if not exists idx_telemetry_device_time on public.telemetry(device_id, created_at desc);

-- 4. Fall Incidents Log Table
create table if not exists public.fall_incidents (
    id uuid primary key default uuid_generate_v4(),
    device_id text not null references public.devices(id) on delete cascade,
    occurred_at timestamptz default now(),
    impact_g numeric(5, 2) not null,
    status text not null default 'PENDING_CONFIRMATION', -- 'PENDING_CONFIRMATION', 'CANCELLED_BY_USER', 'EMERGENCY_DISPATCHED'
    cancel_duration_sec integer,
    resolved boolean not null default false
);

-- 5. Enable Real-Time Replication on Telemetry
-- Allows the React/Capacitor app to receive instant WebSocket updates
alter publication supabase_realtime add table public.telemetry;
alter publication supabase_realtime add table public.fall_incidents;

-- 6. Insert Default Prototype Device
insert into public.devices (id, name, battery_pct, battery_voltage)
values ('insole_left_01', 'StrideSense Left Foot Insole', 90, 4.02)
on conflict (id) do nothing;

-- 7. Row Level Security (RLS) Policies
alter table public.devices enable row level security;
alter table public.telemetry enable row level security;
alter table public.fall_incidents enable row level security;

-- Allow public read & insert for rapid prototype demonstration
create policy "Allow anon read devices" on public.devices for select using (true);
create policy "Allow anon insert telemetry" on public.telemetry for insert with check (true);
create policy "Allow anon read telemetry" on public.telemetry for select using (true);
create policy "Allow anon all falls" on public.fall_incidents for all using (true);
