export const mockSmtp = {
  sendMail: jest.fn(),
  verify: jest.fn(),
  close: jest.fn(),
};

export const createMockSmtp = () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
});

