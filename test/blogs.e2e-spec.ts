import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { appSettings } from '../src/app.settings';
import { HttpStatusCode } from '../src/helpers/httpStatusCode';
import mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { getTestConfiguration } from './config/test.config';
import { removeAllData } from './testHelpers/remove-all-data.helper';
import { DataSource } from 'typeorm';
import { incorrectBasicAuthCredentials } from './testHelpers/incorrectCredential';

describe('Blogs (e2e)', () => {
  let app: INestApplication;
  let httpServer
  let dataSource: DataSource
  let basicAuthCredentials
  // let mongoServer: MongoMemoryServer

  beforeEach(async () => {
    // mongoServer = await MongoMemoryServer.create()
    // const mongoUri = mongoServer.getUri()
    // await mongoose.connect(mongoUri)
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(ConfigService)
    .useValue({
      get: (key: string) => {
        if(key === 'db.mongo.mongodb_uri')
          return getTestConfiguration().db.mongo.mongodb_uri
        if(key === 'db.postgres.host')
          return getTestConfiguration().db.postgres.host
        if(key === 'db.postgres.port')
          return getTestConfiguration().db.postgres.port
        if(key === 'db.postgres.username')
          return getTestConfiguration().db.postgres.username
        if(key === 'db.postgres.password')
          return getTestConfiguration().db.postgres.password
        if(key === 'db.postgres.database')
          return getTestConfiguration().db.postgres.database
        if(key === 'JWT_SECRET_KEY')
          return getTestConfiguration().jwt_secret_key
        if(key === 'BASIC_AUTH_CREDENTIALS')
          return getTestConfiguration().basic_auth_credentials
      },
    })
    .compile();

    basicAuthCredentials = 'Basic ' + btoa(getTestConfiguration().basic_auth_credentials)

    dataSource = moduleFixture.get<DataSource>(DataSource)

    app = moduleFixture.createNestApplication();

    appSettings(app)

    await app.init();

    httpServer = app.getHttpServer()
  });

  afterAll(async() => {
    await dataSource.destroy()
    await mongoose.disconnect()
    await app.close()
    // await mongoServer.stop()
    // how to close sql connection
    
  })

  const user =
    {
      "login": "zxc228",
      "password": "zxc228",
      "email": "zxc@mail.com"
    }

  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })
  })

  describe('POST -> "/sa/users": should create new user; status 201; content: created user; used additional methods: GET => /sa/users;', () => {
    // Add security and comments check
    it('sould create new user', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', basicAuthCredentials).send(user).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return user', async function() {
      const usersRes = await request(httpServer).get('/sa/users').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(usersRes.body.items.length).toBe(1)
    })
  })

  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })
  })

  describe('GET -> "/sa/users": should return status 200; content: users array with pagination; used additional methods: POST -> /sa/users;', () => {
    it('sould create new user', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', basicAuthCredentials).send(user).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return user', async function() {
      const usersRes = await request(httpServer).get('/sa/users').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(usersRes.body.items.length).toBe(1)
    })
  })

  describe('POST, DELETE -> "/sa/users": should return error if auth credentials is incorrect; status 401;', () => {
    it('Post -> should return error if auth credentials is incorrect', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', incorrectBasicAuthCredentials).send(user).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('Delete -> should return error if auth credentials is incorrect', async function() {
      await request(httpServer).delete('/sa/users/id').set('Authorization', incorrectBasicAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
  })
});
