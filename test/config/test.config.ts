export const getTestConfiguration = () => ({
    db: {
      mongo: {
        mongodb_uri: 'mongodb://127.0.0.1:27017/testDB',
      },
      postgres: {
        host: 'localhost',
        port: 5432,
        username: 'admin',
        password: 'admin',
        database: 'incubatorTypeormAuto',
      },
    },
    jwt_secret_key: process.env.JWT_SECRET_KEY ?? 'SECRETKEY'
  });
  
  type TestConfigurationType = ReturnType<typeof getTestConfiguration>;
  
  export type TestConfigType = TestConfigurationType & {
    PORT: number
    MONGODB_URI: string
    JWT_SECRET_KEY: string
    DB_HOST: string
    DB_PORT: number
    DB_USERNAME: string
    DB_PASSWORD: string
    DB_NAME: string
  };