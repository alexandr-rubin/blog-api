import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';

export async function removeAllData(httpServer) {
  await request(httpServer).delete('/testing/all-data').expect(HttpStatusCode.NO_CONTENT_204);

  await checkNoUsers(httpServer)
  await checkNoBlogs(httpServer)
  await checkNoPosts(httpServer)
}

async function checkNoUsers(httpServer) {
  const usersRes = await request(httpServer)
    .get('/sa/users')
    .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
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
