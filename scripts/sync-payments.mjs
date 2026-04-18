import { getRepositoryRegistry } from "../src/infrastructure/registry.js";
import { getDatabase } from "../src/lib/db.js";
import { PaymentService } from "../src/application/services/payment.service.js";
import * as dotenv from "dotenv";

dotenv.config();

async function syncPendingPayments() {
  console.log("Starting payment sync job...");

  const registry = getRepositoryRegistry();
  const paymentRepo = registry.getPaymentRepository();
  const paymentService = PaymentService.getInstance();

  // Connect to DB to find pending payments
  const db = await getDatabase();

  try {
    // Get payments that are PENDING and created more than 10 minutes ago
    const pending = await db.execute(`
      SELECT * FROM payments 
      WHERE status = 'PENDING' 
      AND created_at < datetime('now', '-10 minutes')
    `);

    console.log(`Found ${pending.rows.length} pending payments to sync.`);

    for (const tx of pending.rows) {
      const paymentId = Number(tx.id);
      const externalId = tx.external_id;

      if (!externalId) {
        console.log(`Skipping payment ${paymentId}: No external_id found.`);
        continue;
      }

      console.log(
        `Checking status for payment ${paymentId} (external_id: ${externalId})...`,
      );

      // 1. Fetch current status from Wompi API
      const wompiTx =
        await paymentService.paymentGateway.getTransactionStatus(externalId);
      const newStatus = paymentService.mapWompiStatus(wompiTx.status);

      console.log(`Wompi status for ${paymentId}: ${newStatus}`);

      // 2. Update if status changed
      if (newStatus !== "PENDING") {
        await paymentService.updatePaymentStatus(paymentId, newStatus);
        console.log(`Payment ${paymentId} updated to ${newStatus}.`);
      }
    }

    console.log("Sync job completed successfully.");
  } catch (err) {
    console.error("Sync job failed:", err);
  }

  process.exit(0);
}

syncPendingPayments();
