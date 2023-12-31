export const getTestConfiguration = () => ({
    db: {
      mongo: {
        mongodb_uri: 'mongodb://127.0.0.1:27017/testDB',
      },
      postgres: {
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'admin',
        database: 'blogapi',
      },
    },
    jwt_secret_key: process.env.JWT_SECRET_KEY ?? 'SECRETKEY',
    basic_auth_credentials: process.env.BASIC_AUTH_CREDENTIALS ?? 'BASIC_AUTH_CREDENTIALS',
    mail_password: process.env.MAIL_PASS
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
    BASIC_AUTH_CREDENTIALS: string
    MAIL_PASS: string
  };