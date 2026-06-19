-- Migration: Multi-stop route support with segment-aware seat availability
-- Run: psql -U postgres -d gego_api -f 001_add_segment_booking.sql

-- 1. Link Trip to Route
ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE trips ADD CONSTRAINT fk_trips_route
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);

-- 2. Add price_from_prev to route_stops (was in DTO but missing from entity)
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS price_from_prev DECIMAL(10,2) DEFAULT 0;

-- 3. Add segment columns to booking_seats
ALTER TABLE booking_seats ADD COLUMN IF NOT EXISTS departure_stop_id UUID;
ALTER TABLE booking_seats ADD COLUMN IF NOT EXISTS arrival_stop_id UUID;
ALTER TABLE booking_seats ADD CONSTRAINT fk_booking_seats_departure_stop
  FOREIGN KEY (departure_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT;
ALTER TABLE booking_seats ADD CONSTRAINT fk_booking_seats_arrival_stop
  FOREIGN KEY (arrival_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_booking_seats_departure_stop ON booking_seats(departure_stop_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_arrival_stop ON booking_seats(arrival_stop_id);
