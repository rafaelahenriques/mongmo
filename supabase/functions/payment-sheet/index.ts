// POST { orderId } → { clientSecret }: starts paying a draft order online.
// Needs the customer's sign-in (Supabase checks the JWT before this runs).
import { startPayment } from '../_shared/payments.ts';
import { serveForUser, serviceDb, stripeApi, stripeClient } from '../_shared/server.ts';

serveForUser('payment-sheet', (userId, orderId) =>
  startPayment({ db: serviceDb(), stripe: stripeApi(stripeClient()) }, userId, orderId),
);
