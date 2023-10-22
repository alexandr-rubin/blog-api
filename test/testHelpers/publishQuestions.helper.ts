import { getTestConfiguration } from "../../test/config/test.config";
import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';

export async function publishQuestions(httpServer) {
  const basicAuthCredentials = 'Basic ' + btoa(getTestConfiguration().basic_auth_credentials)
  const questionRes = await request(httpServer).get('/sa/quiz/questions').set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200)
  for(let i = 0; i < questionRes.body.items.length; i++) {
    await request(httpServer).put('/sa/quiz/questions/' + questionRes.body.items[i].id + '/publish').set('Authorization', basicAuthCredentials).send({published: true}).expect(HttpStatusCode.NO_CONTENT_204)
  }
}

