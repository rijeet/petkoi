export const mockMapper = {
  toDto: jest.fn(),
  toEntity: jest.fn(),
  toDtoList: jest.fn(),
  toEntityList: jest.fn(),
};

export const createMockMapper = () => ({
  toDto: jest.fn((entity) => ({ ...entity, mapped: true })),
  toEntity: jest.fn((dto) => ({ ...dto, entity: true })),
  toDtoList: jest.fn((entities) => entities.map((e: any) => ({ ...e, mapped: true }))),
  toEntityList: jest.fn((dtos) => dtos.map((d: any) => ({ ...d, entity: true }))),
});

