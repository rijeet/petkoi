export const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
  flush: jest.fn(),
};

export const createMockCache = () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  flush: jest.fn().mockResolvedValue('OK'),
});

