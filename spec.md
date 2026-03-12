# Juventus Sops Nexus

## Current State
Backend maps for products, services, carts, orders, inquiries, paymentMethods, and paymentConfirmations are declared with plain `let`, making them non-stable. They reset to empty on every canister upgrade/redeploy. Only the ID counters (nextProductId, nextServiceId, nextPaymentMethodId) are stable, so counters increment but the stored data is wiped.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Change all persistent data maps from `let` to `stable var` so they survive upgrades
- Also change `userProfiles`, `userJoinedAt`, `carts`, `orders`, `inquiries` to stable
- Add missing `nextOrderId` and `nextInquiryId` stable counters (currently uses map size which is fragile)

### Remove
- Nothing

## Implementation Plan
1. Declare all Map variables as `stable var` in main.mo
2. Add stable nextOrderId and nextInquiryId counters
3. Use those counters when creating orders and inquiries
