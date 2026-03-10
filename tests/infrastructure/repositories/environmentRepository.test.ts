import { EnvironmentRepository } from "../../../src/infrastructure/repositories/environmentRepository";
import { mockEnvironments } from "../../setup";

jest.mock("../../../src/db", () => ({
  __esModule: true,
  default: jest.fn(async () => mockDb),
}));

const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
};

describe("EnvironmentRepository", () => {
  let environmentRepository: EnvironmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    environmentRepository = new EnvironmentRepository();
  });

  describe("listAll", () => {
    it("should return all environments", async () => {
      const environments = Object.values(mockEnvironments);
      mockDb.all.mockResolvedValue(environments);

      const result = await environmentRepository.listAll();

      expect(mockDb.all).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result).toEqual(environments);
    });

    it("should return empty array when no environments exist", async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await environmentRepository.listAll();

      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("should create an environment with spaceId", async () => {
      mockDb.run.mockResolvedValue({ lastID: 1 });
      mockDb.get.mockResolvedValue(mockEnvironments.development);

      const result = await environmentRepository.create("development", 1);

      expect(mockDb.run).toHaveBeenCalled();
      expect(mockDb.get).toHaveBeenCalled();
      expect(result).toEqual(mockEnvironments.development);
    });

    it("should throw error when spaceId is not provided", async () => {
      await expect(
        environmentRepository.create("development", 0),
      ).rejects.toThrow(
        "spaceId is required - all environments must belong to a space",
      );
    });
  });

  describe("findByName", () => {
    it("should find environment by name", async () => {
      mockDb.get.mockResolvedValue(mockEnvironments.development);

      const result = await environmentRepository.findByName("development");

      expect(mockDb.get).toHaveBeenCalled();
      expect(result).toEqual(mockEnvironments.development);
    });

    it("should return undefined if environment not found", async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await environmentRepository.findByName("nonexistent");

      expect(result).toBeUndefined();
    });
  });

  describe("findById", () => {
    it("should find environment by id", async () => {
      mockDb.get.mockResolvedValue(mockEnvironments.development);

      const result = await environmentRepository.findById(1);

      expect(result).toEqual(mockEnvironments.development);
    });

    it("should return undefined if environment not found", async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await environmentRepository.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe("updateName", () => {
    it("should update environment name and return true", async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const result = await environmentRepository.updateName(1, "dev");

      expect(mockDb.run).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if environment not found", async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const result = await environmentRepository.updateName(999, "newname");

      expect(result).toBe(false);
    });
  });

  describe("deleteById", () => {
    it("should delete environment and return true", async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      const result = await environmentRepository.deleteById(1);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if environment not found", async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      const result = await environmentRepository.deleteById(999);

      expect(result).toBe(false);
    });
  });

  describe("countAll", () => {
    it("should return count of all environments", async () => {
      mockDb.get.mockResolvedValue({ count: 3 });

      const result = await environmentRepository.countAll();

      expect(result).toBe(3);
    });
  });
});
