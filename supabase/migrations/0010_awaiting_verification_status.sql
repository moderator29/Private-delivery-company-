-- SwiftTrack Private Delivery Company
-- A hold state for shipments under verification.
--
-- The existing vocabulary had no way to say "this package is stopped while we
-- check something". The closest were 'delayed', which implies the package is
-- still moving but behind schedule, and 'exception', which is a catch-all that
-- tells a customer nothing about what is happening or whether it is serious.
-- Neither says the one thing a customer needs to know here: the package is not
-- moving right now, on purpose, and nothing is wrong with it.
--
-- It is a hold, not an ending, so it is deliberately not a closed status: the
-- remaining milestones still project, and the shipment resumes its normal path
-- once an operator records the next scan.

alter type public.shipment_status add value if not exists 'awaiting_verification' after 'exception';
