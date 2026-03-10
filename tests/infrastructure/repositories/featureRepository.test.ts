import { FeatureRepository } from "../../../src/infrastructure/repositories/featureRepository";
import { mockFeatures } from "../../setup";

jest.mock("../../../src/db", () => ({
  __esModule: true,
  default: jest.fn(async () => mockDb),
}));

const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  exec: jest.fn(),
};

describe("FeatureRepository", () => {
  let featureRepository: FeatureRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    featureRepository = new FeatureRepository();
  });

  describe("listAll", () => {
    it("should return all features", async () => {
      mockDb.all.mockResolvedValue([
        mockFeatures.betaFeature,
        mockFeatures.darkMode,
      ]);

      const result = await featureRepository.listAll();

      expect(mockDb.all).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockFeatures.betaFeature, mockFeatures.darkMode]);
    });

    it("should return empty array when no features exist", async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await featureRepository.listAll();

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create a feature with description and spaceId", async () => {
      mockDb.run.mockResolvedValue({ lastID: 1 });
      mockDb.get.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureRepository.create(
        "BETA_FEATURE",
        "Beta feature for testing",
        1,
      );

      expect(mockDb.run).toHaveBeenCalled();
      expect(mockDb.get).toHaveBeenCalled();
      expect(result).toEqual(mockFeatures.betaFeature);
    });

    it("should create a feature with spaceId and no description", async () => {
      mockDb.run.mockResolvedValue({ lastID: 1 });
      mockDb.get.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureRepository.create(
        "BETA_FEATURE",
        undefined,
        1,
      );

      expect(mockDb.run).toHaveBeenCalled();
      const call = (mockDb.run as jest.Mock).mock.calls[0];
      expect(call[2]).toBeNull(); // description should be null
    });

    it("should throw error when spaceId is not provided", async () => {
      await expect(
        featureRepository.create("BETA_FEATURE", "Beta feature", undefined),
      ).rejects.toThrow(
        "spaceId is required - all features must belong to a space",
      );
    });
  });

  describe("findById", () => {
    it("should find feature by id", async () => {
      mockDb.get.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureRepository.findById(1);

      expect(mockDb.get).toHaveBeenCalled();
      expect(result).toEqual(mockFeatures.betaFeature);
    });

    it("should return undefined if feature not found", async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await featureRepository.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe("findByKey", () => {
    it("should find feature by key", async () => {
      mockDb.get.mockResolvedValue(mockFeatures.betaFeature);

      const result = await featureRepository.findByKey("BETA_FEATURE");

      expect(mockDb.get).toHaveBeenCalled();
      expect(result).toEqual(mockFeatures.betaFeature);
    });
  });

  describe("deleteById", () => {
    it("should delete feature and return true", async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const result = await featureRepository.deleteById(1);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if feature not found", async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const result = await featureRepository.deleteById(999);

      expect(result).toBe(false);
    });
  });

  describe("deleteByIds", () => {
    it("should delete multiple features", async () => {
      await featureRepository.deleteByIds([1, 2, 3]);

      expect(mockDb.run).toHaveBeenCalled();
      const sql = (mockDb.run as jest.Mock).mock.calls[0][0];
      expect(sql).toContain("DELETE FROM features WHERE id IN");
    });

    it("should not call database if no ids provided", async () => {
      await featureRepository.deleteByIds([]);

      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe("deleteAll", () => {
    it("should delete all features", async () => {
      await featureRepository.deleteAll();

      expect(mockDb.run).toHaveBeenCalledWith("DELETE FROM features");
    });
  });
});
