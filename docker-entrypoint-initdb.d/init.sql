-- PostgreSQL initialization script for SkyMentor
-- This script runs when the PostgreSQL container is first created

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant all privileges on the database to the skymentor user
GRANT ALL PRIVILEGES ON DATABASE skymentor TO skymentor;

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO skymentor;

-- Set search path
ALTER DATABASE skymentor SET search_path TO public;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'SkyMentor database initialized successfully';
END $$;
