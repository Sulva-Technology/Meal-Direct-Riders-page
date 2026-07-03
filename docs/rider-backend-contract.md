# Rider Backend Contract Required For Launch

This rider app does not fake backend success. UI either uses current backend endpoints or shows manual/API-unavailable states.

## Delivery Lifecycle

Current supported endpoints in app:

- `POST /rider/assignments/:id/accept`
- `POST /rider/assignments/:id/picked-up`
- `POST /rider/orders/:id/out-for-delivery`
- `POST /rider/orders/:id/delivered`
- `POST /rider/orders/:id/issues`

Required missing or unconfirmed endpoints:

- `POST /rider/assignments/:id/decline`
  - Body: `{ "reason"?: string }`
  - Returns: `RiderAssignmentDetail`
- `POST /rider/assignments/:id/arrived-at-vendor`
  - Body: optional timestamp/GPS
  - Returns: `RiderAssignmentDetail`
- `POST /rider/orders/:id/arrived-at-customer`
  - Body: optional timestamp/GPS
  - Returns: `RiderOrderDetail`
- `POST /rider/orders/:id/delivery-proof`
  - Body: confirmation code, rider note, timestamp, optional GPS/photo URL, customer-unavailable reason
  - Returns: `RiderOrderDetail`

## Issue Reporting

Required issue fields:

- `orderId`
- `riderId`
- `currentDeliveryStatus`
- `category`
- `description`
- `timestamp`
- Optional `imageUrl`

Required categories:

- `vendor_delay`
- `customer_unavailable`
- `wrong_address_location`
- `wrong_item_package`
- `customer_dispute`
- `unsafe_delivery_situation`
- `app_issue`
- `payment_order_mismatch`
- `other`

## Rider Payout Account

Required endpoints:

- `GET /rider/payout-account`
  - Returns null when no account exists.
  - Returns status, bank name, masked account number, account name, verification status, payout mode, updated date.
- `PUT /rider/payout-account`
  - Body: `bankName`, `bankCode?`, `accountName`, `accountNumber`
  - Saves for operations review.

Required payout states:

- `none`
- `pending_verification`
- `verified`
- `verification_failed`
- `admin_review_required`

Required payout modes:

- `manual`
- `automatic`

## Earnings And Notifications

Current app uses:

- `GET /rider/earnings`
- `GET /rider/settlements`
- `GET /notifications`

Notification event types should cover:

- New delivery assigned
- Vendor order ready
- Delivery cancelled
- Customer/support update
- Payout/earning update
- Issue resolution
