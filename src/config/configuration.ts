export const getConfiguration = () => ({
  // nado || ?
  port: parseInt(process.env.PORT, 10) ?? 3000,
  db: {
    mongo: {
      mongodb_uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/testDB',
    },
    postgres: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
  },
  jwt_secret_key: process.env.JWT_SECRET_KEY ?? 'SECRETKEY'
})

type ConfigurationType = ReturnType<typeof getConfiguration>
export type ConfigType = ConfigurationType & {
  PORT: number
  MONGODB_URI: string
  JWT_SECRET_KEY: string
  DB_HOST: string
  DB_PORT: number
  DB_USERNAME: string
  DB_PASSWORD: string
  DB_NAME: string
}
