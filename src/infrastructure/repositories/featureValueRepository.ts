import getDb from "../../db";
import { FeatureValue } from "../../domain/models";

export class FeatureValueRepository {
  async listFeatureIdsByEnvironmentId(
    environmentId: number,
  ): Promise<number[]> {
    const db = await getDb();
    const rows = await db.all<{ feature_id: number }>(
      "SELECT DISTINCT feature_id FROM feature_values WHERE environment_id = ?",
      environmentId,
    );
    return rows.map((row) => row.feature_id);
  }

  async deleteByEnvironmentId(environmentId: number): Promise<void> {
    const db = await getDb();
    await db.run(
      "DELETE FROM feature_values WHERE environment_id = ?",
      environmentId,
    );
  }

  async deleteByFeatureId(featureId: number): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM feature_values WHERE feature_id = ?", featureId);
  }

  async deleteByFeatureIds(featureIds: number[]): Promise<void> {
    if (featureIds.length === 0) return;
    const db = await getDb();
    const placeholders = featureIds.map(() => "?").join(", ");
    await db.run(
      `DELETE FROM feature_values WHERE feature_id IN (${placeholders})`,
      ...featureIds,
    );
  }

  async deleteAll(): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM feature_values");
  }

  async findByFeatureAndEnvironment(
    featureId: number,
    environmentId: number,
  ): Promise<FeatureValue | undefined> {
    const db = await getDb();
    return db.get<FeatureValue>(
      "SELECT * FROM feature_values WHERE feature_id = ? AND environment_id = ?",
      featureId,
      environmentId,
    );
  }

  async findValueByFeatureAndEnvironment(
    featureId: number,
    environmentId: number,
  ): Promise<number | undefined> {
    const db = await getDb();
    const result = await db.all<{ value: number }>(
      "SELECT value FROM feature_values WHERE feature_id = ? AND environment_id = ?",
      featureId,
      environmentId,
    );
    return result[0]?.value;
  }

  async findByFeatureAndEnvironmentAndSpaceId(
    featureId: number,
    environmentId: number,
    spaceId: number,
  ): Promise<FeatureValue | undefined> {
    const db = await getDb();
    return db.get<FeatureValue>(
      `SELECT fv.* FROM feature_values fv
       JOIN features f ON fv.feature_id = f.id
       JOIN environments e ON fv.environment_id = e.id
       WHERE fv.feature_id = ? AND fv.environment_id = ? 
       AND f.space_id = ? AND e.space_id = ?`,
      [featureId, environmentId, spaceId, spaceId],
    );
  }

  async upsert(
    featureId: number,
    environmentId: number,
    value: boolean,
  ): Promise<FeatureValue> {
    const db = await getDb();
    const exists = await this.findByFeatureAndEnvironment(
      featureId,
      environmentId,
    );

    if (exists) {
      await db.run(
        "UPDATE feature_values SET value = ? WHERE id = ?",
        value ? 1 : 0,
        exists.id,
      );
    } else {
      await db.run(
        "INSERT INTO feature_values (feature_id, environment_id, value) VALUES (?, ?, ?)",
        featureId,
        environmentId,
        value ? 1 : 0,
      );
    }

    const updated = await this.findByFeatureAndEnvironment(
      featureId,
      environmentId,
    );
    return updated as FeatureValue;
  }

  async upsertWithSpaceValidation(
    featureId: number,
    environmentId: number,
    spaceId: number,
    value: boolean,
  ): Promise<FeatureValue> {
    const db = await getDb();
    const exists = await this.findByFeatureAndEnvironmentAndSpaceId(
      featureId,
      environmentId,
      spaceId,
    );

    if (exists) {
      await db.run(
        "UPDATE feature_values SET value = ? WHERE id = ?",
        value ? 1 : 0,
        exists.id,
      );
    } else {
      await db.run(
        "INSERT INTO feature_values (feature_id, environment_id, value) VALUES (?, ?, ?)",
        featureId,
        environmentId,
        value ? 1 : 0,
      );
    }

    const updated = await this.findByFeatureAndEnvironmentAndSpaceId(
      featureId,
      environmentId,
      spaceId,
    );
    if (!updated) {
      throw new Error("Feature and environment must belong to the same space");
    }
    return updated;
  }
}
