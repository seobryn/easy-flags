/**
 * Adapter Layer - LibSQL Payment Repository Implementation
 */

import { getDatabase } from "@lib/db";
import type { Client } from "@libsql/client";
import type { PaymentTransaction } from "@domain/entities";
import type { PaymentRepository } from "@application/ports/repositories";

export class LibSqlPaymentRepository implements PaymentRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async create(
    payment: Omit<PaymentTransaction, "id" | "created_at" | "updated_at">,
  ): Promise<PaymentTransaction> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO payments (space_id, pricing_plan_id, amount, currency, reference, status, external_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        payment.space_id,
        payment.pricing_plan_id,
        payment.amount,
        payment.currency,
        payment.reference,
        payment.status,
        payment.external_id || null,
      ],
    });

    const newPayment = await this.findById(Number(result.lastInsertRowid));
    if (!newPayment) throw new Error("Failed to create payment record");
    return newPayment;
  }

  async update(
    id: number,
    updates: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: any[] = [];

    if (updates.status) {
      fields.push("status = ?");
      args.push(updates.status);
    }
    if (updates.external_id !== undefined) {
      fields.push("external_id = ?");
      args.push(updates.external_id);
    }
    
    // updated_at is handled by the database or we can set it here
    // Since the trigger failed, we'll set it manually if we want it updated now
    fields.push("updated_at = CURRENT_TIMESTAMP");

    if (fields.length === 1 && fields[0] === "updated_at = CURRENT_TIMESTAMP") {
       // Nothing else to update
    } else {
      await db.execute({
        sql: `UPDATE payments SET ${fields.join(", ")} WHERE id = ?`,
        args: [...args, id],
      });
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error("Payment record not found after update");
    return updated;
  }

  async findById(id: number): Promise<PaymentTransaction | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM payments WHERE id = ?",
      args: [id],
    });
    return (result.rows[0] as unknown as PaymentTransaction) || null;
  }

  async findByReference(reference: string): Promise<PaymentTransaction | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM payments WHERE reference = ?",
      args: [reference],
    });
    return (result.rows[0] as unknown as PaymentTransaction) || null;
  }
}
