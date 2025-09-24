-- Initialize the database for Fashionfy Demo Integration
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (PostgreSQL will create it via environment variables)
-- Just ensure we're connected to the right database
\c fashly;

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create a simple health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Log initialization
SELECT 'Database initialized successfully at ' || NOW() as initialization_status;
