export const mockPasswordHasher = {
  hash: jest.fn(),
  compare: jest.fn(),
};

export const createMockPasswordHasher = () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
});

