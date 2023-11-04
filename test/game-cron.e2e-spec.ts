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
import { createUsers } from './testHelpers/createUsers.helper';
import { UserViewModel } from '../src/users/models/view/UserView';
import { loginUsers } from './testHelpers/loginUsers.helper';
import { GamePairViewModel } from '../src/quiz/pair-quiz-game/models/view/GamePair';
import { createTenQuestions, getCorrectAnswers } from './testHelpers/createQuestions.helper';
import { publishQuestions } from './testHelpers/publishQuestions.helper';
import { GameStatuses } from '../src/helpers/gameStatuses';
import { incorrectAnswer } from './testHelpers/incorrectInputs';
import { StatisticViewModel } from '../src/quiz/pair-quiz-game/models/view/Statistic';
import { avgScoreDesc, pageSize3SumScoreDescAvgScoreDesc, removePlayersId } from './testHelpers/usersTopExpectedResults';

describe('QuizGames cron (e2e)', () => {
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
        if(key === '<MAIL_PASS>')
          return getTestConfiguration().mail_password
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

  const user1Statistic: StatisticViewModel = {
    sumScore: 17,
    avgScores: 2.43,
    gamesCount: 7,
    winsCount: 3,
    lossesCount: 3,
    drawsCount: 1
  }
  
  ///////////////////////////////////
  describe('Game staticstic', () => {
    it('Delete all data', async function() {
      await removeAllData(httpServer, basicAuthCredentials)
    })

    let users: UserViewModel[]
    let accessTokens: string[]
    describe('POST -> "/sa/users", "/auth/login": should create and login 6 users; status 201; content: created users;', () => {
      it('Should create 4 users', async function() {
        users = await createUsers(httpServer, 4)
      })
      it('Should login 4 users', async function() {
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

    let firstGameId: string
    let firstGameAnswers
    describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create game by user1, connect to the game by user2, then: add correct answer by firstPlayer; add incorrect answer by firstPlayer; add correct answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add correct answer by firstPlayer; add correct answer by firstPlayer; add incorrect answer by firstPlayer; firstPlayer should win, scores: 3 - 2; ; status 200;', () => {
      it('create first game by user1', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        firstGameId = res.body.id
      })
      it('connect to the game by user2', async function() {
        const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
        firstGameAnswers = getCorrectAnswers(res.body.questions)
      })
      it('answers', async function() {
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(firstGameAnswers[0]).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(firstGameAnswers[0]).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(firstGameAnswers[2]).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(firstGameAnswers[3]).expect(HttpStatusCode.OK_200)
        await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
      }, 10000)

      it('wait 10s', async function() {
        await new Promise(resolve => setTimeout(resolve, 10000))
      }, 20000)
      let game: GamePairViewModel
      it('get "/pair-game-quiz/pairs/:id"', async function() {
        const res = await request(httpServer).get('/pair-game-quiz/pairs/' + firstGameId).set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
        game = res.body
      })
      it('firstPlayer should win, scores: 3 - 2. finishGameDate should be a strin. status shoulb be "Finished"', async function() {
        expect(game.status).toEqual(GameStatuses.Finished)
        expect(game.firstPlayerProgress.score).toEqual(4)
        expect(game.secondPlayerProgress.score).toEqual(1)
        expect(game.finishGameDate).toEqual(expect.any(String))
      })
    })

    // let secondGameId: string
    // let secondGameAnswers
    // describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create game by user1, connect to the game by user2, then: add correct answer by firstPlayer; add incorrect answer by firstPlayer; add correct answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add incorrect answer by secondPlayer; add correct answer by firstPlayer; add correct answer by firstPlayer; add incorrect answer by firstPlayer; firstPlayer should win, scores: 3 - 2; ; status 200;', () => {
    //   it('create first game by user1', async function() {
    //     const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
    //     secondGameId = res.body.id
    //   })
    //   it('connect to the game by user2', async function() {
    //     const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
    //     secondGameAnswers = getCorrectAnswers(res.body.questions)
    //   })
    //   it('answers', async function() {
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(secondGameAnswers[0]).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(secondGameAnswers[0]).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(secondGameAnswers[2]).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(secondGameAnswers[3]).expect(HttpStatusCode.OK_200)
    //     await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
    //   }, 10000)
    //   let game: GamePairViewModel
    //   it('get "/pair-game-quiz/pairs/:id"', async function() {
    //     const res = await request(httpServer).get('/pair-game-quiz/pairs/' + secondGameId).set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
    //     game = res.body
    //   })
    //   it('firstPlayer should win, scores: 3 - 2. finishGameDate should be a strin. status shoulb be "Finished"', async function() {
    //     expect(game.firstPlayerProgress.score).toEqual(3)
    //     expect(game.secondPlayerProgress.score).toEqual(2)
    //     expect(game.status).toEqual(GameStatuses.Finished)
    //     expect(game.finishGameDate).toEqual(expect.any(String))
    //   })
    // })
  })
})

