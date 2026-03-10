import { FeatureService } from "../../../src/application/services/featureService";
import {
  createMockFeatureRepository,
  createMockFeatureValueRepository,
  mockFeatures,
  mockFeatureValues,
} from "../../setup";

describe("FeatureService", () => {
  let featureService: FeatureService;
  let mockFeatureRepository: ReturnType<typeof createMockFeatureRepository>;
  let mockFeatureValueRepository: ReturnType<
    typeof createMockFeatureValueRepository
  >;

  beforeEach(() => {
    mockFeatureRepository = createMockFeatureRepository();
    mockFeatureValueRepository = createMockFeatureValueRepository();
    featureService = new FeatureService(
      mockFeatureRepository,
      mockFeatureValueRepository,
    );
  });

  describe("listFeatures", () => {
    it("should return all features", async () => {
      const features = [mockFeatures.betaFeature, mockFeatures.darkMode];
      mockFeatureRepository.listAll.mockResolvedValue(features);

      const result = await featureService.listFeatures();

      expect(mockFeatureRepository.listAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(features);
    });

    it("should return empty array when no features exist", async () => {
      mockFeatureRepository.listAll.mockResolvedValue([]);

      const result = await featureService.listFeatures();

      expect(result).toEqual([]);
    });
  });

  describe("createFeature", () => {
    it("should create a feature with key, description and spaceId", async () => {
      mockFeatureRepository.create.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureService.createFeature(
        "BETA_FEATURE",
        "Beta feature for testing",
        1,
      );

      expect(mockFeatureRepository.create).toHaveBeenCalledWith(
        "BETA_FEATURE",
        "Beta feature for testing",
        1,
      );
      expect(result).toEqual(mockFeatures.betaFeature);
    });

    it("should create a feature with key and spaceId", async () => {
      mockFeatureRepository.create.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureService.createFeature(
        "BETA_FEATURE",
        undefined,
        1,
      );

      expect(mockFeatureRepository.create).toHaveBeenCalledWith(
        "BETA_FEATURE",
        undefined,
        1,
      );
      expect(result).toEqual(mockFeatures.betaFeature);
    });

    it("should throw error when spaceId is not provided", async () => {
      await expect(
        featureService.createFeature("BETA_FEATURE", "Beta feature", undefined),
      ).rejects.toThrow(
        "spaceId is required - all features must belong to a space",
      );
    });
  });

  describe("deleteFeature", () => {
    it("should delete feature and its values", async () => {
      mockFeatureValueRepository.deleteByFeatureId.mockResolvedValue(undefined);
      mockFeatureRepository.deleteById.mockResolvedValue(true);

      const result = await featureService.deleteFeature(1);

      expect(mockFeatureValueRepository.deleteByFeatureId).toHaveBeenCalledWith(
        1,
      );
      expect(mockFeatureRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false if feature deletion fails", async () => {
      mockFeatureValueRepository.deleteByFeatureId.mockResolvedValue(undefined);
      mockFeatureRepository.deleteById.mockResolvedValue(false);

      const result = await featureService.deleteFeature(999);

      expect(mockFeatureValueRepository.deleteByFeatureId).toHaveBeenCalledWith(
        999,
      );
      expect(mockFeatureRepository.deleteById).toHaveBeenCalledWith(999);
      expect(result).toBe(false);
    });
  });

  describe("setFeatureValue", () => {
    it("should set feature value for an environment", async () => {
      mockFeatureValueRepository.upsert.mockResolvedValue(
        mockFeatureValues.betaEnabled,
      );

      const result = await featureService.setFeatureValue(1, 1, true);

      expect(mockFeatureValueRepository.upsert).toHaveBeenCalledWith(
        1,
        1,
        true,
      );
      expect(result).toEqual(mockFeatureValues.betaEnabled);
    });

    it("should handle boolean values", async () => {
      mockFeatureValueRepository.upsert.mockResolvedValue(
        mockFeatureValues.darkModeDisabled,
      );

      const result = await featureService.setFeatureValue(2, 1, false);

      expect(mockFeatureValueRepository.upsert).toHaveBeenCalledWith(
        2,
        1,
        false,
      );
    });
  });

  describe("findByKey", () => {
    it("should find feature by key", async () => {
      mockFeatureRepository.findByKey.mockResolvedValue(
        mockFeatures.betaFeature,
      );

      const result = await featureService.findByKey("BETA_FEATURE");

      expect(mockFeatureRepository.findByKey).toHaveBeenCalledWith(
        "BETA_FEATURE",
        undefined,
      );
      expect(result).toEqual(mockFeatures.betaFeature);
    });

    it("should return undefined if feature not found", async () => {
      mockFeatureRepository.findByKey.mockResolvedValue(undefined);

      const result = await featureService.findByKey("NONEXISTENT");

      expect(result).toBeUndefined();
    });
  });
});
