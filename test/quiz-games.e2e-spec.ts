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
import { createOneUser, createUsers } from './testHelpers/createUsers.helper';
import { UserViewModel } from '../src/users/models/view/UserView';
import { loginUsers } from './testHelpers/loginUsers.helper';
import { GamePairViewModel } from '../src/quiz/pair-quiz-game/models/view/GamePair';
import { UserInputModel } from '../src/users/models/input/UserInput';
import { AnswerInputModel } from '../src/quiz/pair-quiz-game/models/input/Answer';
import { createTenQuestions, getCorrectAnswers } from './testHelpers/createQuestions.helper';
import { publishQuestions } from './testHelpers/publishQuestions.helper';
import { incorrectBearerAuthCredentials } from './testHelpers/incorrectCredential';
import { testGameObject } from './testHelpers/testGameObject';
import { GameStatuses } from '../src/helpers/gameStatuses';
import { incorrectAnswer } from './testHelpers/incorrectInputs';
import { AnswerStatuses } from '../src/helpers/answerStatuses';

describe('QuizGames (e2e)', () => {
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

  const testUser: UserInputModel = {
    login: "testuser",
    password: "testuser",
    email: "testuser@mail.com"
  }

  const testAnswer: AnswerInputModel = {
    answer: 'testAnswer'
  }
  
  ///////////////////////////////////
  describe('Access right for game flow', () => {
    describe('DELETE -> "/testing/all-data": should remove all data; status 204; used additional methods: GET => /sa/users, GET => /blogs, GET => /posts, GET => /sa/quiz/questions', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/:id": create new game by user1, get game by user2. Should return error if current user tries to get pair in which not participated; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /pair-game-quiz/pairs/connection;', () => {
      // it('sould create new questions', async function() {
      //   await createTenQuestions(httpServer)
      // })
      // it('sould publish all questions', async function() {
      //   await publishQuestions(httpServer)
      // })
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let users: UserViewModel[]
      it('sould create two users', async function() {
        users = await createUsers(httpServer, 2)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
      let newGame: GamePairViewModel
      it('sould create new game by user1', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        newGame = res.body
      })
      it('get game by user2. Should return error if current user tries to get pair in which not participated; status 403;', async function() {
        await request(httpServer).get('/pair-game-quiz/pairs/' + newGame.id).set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/connection": create new game by user1, connect to game by user2, try to connect by user1, user2. Should return error if current user is already participating in active pair; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /pair-game-quiz/pairs/connection;', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let users: UserViewModel[]
      it('sould create two users', async function() {
        users = await createUsers(httpServer, 2)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('connect to the game by user2', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
      })
      it('try to connect by user1. Should return error if current user is already participating in active pair; status 403;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.FORBIDDEN_403)
      })
      it('try to connect by user2. Should return error if current user is already participating in active pair; status 403;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/connection": create new game by user1, try to connect by user1. Should return error if current user is already participating in active pair; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /pair-game-quiz/pairs/connection;', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let user: UserViewModel
      it('sould create user', async function() {
        user = await createOneUser(httpServer, testUser)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, [user]) 
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('try to connect by user1. Should return error if current user is already participating in active pair; status 403;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/my-current/answers": create new game by user1, connect by user2, try to add answer by user3. Should return error if current user is not inside active pair; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let users: UserViewModel[]
      it('sould create three users', async function() {
        users = await createUsers(httpServer, 2)
        users.push(await createOneUser(httpServer, testUser))
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('connect to the game by user2', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
      })
      it('try to add answer by user3. Should return error if current user is not inside active pair; status 403;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(testAnswer).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/my-current/answers": create new game by user1, try to add answer by user1. Should return error if current user is not inside active pair; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /sa/quiz/questions, PUT -> /sa/quiz/questions/:questionId/publish, POST -> /pair-game-quiz/pairs/connection;', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let user: UserViewModel
      it('sould create user', async function() {
        user = await createOneUser(httpServer, testUser)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, [user]) 
      })
      it('sould create ten new questions', async function() {
        await createTenQuestions(httpServer)
      })
      it('sould publish all questions', async function() {
        await publishQuestions(httpServer)
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('try to add answer by user1. Should return error if current user is not inside active pair; status 403;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(testAnswer).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/my-current/answers": create new game by user1, connect to game by user2, add 6 answers by user1. Should return error if current user has already answered to all questions; status 403; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /sa/quiz/questions, PUT -> /sa/quiz/questions/:questionId/publish, POST -> /pair-game-quiz/pairs/connection, POST -> /pair-game-quiz/pairs/my-current/answers;', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let users: UserViewModel[]
      it('sould create two users', async function() {
        users = await createUsers(httpServer, 2)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
      it('sould create ten new questions', async function() {
        await createTenQuestions(httpServer)
      })
      it('sould publish all questions', async function() {
        await publishQuestions(httpServer)
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('connect to the game by user2', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
      })
      it('add 6 answers by user1. Should return error if current user has already answered to all questions; status 403;', async function() {
        for(let i = 0; i < 5; i++) {
          await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(testAnswer).expect(HttpStatusCode.OK_200)
        }
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(testAnswer).expect(HttpStatusCode.FORBIDDEN_403)
      })
    })

    describe('GET -> "/pair-game-quiz/pairs/my-current": create new game by user1, connect to game by user2, add all answers by users. Should return error if no active pair for current user; status 404; used additional methods: DELETE -> /testing/all-data, POST -> /sa/users, POST -> /auth/login, POST -> /pair-game-quiz/pairs/connection, POST -> /sa/quiz/questions, PUT -> /sa/quiz/questions/:questionId/publish, POST -> /pair-game-quiz/pairs/my-current/answers;', () => {
      it('Delete all data', async function() {
        await removeAllData(httpServer, basicAuthCredentials)
      })
      let users: UserViewModel[]
      it('sould create two users', async function() {
        users = await createUsers(httpServer, 2)
      })
      let accessTokens: string[]
      it('sould login users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
      it('sould create ten new questions', async function() {
        await createTenQuestions(httpServer)
      })
      it('sould publish all questions', async function() {
        await publishQuestions(httpServer)
      })
      it('sould create new game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('connect to the game by user2', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
      })
      it('add 5 answers by user1.', async function() {
        for(let i = 0; i < 5; i++) {
          await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(testAnswer).expect(HttpStatusCode.OK_200)
        }
      })
      it('add 5 answers by user2.', async function() {
        for(let i = 0; i < 5; i++) {
          await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(testAnswer).expect(HttpStatusCode.OK_200)
        }
      })
      it('Should return error if no active pair for current user; status 404;', async function() {
        await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.NOT_FOUND_404)
        await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.NOT_FOUND_404)
      })
    })
  })

  describe('Exceptions for game flow', () => {
    it('DELETE -> "/testing/all-data": should remove all data; status 204;', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })
    let user: UserViewModel
      it('POST -> "/sa/users": should create new user; status 201; content: created user;', async function() {
      user = await createOneUser(httpServer, testUser)
    })
    let accessTokens: string[]
    it(`POST -> "/auth/login": should sign in user; status 200; content: JWT 'access' token, JWT 'refresh' token in cookie (http only, secure);`, async function() {
      accessTokens = await loginUsers(httpServer, [user]) 
    })

    describe('POST -> "/sa/quiz/questions", PUT -> "/sa/quiz/questions/:questionId/publish": should create and publish several questions; status 201; content: created question;', () => {
      it('sould create ten new questions', async function() {
        await createTenQuestions(httpServer)
      })
      it('sould publish all questions', async function() {
        await publishQuestions(httpServer)
      })
    })
    it('GET -> "/pair-game-quiz/pairs/my-current": should return error if there is no active pair for current user; status 404;', async function() {
      await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.NOT_FOUND_404)
    })

    describe('GET -> "/pair-game-quiz/pairs/my-current", GET -> "pair-game-quiz/pairs/:id", POST -> "pair-game-quiz/pairs/connection", POST -> "pair-game-quiz/pairs/my-current/answers": should return error if auth credentials is incorrect; status 404; used additional methods: POST -> /pair-game-quiz/pairs/connection;', () => {
      it('GET -> "/pair-game-quiz/pairs/my-current"', async function() {
        await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', incorrectBearerAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
      })
      it('GET -> "pair-game-quiz/pairs/:id"', async function() {
        await request(httpServer).get('/pair-game-quiz/pairs/id').set('Authorization', incorrectBearerAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
      })
      it('POST -> "pair-game-quiz/pairs/connection"', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', incorrectBearerAuthCredentials).expect(HttpStatusCode.UNAUTHORIZED_401)
      })
      it('POST -> "pair-game-quiz/pairs/my-current/answers"', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', incorrectBearerAuthCredentials).send(testAnswer).expect(HttpStatusCode.UNAUTHORIZED_401)
      })
    })
    it('GET -> "/pair-game-quiz/pairs": should return error if id has invalid format; status 400;', async function() {
      await request(httpServer).get('/pair-game-quiz/pairs/invalidIdFormat').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.BAD_REQUEST_400)
    })
  })

  describe('Create, connect games, add answers', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })

    let users: UserViewModel[]
    let accessTokens: string[]
    describe('POST -> "/sa/users", "/auth/login": should create and login 6 users; status 201; content: created users;', () => {
      it('Should create 6 users', async function() {
        users = await createUsers(httpServer, 6)
      })
      it('Should login 6 users', async function() {
        accessTokens = await loginUsers(httpServer, users) 
      })
    })

    describe('POST -> "/sa/quiz/questions", PUT -> "/sa/quiz/questions/:questionId/publish": should create and publish several questions; status 201; content: created question;', () => {
      it('sould create ten new questions', async function() {
        await createTenQuestions(httpServer)
      })
      it('sould publish all questions', async function() {
        await publishQuestions(httpServer)
      })
    })

    // TODO: Fix toStrictEqual validation, fix testGameObject. every prop to equal
    let firstGameId: string
    describe('POST -> "/pair-game-quiz/pairs/connection", GET -> "/pair-game-quiz/pairs/:id", GET -> "/pair-game-quiz/pairs/my-current": create new active game by user1, then get the game by user1, then call "/pair-game-quiz/pairs/my-current" by user1. Should return new created active game; status 200;', () => {
      it('create new active game by user1', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        expect(res.body).toStrictEqual(testGameObject(res.body))
        firstGameId = res.body.id
      })
      it(' get the game by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + firstGameId).set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        expect(res.body).toStrictEqual(testGameObject(res.body))
      })
      it('call "/pair-game-quiz/pairs/my-current" by user1.', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        expect(res.body).toStrictEqual(testGameObject(res.body))
      })
    })

    describe('POST -> "/pair-game-quiz/pairs/connection", GET -> "/pair-game-quiz/pairs/:id", GET -> "/pair-game-quiz/pairs/my-current": connect to existing game by user2; then get the game by user1, user2; then call "/pair-game-quiz/pairs/my-current" by user1, user2. Should return started game; status 200;', () => {
      it('connect to existing game by user2', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
      })
      // можно вынести отдельно
      let user1Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        user1Game = res.body
      })
      let user2Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user2', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
        user2Game = res.body
      })
      it('user1Game should be equal user2Game', async function() {
        expect(user1Game).toStrictEqual(user2Game)
      })
      it('game status should be "Active"', async function() {
        expect(user1Game.status).toEqual(GameStatuses.Active)
      })
    })

    let answers
    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": add answers to first game, created by user1, connected by user2: add correct answer by firstPlayer; add incorrect answer by secondPlayer; add correct answer by secondPlayer; get active game and call "/pair-game-quiz/pairs/my-current by both users"; status 200;', () => {
      it('all "/pair-game-quiz/pairs/my-current" by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        answers = getCorrectAnswers(res.body.questions)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(answers[0]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(answers[1]).expect(HttpStatusCode.OK_200)
      })
      // можно вынести отдельно
      let user1Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        user1Game = res.body
      })
      let user2Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user2', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
        user2Game = res.body
      })
      it('user1Game should be equal user2Game', async function() {
        expect(user1Game).toStrictEqual(user2Game)
      })
      it('answers count should be 2 fo second and 1 for first players. first have 1 correct answer, second have 1 incorrect and 1 correct', async function() {
        expect(user1Game.firstPlayerProgress.answers.length).toEqual(1)
        expect(user1Game.secondPlayerProgress.answers.length).toEqual(2)
        expect(user1Game.firstPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.secondPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Incorrect)
        expect(user1Game.secondPlayerProgress.answers[1].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.status).toEqual(GameStatuses.Active)
      })
    })

    let secondGameId: string
    let secondGameAnswers
    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create second game by user3, connect to the game by user4, then: add correct answer by firstPlayer; add incorrect answer by secondPlayer; add correct answer by secondPlayer; get active game; status 200;', () => {
      it(' create second game by user3', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[2]).expect(HttpStatusCode.OK_200)
        secondGameAnswers = getCorrectAnswers(res.body.questions)
        secondGameId = res.body.id
      })
      it('connect to the game by user4', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[3]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(secondGameAnswers[0]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[3]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[3]).send(secondGameAnswers[1]).expect(HttpStatusCode.OK_200)
      })
      let user1Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[2]).expect(HttpStatusCode.OK_200)
        user1Game = res.body
      })
      let user2Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user2', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[3]).expect(HttpStatusCode.OK_200)
        user2Game = res.body
      })
      it('user1Game should be equal user2Game', async function() {
        expect(user1Game).toStrictEqual(user2Game)
      })
      it('answers count should be 2 fo second and 1 for first players. first have 1 correct answer, second have 1 incorrect and 1 correct', async function() {
        expect(user1Game.firstPlayerProgress.answers.length).toEqual(1)
        expect(user1Game.secondPlayerProgress.answers.length).toEqual(2)
        expect(user1Game.firstPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.secondPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Incorrect)
        expect(user1Game.secondPlayerProgress.answers[1].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.status).toEqual(GameStatuses.Active)
      })
    })

    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": add answers to first game, created by user1, connected by user2: add correct answer by firstPlayer; add correct answer by firstPlayer; add correct answer by secondPlayer; add correct answer by secondPlayer; add incorrect answer by firstPlayer; add correct answer by firstPlayer; add correct answer by secondPlayer; firstPlayer should win with 5 scores; get active game. status 200;', () => {
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(answers[1]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(answers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(answers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(answers[3]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(answers[4]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(answers[4]).expect(HttpStatusCode.OK_200)
      })
      let game: GamePairViewModel
      it('get "/pair-game-quiz/pairs/:id"', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + firstGameId).set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        game = res.body
      })
      it('firstPlayer should win with 5 scores; second player score should be equal to 4. finishGameDate should be a strin. status shoulb be "Finished"', async function() {
        expect(game.firstPlayerProgress.score).toEqual(5)
        expect(game.secondPlayerProgress.score).toEqual(4)
        expect(game.status).toEqual(GameStatuses.Finished)
        expect(game.finishGameDate).toEqual(expect.any(String))
      })
    })

    let thirdGameId: string
    let thirdGameAnswers
    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create third game by user2, connect to the game by user1, then: add correct answer by firstPlayer; add incorrect answer by secondPlayer; add correct answer by secondPlayer; get active game"; status 200;', () => {
      it('create third game by user2', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
        thirdGameAnswers = getCorrectAnswers(res.body.questions)
        thirdGameId = res.body.id
      })
      it('connect to the game by user1', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(thirdGameAnswers[0]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(thirdGameAnswers[1]).expect(HttpStatusCode.OK_200)
      })
      let user1Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user1', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        user1Game = res.body
      })
      let user2Game: GamePairViewModel
      it('all "/pair-game-quiz/pairs/my-current" by user2', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/my-current').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
        user2Game = res.body
      })
      it('user1Game should be equal user2Game', async function() {
        expect(user1Game).toStrictEqual(user2Game)
      })
      it('answers count should be 2 fo second and 1 for first players. first have 1 correct answer, second have 1 incorrect and 1 correct', async function() {
        expect(user1Game.firstPlayerProgress.answers.length).toEqual(1)
        expect(user1Game.secondPlayerProgress.answers.length).toEqual(2)
        expect(user1Game.firstPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.secondPlayerProgress.answers[0].answerStatus).toEqual(AnswerStatuses.Incorrect)
        expect(user1Game.secondPlayerProgress.answers[1].answerStatus).toEqual(AnswerStatuses.Correct)
        expect(user1Game.status).toEqual(GameStatuses.Active)
      })
    })

    let fourthGameId: string
    let fourthGameAnswers
    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create 4th game by user5, connect to the game by user6, then: add correct answer by firstPlayer; add incorrect answer by firstPlayer; add correct answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add correct answer by firstPlayer; add incorrect answer by firstPlayer; add incorrect answer by firstPlayer; draw with 2 scores; get active game and call "/pair-game-quiz/pairs/my-current by both users after each answer"; status 200;', () => {
      it('create 4th game by user5', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[4]).expect(HttpStatusCode.OK_200)
        fourthGameAnswers = getCorrectAnswers(res.body.questions)
        fourthGameId = res.body.id
      })
      it('connect to the game by user6', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[5]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[4]).send(fourthGameAnswers[0]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[4]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[5]).send(fourthGameAnswers[0]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[5]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[5]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[5]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[5]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[4]).send(fourthGameAnswers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[4]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[4]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      let game: GamePairViewModel
      it('get "/pair-game-quiz/pairs/:id"', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + fourthGameId).set('Authorization', 'Bearer ' + accessTokens[4]).expect(HttpStatusCode.OK_200)
        game = res.body
      })
      it('draw with 2 scores; finishGameDate should be a strin. status shoulb be "Finished"', async function() {
        expect(game.firstPlayerProgress.score).toEqual(2)
        expect(game.secondPlayerProgress.score).toEqual(2)
        expect(game.status).toEqual(GameStatuses.Finished)
        expect(game.finishGameDate).toEqual(expect.any(String))
      })
    })

    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": add answers to second game, created by user3, connected by user4: add incorrect answer by firstPlayer; add incorrect answer by firstPlayer; add correct answer by secondPlayer; add correct answer by secondPlayer; add incorrect answer by secondPlayer; add correct answer by firstPlayer; add incorrect answer by firstPlayer; secondPlayer should win with 4 scores; get active game and call "/pair-game-quiz/pairs/my-current by both users after each answer"; status 200;', () => {
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[3]).send(secondGameAnswers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[3]).send(secondGameAnswers[3]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[3]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(secondGameAnswers[3]).expect(HttpStatusCode.OK_200)
      })
      it('add incorrect answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[2]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      let game: GamePairViewModel
      it('get "/pair-game-quiz/pairs/:id"', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + secondGameId).set('Authorization', 'Bearer ' + accessTokens[2]).expect(HttpStatusCode.OK_200)
        game = res.body
      })
      it('secondPlayer should win with 4 scores. finishGameDate should be a strin. status shoulb be "Finished"', async function() {
        expect(game.firstPlayerProgress.score).toEqual(2)
        expect(game.secondPlayerProgress.score).toEqual(4)
        expect(game.status).toEqual(GameStatuses.Finished)
        expect(game.finishGameDate).toEqual(expect.any(String))
      })
    })

    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": add answers to third game, created by user2, connected by user1: add correct answer by firstPlayer; add correct answer by firstPlayer; add correct answer by secondPlayer; add correct answer by secondPlayer; add incorrect answer by firstPlayer; add correct answer by firstPlayer; add correct answer by secondPlayer; firstPlayer should win with 5 scores; get active game and call "/pair-game-quiz/pairs/my-current by both users after each answer"; status 200;', () => {
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(thirdGameAnswers[1]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(thirdGameAnswers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(thirdGameAnswers[2]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(thirdGameAnswers[3]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by firstPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(thirdGameAnswers[4]).expect(HttpStatusCode.OK_200)
      })
      it('add correct answer by secondPlayer;', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(thirdGameAnswers[4]).expect(HttpStatusCode.OK_200)
      })
      let game: GamePairViewModel
      it('get "/pair-game-quiz/pairs/:id"', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + thirdGameId).set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        game = res.body
      })
      it('forstPlayer should win with 5 scores. finishGameDate should be a strin. status shoulb be "Finished"', async function() {
        expect(game.firstPlayerProgress.score).toEqual(5)
        expect(game.secondPlayerProgress.score).toEqual(4)
        expect(game.status).toEqual(GameStatuses.Finished)
        expect(game.finishGameDate).toEqual(expect.any(String))
      })
    })
  })
})
