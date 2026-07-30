-- SwiftTrack Private Delivery Company
-- Migration 0008: make the state / region field optional
--
-- The original schema came from a United States only model where every address
-- has a state. SwiftTrack ships from Dubai, and most emirates, city states and
-- many countries have no second level region at all. Requiring one forced
-- nonsense values such as "Dubai, Dubai", so the column is now nullable and the
-- UI omits the segment when it is absent.

alter table public.shipments alter column origin_state drop not null;
alter table public.shipments alter column destination_state drop not null;
