export const mockAppConfig = {
  port: 3001,
  database: {
    url: 'postgresql://test:test@localhost:5432/test_db',
  },
  jwt: {
    secret: 'test-jwt-secret',
    expiresIn: '1h',
  },
  imagekit: {
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    urlEndpoint: 'https://ik.imagekit.io/test',
  },
  frontend: {
    url: 'http://localhost:3000',
  },
};

