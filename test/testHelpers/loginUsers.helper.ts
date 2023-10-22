import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';
import { UserViewModel } from "../../src/users/models/view/UserView";

export async function loginUsers(httpServer, users: UserViewModel[]): Promise<string[]> {
  const accessTokens: string[] = []
  for(let i = 0; i < users.length; i++) {
    const userRes = await request(httpServer).post('/auth/login').send({loginOrEmail: users[i].login, password: users[i].login}).expect(HttpStatusCode.OK_200)
    accessTokens.push(userRes.body.accessToken)
  }
  return accessTokens
}

