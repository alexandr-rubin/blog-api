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

describe('Blogs (e2e)', () => {
  let app: INestApplication;
  let httpServer
  // let mongoServer: MongoMemoryServer

  beforeEach(async () => {
    // mongoServer = await MongoMemoryServer.create()
    // const mongoUri = mongoServer.getUri()
    // await mongoose.connect(mongoUri)
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(ConfigService) // Переопределение провайдера ConfigService
    .useValue({
      get: () => getTestConfiguration().db.mongo.mongodb_uri, // Использование тестового URI из тестовой конфигурации
    })
    .compile();

    app = moduleFixture.createNestApplication();

    appSettings(app)

    await app.init();

    httpServer = app.getHttpServer()
  });

  afterAll(async() => {
    await app.close()
    await mongoose.disconnect()
    // await mongoServer.stop()
  })

  const user =
    {
      "login": "zxc228",
      "password": "zxc228",
      "email": "zxc@mail.com"
    }
  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer)
    })
    // it('Delete all', async function() {
    //   await request(httpServer).delete('/testing/all-data').expect(HttpStatusCode.NO_CONTENT_204)
    // })
    // // Add security and comments check
    // it('sould return no users', async function() {
    //   //await request(httpServer).post('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(user).expect(HttpStatusCode.CREATED_201)
    //   const usersRes = await request(httpServer).get('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
    //   expect(usersRes.body.items.length).toBe(0)
    // })
    // it('sould return no blogs', async function() {
    //   const blogsRes = await request(httpServer).get('/blogs').expect(HttpStatusCode.OK_200)
    //   expect(blogsRes.body.items.length).toBe(0)
    // })
    // it('sould return no posts', async function() {
    //   const postsRes = await request(httpServer).get('/posts').expect(HttpStatusCode.OK_200)
    //   expect(postsRes.body.items.length).toBe(0)
    // })
  })

  describe('POST -> "/sa/users": should create new user; status 201; content: created user; used additional methods: GET => /sa/users;', () => {
    // Add security and comments check
    it('sould create new user', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(user).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return user', async function() {
      const usersRes = await request(httpServer).get('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(usersRes.body.items.length).toBe(1)
    })
  })

  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer)
    })
  })

  describe('GET -> "/sa/users": should return status 200; content: users array with pagination; used additional methods: POST -> /sa/users;', () => {
    it('sould create new user', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(user).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return user', async function() {
      const usersRes = await request(httpServer).get('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(usersRes.body.items.length).toBe(1)
    })
  })

  describe('POST, DELETE -> "/sa/users": should return error if auth credentials is incorrect; status 401;', () => {
    it('Post -> should return error if auth credentials is incorrect', async function() {
      await request(httpServer).post('/sa/users').set('Authorization', 'incorrect credentials').send(user).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('Delete -> should return error if auth credentials is incorrect', async function() {
      await request(httpServer).delete('/sa/users/id').set('Authorization', 'incorrect credentials').expect(HttpStatusCode.UNAUTHORIZED_401)
    })
  })
});
