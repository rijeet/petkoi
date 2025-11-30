export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  generateToken: jest.fn(),
  validateToken: jest.fn(),
};

export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com', role: 'OWNER' }),
  decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  generateToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  validateToken: jest.fn().mockResolvedValue({ sub: 'user-id', email: 'test@example.com', role: 'OWNER' }),
});

