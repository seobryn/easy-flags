import { EnvironmentService } from "../../../src/application/services/environmentService";
import {
  createMockEnvironmentRepository,
  createMockFeatureRepository,
  createMockFeatureValueRepository,
  mockEnvironments,
} from "../../setup";

// Mock the database
jest.mock("../../../src/db", () => ({
  __esModule: true,
  default: jest.fn(async () => ({
    exec: jest.fn(),
  })),
}));

describe("EnvironmentService", () => {
  let environmentService: EnvironmentService;
  let mockEnvironmentRepository: ReturnType<
    typeof createMockEnvironmentRepository
  >;
  let mockFeatureRepository: ReturnType<typeof createMockFeatureRepository>;
  let mockFeatureValueRepository: ReturnType<
    typeof createMockFeatureValueRepository
  >;

  beforeEach(() => {
    mockEnvironmentRepository = createMockEnvironmentRepository();
    mockFeatureRepository = createMockFeatureRepository();
    mockFeatureValueRepository = createMockFeatureValueRepository();
    environmentService = new EnvironmentService(
      mockEnvironmentRepository,
      mockFeatureRepository,
      mockFeatureValueRepository,
    );
  });

  describe("listEnvironments", () => {
    it("should return all environments", async () => {
      const environments = Object.values(mockEnvironments);
      mockEnvironmentRepository.listAll.mockResolvedValue(environments);

      const result = await environmentService.listEnvironments();

      expect(mockEnvironmentRepository.listAll).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result).toEqual(environments);
    });

    it("should return empty array when no environments exist", async () => {
      mockEnvironmentRepository.listAll.mockResolvedValue([]);

      const result = await environmentService.listEnvironments();

      expect(result).toEqual([]);
    });
  });

  describe("createEnvironment", () => {
    it("should create a new environment with spaceId", async () => {
      mockEnvironmentRepository.create.mockResolvedValue(
        mockEnvironments.development,
      );

      const result = await environmentService.createEnvironment(
        "development",
        1,
      );

      expect(mockEnvironmentRepository.create).toHaveBeenCalledWith(
        "development",
        1,
      );
      expect(result).toEqual(mockEnvironments.development);
    });

    it("should throw error when spaceId is not provided", async () => {
      await expect(
        environmentService.createEnvironment("development", 0),
      ).rejects.toThrow(
        "spaceId is required - all environments must belong to a space",
      );
    });
  });

  describe("updateEnvironmentName", () => {
    it("should update environment name", async () => {
      mockEnvironmentRepository.updateName.mockResolvedValue(true);
      mockEnvironmentRepository.findById.mockResolvedValue({
        id: 1,
        name: "dev",
      });

      const result = await environmentService.updateEnvironmentName(1, "dev");

      expect(mockEnvironmentRepository.updateName).toHaveBeenCalledWith(
        1,
        "dev",
      );
      expect(result).toEqual({ id: 1, name: "dev" });
    });

    it("should return null if environment not found during update", async () => {
      mockEnvironmentRepository.updateName.mockResolvedValue(false);

      const result = await environmentService.updateEnvironmentName(
        999,
        "newname",
      );

      expect(result).toBeNull();
    });

    it("should return null if environment not found after update", async () => {
      mockEnvironmentRepository.updateName.mockResolvedValue(true);
      mockEnvironmentRepository.findById.mockResolvedValue(null);

      const result = await environmentService.updateEnvironmentName(
        999,
        "newname",
      );

      expect(result).toBeNull();
    });
  });

  describe("deleteEnvironment", () => {
    it("should delete environment and its feature values", async () => {
      const db = {
        exec: jest.fn(),
      };
      const getDb = require("../../../src/db").default;
      (getDb as jest.Mock).mockResolvedValue(db);

      mockEnvironmentRepository.findById.mockResolvedValue(
        mockEnvironments.development,
      );
      mockFeatureValueRepository.deleteByEnvironmentId.mockResolvedValue(
        undefined,
      );
      mockEnvironmentRepository.deleteById.mockResolvedValue(true);
      mockEnvironmentRepository.countAll.mockResolvedValue(2);

      const result = await environmentService.deleteEnvironment(1);

      expect(mockEnvironmentRepository.findById).toHaveBeenCalledWith(1);
      expect(
        mockFeatureValueRepository.deleteByEnvironmentId,
      ).toHaveBeenCalledWith(1);
      expect(mockEnvironmentRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false if environment not found", async () => {
      mockEnvironmentRepository.findById.mockResolvedValue(null);

      const result = await environmentService.deleteEnvironment(999);

      expect(result).toBe(false);
    });

    it("should cleanup features if no environments remain", async () => {
      const db = {
        exec: jest.fn(),
      };
      const getDb = require("../../../src/db").default;
      (getDb as jest.Mock).mockResolvedValue(db);

      mockEnvironmentRepository.findById.mockResolvedValue(
        mockEnvironments.development,
      );
      mockFeatureValueRepository.deleteByEnvironmentId.mockResolvedValue(
        undefined,
      );
      mockEnvironmentRepository.deleteById.mockResolvedValue(true);
      mockEnvironmentRepository.countAll.mockResolvedValue(0);

      const result = await environmentService.deleteEnvironment(1);

      expect(mockFeatureValueRepository.deleteAll).toHaveBeenCalled();
      expect(mockFeatureRepository.deleteAll).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("findByName", () => {
    it("should find environment by name", async () => {
      mockEnvironmentRepository.findByName.mockResolvedValue(
        mockEnvironments.development,
      );

      const result = await environmentService.findByName("development");

      expect(mockEnvironmentRepository.findByName).toHaveBeenCalledWith(
        "development",
        undefined,
      );
      expect(result).toEqual(mockEnvironments.development);
    });

    it("should return undefined if environment not found", async () => {
      mockEnvironmentRepository.findByName.mockResolvedValue(undefined);

      const result = await environmentService.findByName("nonexistent");

      expect(result).toBeUndefined();
    });
  });
});
