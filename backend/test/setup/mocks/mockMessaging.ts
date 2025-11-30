export const mockMessaging = {
  send: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

export const createMockMessaging = () => ({
  send: jest.fn().mockResolvedValue({ success: true }),
  publish: jest.fn().mockResolvedValue({ success: true }),
  subscribe: jest.fn().mockResolvedValue({ success: true }),
  unsubscribe: jest.fn().mockResolvedValue({ success: true }),
});

