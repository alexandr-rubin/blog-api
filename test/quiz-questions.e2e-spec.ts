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
import { createTenQuestions } from './testHelpers/createQuestions.helper';
import { sortQuestions } from './testHelpers/sortQuestions';

describe('QuizQuestions (e2e)', () => {
  let app: INestApplication;
  let httpServer
  let dataSource: DataSource

  beforeEach(async () => {
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
      },
    })
    .compile();

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

  const questionsInput =
    {
      "body": "question question",
      "correctAnswers": ["ten", "10", "Десять"],
    }
    
  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts, GET => /sa/quiz/questions', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer)
    })
  })

  describe('POST -> "/sa/quiz/questions": should create new question; status 201; content: created question; used additional methods: GET => /sa/quiz/questions;', () => {
    it('sould create new question', async function() {
      await request(httpServer).post('/sa/quiz/questions').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(questionsInput).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return questions', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(1)
      expect(questionRes.body.items[0].body).toBe(questionsInput.body)
      expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(questionsInput.correctAnswers))
    })
  })

  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts, GET => /sa/quiz/questions', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer)
    })
  })

  describe('GET -> "/sa/quiz/questions": should return status 200; content: questions array with pagination; used additional methods: POST -> /sa/quiz/questions', () => {
    it('sould return questions', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(0)
    })
    it('sould create ten new questions', async function() {
      await createTenQuestions(httpServer)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?bodySearchTerm=lorem').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(1)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?publishedStatus=false').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(10)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?pageSize=5&sortBy=body&sortDirection=desc').set('Authorization', 'Basic YWRtaW46cXdlcnR5').expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(5)
      expect(questionRes.body.pagesCount).toBe(2)
      expect(questionRes.body.totalCount).toBe(10)
      expect(questionRes.body.pageSize).toBe(5)
      const sortedQuestions = sortQuestions(questionRes.body.items, 'body', 'desc')
      expect(questionRes.body.items).toEqual(sortedQuestions)
    })
  })
})
