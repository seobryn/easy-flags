import { Environment, Feature } from "../../domain/models";
import { EnvironmentRepository } from "../../infrastructure/repositories/environmentRepository";
import { FeatureRepository } from "../../infrastructure/repositories/featureRepository";
import { FeatureValueRepository } from "../../infrastructure/repositories/featureValueRepository";

export class FlagQueryService {
  constructor(
    private readonly environmentRepository: EnvironmentRepository,
    private readonly featureRepository: FeatureRepository,
    private readonly featureValueRepository: FeatureValueRepository,
  ) {}

  async getFlagsByEnvironmentName(environmentName: string): Promise<{
    environment: Environment;
    flags: Array<Feature & { value: boolean }>;
  } | null> {
    const environment =
      await this.environmentRepository.findByName(environmentName);
    if (!environment) return null;

    const features = await this.featureRepository.listAll();
    const flags: Array<Feature & { value: boolean }> = [];

    for (const feature of features) {
      const value =
        await this.featureValueRepository.findValueByFeatureAndEnvironment(
          feature.id,
          environment.id,
        );
      flags.push({
        ...feature,
        value: value ? Boolean(value) : false,
      });
    }

    return { environment, flags };
  }

  async isFeatureEnabled(
    environmentName: string,
    key: string,
  ): Promise<{
    environment: { id: number; name: string };
    feature: { id: number; key: string; description: string | null };
    enabled: boolean;
  } | null> {
    const environment =
      await this.environmentRepository.findByName(environmentName);
    if (!environment) return null;

    const feature = await this.featureRepository.findByKey(key);
    if (!feature) return null;

    const value =
      await this.featureValueRepository.findValueByFeatureAndEnvironment(
        feature.id,
        environment.id,
      );

    return {
      environment: { id: environment.id, name: environment.name },
      feature: {
        id: feature.id,
        key: feature.key,
        description: feature.description,
      },
      enabled: value ? Boolean(value) : false,
    };
  }
}
