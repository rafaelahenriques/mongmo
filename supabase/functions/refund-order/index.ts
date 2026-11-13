// POST { orderId } → { ok }: refunds a cancelled order that was paid
// online, for its customer or for staff (the database checks which).
import { refundOrder } from '../_shared/payments.ts';
import { serveForUser, serviceDb, stripeApi, stripeClient } from '../_shared/server.ts';

serveForUser('refund-order', async (userId, orderId) => {
  await refundOrder({ db: serviceDb(), stripe: stripeApi(stripeClient()) }, userId, orderId);
  return { ok: true };
});
