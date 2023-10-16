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
import { createOneQuestion, createTenQuestions } from './testHelpers/createQuestions.helper';
import { sortQuestions } from './testHelpers/sortQuestions';
import { incorrectInputsForPublish, incorrectInputsForUpdateAndPost } from './testHelpers/incorrectInputs';

describe('QuizQuestions (e2e)', () => {
  let app: INestApplication;
  let httpServer
  let dataSource: DataSource
  let basicAuthCredentials

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

  ////////////////////////////
  // move to separate file
  
  const uuidTestingSample = '47edeb47-f641-4717-aa95-5dc09145562c'

  const questionsInput =
  {
    "body": "updated, test question body, test question body, test question body",
    "correctAnswers": ["test", "question", "body"],
  }
  const updateQuestionsInput =
  {
    "body": "updated, updated, updated, updated",
    "correctAnswers": ["updated", "updated", "updated"],
  }
  
  const publishStatusTrue =
  {
    published: true
  }

  const incorrectBasicAuthCredentials = 'Basic incorrectBasicAuthCredentials'
  
  ///////////////////////////////////
  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts, GET => /sa/quiz/questions', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })
  })

  describe('POST -> "/sa/quiz/questions": should create new question; status 201; content: created question; used additional methods: GET => /sa/quiz/questions;', () => {
    it('sould create new question', async function() {
      await request(httpServer).post('/sa/quiz/questions').set('Authorization', basicAuthCredentials).send(questionsInput).expect(HttpStatusCode.CREATED_201)
    })
    it('sould return questions', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(1)
      expect(questionRes.body.items[0].body).toBe(questionsInput.body)
      expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(questionsInput.correctAnswers))
    })
  })

  describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts, GET => /sa/quiz/questions', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })
  })

  describe('GET -> "/sa/quiz/questions": should return status 200; content: questions array with pagination; used additional methods: POST -> /sa/quiz/questions', () => {
    it('sould return questions', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(0)
    })
    it('sould create ten new questions', async function() {
      await createTenQuestions(httpServer)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?bodySearchTerm=lorem').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(1)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?publishedStatus=false').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(10)
    })
    it('sould return questions with pagination', async function() {
      const questionRes = await request(httpServer).get('/sa/quiz/questions?pageSize=5&sortBy=body&sortDirection=desc').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(5)
      expect(questionRes.body.pagesCount).toBe(2)
      expect(questionRes.body.totalCount).toBe(10)
      expect(questionRes.body.pageSize).toBe(5)
      const sortedQuestions = sortQuestions(questionRes.body.items, 'body', 'desc')
      expect(questionRes.body.items).toEqual(sortedQuestions)
    })
  })

  describe('PUT -> "/sa/quiz/questions/:id": should update quiz question; status 204; used additional method: POST -> /sa/quiz/questions, GET -> /sa/quiz/questions;', () => {
    // it('sould return question', async function() {
    //   const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
    //   expect(questionRes.body.items.length).toBe(1)
    //   expect(questionRes.body.items[0].body).toBe(questionsInput.body)
    //   expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(questionsInput.correctAnswers))
    //   id = questionRes.body.items[0].id
    // })
    let id: string
    it('sould update question', async function() {
      id = (await createOneQuestion(httpServer, questionsInput)).id
      await request(httpServer).put('/sa/quiz/questions/' + id).set('Authorization', basicAuthCredentials).send(updateQuestionsInput).expect(HttpStatusCode.NO_CONTENT_204)
    })
    it('sould return updated question', async function() {
      const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${updateQuestionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(1)
      expect(questionRes.body.items[0].body).toBe(updateQuestionsInput.body)
      expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(updateQuestionsInput.correctAnswers))
      expect(questionRes.body.items[0].id).toBe(id)
    })
  })

  describe('DELETE -> "/sa/quiz/questions/:id": should delete question by id; status 204; used additional methods: POST -> /sa/quiz/questions, GET -> /sa/quiz/questions;', () => {
    // it('sould return question', async function() {
    //   const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
    //   expect(questionRes.body.items.length).toBe(1)
    //   expect(questionRes.body.items[0].body).toBe(questionsInput.body)
    //   expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(questionsInput.correctAnswers))
    //   id = questionRes.body.items[0].id
    // })
    it('sould delete question', async function() {
      const id = (await createOneQuestion(httpServer, questionsInput)).id
      await request(httpServer).delete('/sa/quiz/questions/' + id).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.NO_CONTENT_204)
    })
    it('sould not return deleted question', async function() {
      const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      expect(questionRes.body.items.length).toBe(0)
    })
  })

  describe('PUT -> "/sa/quiz/questions/:id/publish": should update publish status of quiz question; status 204; used additional methods: POST -> /sa/quiz/questions, GET -> /sa/quiz/questions;', () => {
    // it('sould return question', async function() {
    //   const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
    //   expect(questionRes.body.items.length).toBe(1)
    //   expect(questionRes.body.items[0].body).toBe(questionsInput.body)
    //   expect(questionRes.body.items[0].published).toBe(false)
    //   expect(questionRes.body.items[0].correctAnswers).toEqual(expect.arrayContaining(questionsInput.correctAnswers))
    //   id = questionRes.body.items[0].id
    // })
    it('sould update question publish status', async function() {
      const id = (await createOneQuestion(httpServer, questionsInput)).id
      await request(httpServer).put('/sa/quiz/questions/' + id + '/publish').set('Authorization', basicAuthCredentials).send(publishStatusTrue).expect(HttpStatusCode.NO_CONTENT_204)
    })
    it('sould return updated question', async function() {
      const questionRes = await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
      //expect(questionRes.body.items.length).toBe(1)
      expect(questionRes.body.items[0].published).toBe(true)
    })
  })

  describe('GET, POST, PUT, DELETE -> "/sa/quiz/questions": should return error if auth credentials is incorrect; status 401;', () => {
    it('POST should return error if auth credentials is incorrect; status 401;', async function() {
      await request(httpServer).post('/sa/quiz/questions').set('Authorization', incorrectBasicAuthCredentials).send(questionsInput).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('GET should return error if auth credentials is incorrect; status 401;', async function() {
      await request(httpServer).get(`/sa/quiz/questions?bodySearchTerm=${questionsInput.body}`).set('Authorization', incorrectBasicAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('PUT question publish status should return error if auth credentials is incorrect; status 401;', async function() {
      await request(httpServer).put('/sa/quiz/questions/id/publish').set('Authorization', incorrectBasicAuthCredentials).send(publishStatusTrue).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('PUT question should return error if auth credentials is incorrect; status 401;', async function() {
      await request(httpServer).put('/sa/quiz/questions/id').set('Authorization', incorrectBasicAuthCredentials).send(updateQuestionsInput).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
    it('DELETE question should return error if auth credentials is incorrect; status 401;', async function() {
      await request(httpServer).delete('/sa/quiz/questions/id').set('Authorization', incorrectBasicAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
    })
  })

  describe('PUT, DELETE -> "/sa/quiz/questions/:id": should return error if :id from uri param not found; status 404;', () => {
    it('PUT question publish status should return error if :id from uri param not found; status 404;', async function() {
      await request(httpServer).put('/sa/quiz/questions/' + uuidTestingSample + '/publish').set('Authorization', basicAuthCredentials).send(publishStatusTrue).expect(HttpStatusCode.NOT_FOUND_404)
    })
    it('PUT question should return error if :id from uri param not found; status 404;', async function() {
      await request(httpServer).put('/sa/quiz/questions/' + uuidTestingSample).set('Authorization', basicAuthCredentials).send(updateQuestionsInput).expect(HttpStatusCode.NOT_FOUND_404)
    })
    it('DELETE question should return error if :id from uri param not found; status 404;', async function() {
      await request(httpServer).delete('/sa/quiz/questions/' + uuidTestingSample).set('Authorization', basicAuthCredentials).expect(HttpStatusCode.NOT_FOUND_404)
    })
  })

  describe('POST -> "/sa/quiz/questions": should return error if passed body is incorrect; status 400;', () => {
    it('POST should return error if body is incorrect; status 401;', async function() {
      for (const key of Object.keys(incorrectInputsForUpdateAndPost)) {
        const input = incorrectInputsForUpdateAndPost[key]
        await request(httpServer)
            .post('/sa/quiz/questions')
            .set('Authorization', basicAuthCredentials)
            .send(input)
            .expect(HttpStatusCode.BAD_REQUEST_400)
      }
    })
  })

  describe('PUT -> "/sa/quiz/questions/:id": should return error if passed body is incorrect; status 400;', () => {
    it('PUT should return error if body is incorrect; status 401;', async function() {
      const id = (await createOneQuestion(httpServer, questionsInput)).id
      for (const key of Object.keys(incorrectInputsForUpdateAndPost)) {
        const input = incorrectInputsForUpdateAndPost[key]
        await request(httpServer)
            .put('/sa/quiz/questions/' + id)
            .set('Authorization', basicAuthCredentials)
            .send(input)
            .expect(HttpStatusCode.BAD_REQUEST_400)
      }
    })
  })

  describe('PUT -> "/sa/quiz/questions/:id/publish": should return error if passed body is incorrect; status 400; used additional method: POST -> /sa/quiz/questions;', () => {
    it('PUT should return error if body is incorrect; status 401;', async function() {
      // for (const key of Object.keys(incorrectInputsForPublish)) {
      //   const input = incorrectInputsForPublish[key]
      //   await request(httpServer)
      //       .put('/sa/quiz/questions/'+id+'/publish')
      //       .set('Authorization', basicAuthCredentials)
      //       .send(input)
      //       .expect(HttpStatusCode.BAD_REQUEST_400)
      // }
      
      const id = (await createOneQuestion(httpServer, questionsInput)).id
      await request(httpServer).put('/sa/quiz/questions/' + id + '/publish').set('Authorization', basicAuthCredentials).send(incorrectInputsForPublish.incorrectPublishStatus).expect(HttpStatusCode.BAD_REQUEST_400)
    })
  })
})
