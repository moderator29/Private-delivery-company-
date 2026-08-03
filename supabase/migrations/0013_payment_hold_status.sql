-- SwiftTrack Private Delivery Company
-- Migration 0013: a hold state for shipments with an unpaid balance
--
-- 'awaiting_verification' says the package is stopped while we check something,
-- and nothing is owed. That is the wrong sentence for a shipment carrying an
-- unpaid invoice: there the hold has one cause, one owner and one exit, and the
-- recipient needs to read all three off the status line. 'exception' would hide
-- it behind a catch-all, and 'delayed' would imply the package is still moving.
--
-- Like the verification hold this is not a closed status: the remaining
-- milestones still project and the shipment resumes its normal path once
-- payment is confirmed and an operator records the next scan.
--
-- A shipment on this status has no schedule. The application clears its
-- estimated delivery date rather than keeping a date it cannot honour, and the
-- tracking page prints "On Hold" where the date would sit.

alter type public.shipment_status add value if not exists 'payment_hold' after 'awaiting_verification';
