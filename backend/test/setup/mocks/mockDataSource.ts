export const mockDataSource = {
  createQueryBuilder: jest.fn(),
  getRepository: jest.fn(),
  manager: {
    transaction: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  },
};

export const createMockDataSource = () => ({
  createQueryBuilder: jest.fn(),
  getRepository: jest.fn(),
  manager: {
    transaction: jest.fn((callback) => callback(mockDataSource.manager)),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  },
});

