import { getTestConfiguration } from "../../test/config/test.config";
import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';
import { UserViewModel } from "../../src/users/models/view/UserView";
import { UserInputModel } from "../../src/users/models/input/UserInput";

export async function createUsers(httpServer, usersCount: number): Promise<UserViewModel[]> {
  const createdUsers = []
  const basicAuthCredentials = 'Basic ' + btoa(getTestConfiguration().basic_auth_credentials)
  for(let i = 0; i < usersCount; i++) {
    const userRes = await request(httpServer).post('/sa/users').set('Authorization', basicAuthCredentials).send(users[i]).expect(HttpStatusCode.CREATED_201)
    createdUsers.push(userRes.body)
  }
  return createdUsers
}

export async function createOneUser(httpServer, user: UserInputModel): Promise<UserViewModel> {
  const basicAuthCredentials = 'Basic ' + btoa(getTestConfiguration().basic_auth_credentials)
  const userRes = await request(httpServer).post('/sa/users').set('Authorization', basicAuthCredentials).send(user).expect(HttpStatusCode.CREATED_201)
  return userRes.body
}

export const users = [
  {
    login: "qwerty",
    password: "qwerty",
    email: "qwerty@mail.com"
  },
  {
    login: "testing",
    password: "testing",
    email: "testing@mail.com"
  },
  {
    login: "asdfgh",
    password: "asdfgh",
    email: "asdfgh@mail.com"
  },
  {
    login: "zxczxc",
    password: "zxczxc",
    email: "zxczxc@mail.com"
  },
  {
    login: "vbnvbn",
    password: "vbnvbn",
    email: "vbnvbn@mail.com"
  },
  {
    login: "testtest",
    password: "testtest",
    email: "testtest@mail.com"
  },
]

