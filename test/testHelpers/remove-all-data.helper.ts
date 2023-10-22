import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';

export async function removeAllData(httpServer, basicAuthCredentials: string) {
  await request(httpServer).delete('/testing/all-data').expect(HttpStatusCode.NO_CONTENT_204)

  await checkNoUsers(httpServer, basicAuthCredentials)
  await checkNoBlogs(httpServer)
  await checkNoPosts(httpServer)
  await checkNoQuestions(httpServer, basicAuthCredentials)
  //add check no answers
}

async function checkNoUsers(httpServer, basicAuthCredentials: string) {
  const usersRes = await request(httpServer)
    .get('/sa/users')
    .set('Authorization', basicAuthCredentials)
    .expect(HttpStatusCode.OK_200)

  expect(usersRes.body.items.length).toBe(0)
}

async function checkNoBlogs(httpServer) {
  const blogsRes = await request(httpServer).get('/blogs').expect(HttpStatusCode.OK_200);
  expect(blogsRes.body.items.length).toBe(0)
}

async function checkNoPosts(httpServer) {
  const postsRes = await request(httpServer).get('/posts').expect(HttpStatusCode.OK_200);
  expect(postsRes.body.items.length).toBe(0)
}

async function checkNoQuestions(httpServer, basicAuthCredentials: string) {
  const questionsRes = await request(httpServer)
  .get('/sa/quiz/questions')
  .set('Authorization', basicAuthCredentials).expect(HttpStatusCode.OK_200);

  expect(questionsRes.body.items.length).toBe(0)
}
