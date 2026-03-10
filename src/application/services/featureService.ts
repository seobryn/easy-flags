import { Feature, FeatureValue } from "../../domain/models";
import { FeatureRepository } from "../../infrastructure/repositories/featureRepository";
import { FeatureValueRepository } from "../../infrastructure/repositories/featureValueRepository";

export class FeatureService {
  constructor(
    private readonly featureRepository: FeatureRepository,
    private readonly featureValueRepository: FeatureValueRepository,
  ) {}

  async listFeatures(): Promise<Feature[]> {
    return this.featureRepository.listAll();
  }

  async listFeaturesBySpace(spaceId: number): Promise<Feature[]> {
    return this.featureRepository.listBySpaceId(spaceId);
  }

  async createFeature(
    key: string,
    description?: string,
    spaceId?: number,
  ): Promise<Feature> {
    if (!spaceId) {
      throw new Error(
        "spaceId is required - all features must belong to a space. Use /api/spaces/:spaceId/features endpoint.",
      );
    }
    return this.featureRepository.create(key, description, spaceId);
  }

  async deleteFeature(id: number): Promise<boolean> {
    await this.featureValueRepository.deleteByFeatureId(id);
    return this.featureRepository.deleteById(id);
  }

  async setFeatureValue(
    featureId: number,
    environmentId: number,
    value: boolean,
  ): Promise<FeatureValue> {
    return this.featureValueRepository.upsert(featureId, environmentId, value);
  }

  async findByKey(key: string, spaceId?: number): Promise<Feature | undefined> {
    return this.featureRepository.findByKey(key, spaceId);
  }
}
