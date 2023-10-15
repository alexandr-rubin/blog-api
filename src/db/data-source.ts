import { DataSource } from "typeorm";
import dotenv from 'dotenv'

dotenv.config()

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    migrations:[__dirname + '/migrations/**/*{.ts,.js}'],
    synchronize: false,
    entities: ['src/**/*.entity{.ts,.js}']
})
