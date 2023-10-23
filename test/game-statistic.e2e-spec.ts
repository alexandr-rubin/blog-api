// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import request from 'supertest';
// import { AppModule } from '../src/app.module';
// import { appSettings } from '../src/app.settings';
// import { HttpStatusCode } from '../src/helpers/httpStatusCode';
// import mongoose from 'mongoose';
// import { ConfigService } from '@nestjs/config';
// import { getTestConfiguration } from './config/test.config';
// import { removeAllData } from './testHelpers/remove-all-data.helper';
// import { DataSource } from 'typeorm';
// import { createOneUser, createUsers } from './testHelpers/createUsers.helper';
// import { UserViewModel } from '../src/users/models/view/UserView';
// import { loginUsers } from './testHelpers/loginUsers.helper';
// import { GamePairViewModel } from '../src/quiz/pair-quiz-game/models/view/GamePair';
// import { UserInputModel } from '../src/users/models/input/UserInput';
// import { AnswerInputModel } from '../src/quiz/pair-quiz-game/models/input/Answer';
// import { createTenQuestions, getCorrectAnswers } from './testHelpers/createQuestions.helper';
// import { publishQuestions } from './testHelpers/publishQuestions.helper';
// import { incorrectBearerAuthCredentials } from './testHelpers/incorrectCredential';
// import { testGameObject } from './testHelpers/testGameObject';
// import { GameStatuses } from '../src/helpers/gameStatuses';
// import { incorrectAnswer } from './testHelpers/incorrectInputs';
// import { AnswerStatuses } from '../src/helpers/answerStatuses';

// describe('QuizGames (e2e)', () => {
//   let app: INestApplication;
//   let httpServer
//   let dataSource: DataSource
//   let basicAuthCredentials

//   beforeEach(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).overrideProvider(ConfigService)
//     .useValue({
//       get: (key: string) => {
//         if(key === 'db.mongo.mongodb_uri')
//           return getTestConfiguration().db.mongo.mongodb_uri
//         if(key === 'db.postgres.host')
//           return getTestConfiguration().db.postgres.host
//         if(key === 'db.postgres.port')
//           return getTestConfiguration().db.postgres.port
//         if(key === 'db.postgres.username')
//           return getTestConfiguration().db.postgres.username
//         if(key === 'db.postgres.password')
//           return getTestConfiguration().db.postgres.password
//         if(key === 'db.postgres.database')
//           return getTestConfiguration().db.postgres.database
//         if(key === 'JWT_SECRET_KEY')
//           return getTestConfiguration().jwt_secret_key
//         if(key === 'BASIC_AUTH_CREDENTIALS')
//           return getTestConfiguration().basic_auth_credentials
//       },
//     })
//     .compile();

//     basicAuthCredentials = 'Basic ' + btoa(getTestConfiguration().basic_auth_credentials)

//     dataSource = moduleFixture.get<DataSource>(DataSource)

//     app = moduleFixture.createNestApplication();

//     appSettings(app)

//     await app.init();

//     httpServer = app.getHttpServer()
//   });

//   afterAll(async() => {
//     await dataSource.destroy()
//     await mongoose.disconnect()
//     await app.close()
//     // await mongoServer.stop()
//     // how to close sql connection
    
//   })

//   ////////////////////////////
//   // move to separate file

//   const testUser: UserInputModel = {
//     login: "testuser",
//     password: "testuser",
//     email: "testuser@mail.com"
//   }

//   const testAnswer: AnswerInputModel = {
//     answer: 'testAnswer'
//   }
  
//   ///////////////////////////////////
//   describe('zxc', () => {
//     it('Delete all data', async function() {
//       await removeAllData(httpServer, basicAuthCredentials)
//     })

//     let users: UserViewModel[]
//     let accessTokens: string[]
//     describe('POST -> "/sa/users", "/auth/login": should create and login 6 users; status 201; content: created users;', () => {
//       it('Should create 2 users', async function() {
//         users = await createUsers(httpServer, 2)
//       })
//       it('Should login 2 users', async function() {
//         accessTokens = await loginUsers(httpServer, users) 
//       })
//     })

//     describe('POST -> "/sa/quiz/questions", PUT -> "/sa/quiz/questions/:questionId/publish": should create and publish several questions; status 201; content: created question;', () => {
//       it('sould create ten new questions', async function() {
//         await createTenQuestions(httpServer)
//       })
//       it('sould publish all questions', async function() {
//         await publishQuestions(httpServer)
//       })
//     })

//     let firstGameId: string
//     let firstGameAnswers
//     describe('POST -> "/pair-game-quiz/pairs/my-current/answers", GET -> "/pair-game-quiz/pairs", GET -> "/pair-game-quiz/pairs/my-current": create third game by user2, connect to the game by user1, then: add correct answer by firstPlayer; add incorrect answer by secondPlayer; add correct answer by secondPlayer; get active game"; status 200;', () => {
//       it('create first game by user1', async function() {
//         const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[0]).expect(HttpStatusCode.OK_200)
//         firstGameId = res.body.id
//       })
//       it('connect to the game by user2', async function() {
//         const res = await request(httpServer).post('/pair-game-quiz/pairs/connection').set('Authorization', 'Bearer ' + accessTokens[1]).expect(HttpStatusCode.OK_200)
//         firstGameAnswers = getCorrectAnswers(res.body.questions)
//       })
//       it('add correct answer by firstPlayer;', async function() {
//         await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(firstGameAnswers[0]).expect(HttpStatusCode.OK_200)
//       })
//       it('add incorrect answer by secondPlayer;', async function() {
//         await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[1]).send(incorrectAnswer).expect(HttpStatusCode.OK_200)
//       })
//       it('add correct answer by secondPlayer;', async function() {
//         await request(httpServer).post('/pair-game-quiz/pairs/my-current/answers').set('Authorization', 'Bearer ' + accessTokens[0]).send(firstGameAnswers[1]).expect(HttpStatusCode.OK_200)
//       })
//     })
//   })
// })
