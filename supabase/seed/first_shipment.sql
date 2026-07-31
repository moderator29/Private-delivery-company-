-- SwiftTrack Private Delivery Company
-- The first live shipment: STX9 8475 6532 US
--
-- This is real operational data, not development seed data. It is kept in the
-- repository so the record can be recreated exactly if the project is ever
-- rebuilt from migrations.
--
-- Timestamps are stored as UTC instants. The +04 offsets below are Gulf
-- Standard Time, which is what the tracking page displays.
--
-- Re-running this script is safe: it removes and recreates the same shipment.

begin;

delete from public.shipments where tracking_id = 'STX984756532US';

with new_shipment as (
  insert into public.shipments (
    tracking_id,
    service_level,
    sender_name,
    origin_city, origin_state, origin_country, origin_latitude, origin_longitude,
    recipient_name,
    destination_address_line1,
    destination_city, destination_state, destination_postal_code, destination_country,
    destination_latitude, destination_longitude,
    package_type, weight_kg, piece_count,
    estimated_delivery_date, estimated_delivery_window,
    -- The recipient payment flow, configured on the record. The tracking page
    -- asks the recipient for an email first; once that is in, it shows the
    -- itemised invoice below and the wallet to pay it to. Amounts, currency,
    -- method and wallet all live here, never in the frontend.
    payment_status, payment_currency, total_amount_due,
    payment_method, payment_wallet_address,
    created_at
  ) values (
    'STX984756532US',
    'standard',
    'Andrew Goodson',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    'Rafael S Angarita',
    '15440 SW 74th Circle Ct #604',
    'Miami', 'Florida', '33193', 'US',
    25.761700, -80.191800,
    'Document', 0.05, 1,
    '2026-08-06', 'By 8:00 PM',
    'awaiting_recipient_email', 'USD', 3000.00,
    'BTC', 'bc1qn5q5m0z89wwuc3834393hh59f2454grzr6y7x2',
    timestamptz '2026-07-30 08:30:00+04'
  )
  returning id
)
insert into public.shipment_events
  (shipment_id, status, title, description, city, state, country, latitude, longitude, occurred_at)
select
  new_shipment.id,
  event.status::public.shipment_status,
  event.title,
  event.description,
  event.city,
  event.state,
  event.country,
  event.latitude,
  event.longitude,
  event.occurred_at
from new_shipment,
(values
  (
    'label_created',
    'Shipment Information Received',
    'Shipment details received and the waybill was created.',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    timestamptz '2026-07-30 08:30:00+04'
  ),
  (
    'picked_up',
    'Picked Up',
    'Collected from the sender by a SwiftTrack courier.',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    timestamptz '2026-07-30 11:15:00+04'
  ),
  (
    'in_transit',
    'Departed Origin Facility',
    'Processed for export and released from the Dubai gateway.',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    timestamptz '2026-07-30 16:40:00+04'
  ),
  (
    'in_transit',
    'In Transit',
    'Departed Dubai on the linehaul to the destination country.',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    timestamptz '2026-07-30 18:35:00+04'
  ),
  (
    'awaiting_verification',
    'Held for Verification',
    'The shipment is on hold at the Dubai gateway while we verify the contents and paperwork. It is not moving while this check is in progress. No action is needed from the sender or the recipient.',
    'Dubai', null, 'AE', 25.204800, 55.270800,
    timestamptz '2026-07-30 21:10:00+04'
  )
) as event(status, title, description, city, state, country, latitude, longitude, occurred_at);

-- The insert trigger derives status, current location and shipped_at from the
-- newest event, so nothing above sets them by hand.

-- The itemised invoice. total_amount_due above is the sum of these three lines;
-- the breakdown is what the recipient sees instead of a single opaque figure.
insert into public.shipment_invoice_items (shipment_id, description, amount, sort_order)
select s.id, item.description, item.amount, item.sort_order
from public.shipments s,
(values
  ('Customs Clearance Fee', 1500.00, 1),
  ('Import Processing Fee', 1400.00, 2),
  ('Documentation Fee', 100.00, 3)
) as item(description, amount, sort_order)
where s.tracking_id = 'STX984756532US';

commit;

select tracking_id, status, current_location_label, shipped_at, estimated_delivery_date
from public.shipments
where tracking_id = 'STX984756532US';
