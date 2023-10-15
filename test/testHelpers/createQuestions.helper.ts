import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import request from 'supertest';

export async function createTenQuestions(httpServer) {
  for(let i = 0; i < questions.length; i++) {
    await request(httpServer).post('/sa/quiz/questions').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(questions[i]).expect(HttpStatusCode.CREATED_201)
  }
}

export const questions = [
  {
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    correctAnswers: ["Lorem"]
  },
  {
    body: "What is the capital of France?",
    correctAnswers: ["Paris", "paris"]
  },
  {
    body: "How many continents are there in the world?",
    correctAnswers: ["7", "seven", "Seven"]
  },
  {
    body: "Who painted the Mona Lisa?",
    correctAnswers: ["Leonardo da Vinci", "leonardo da vinci"]
  },
  {
    body: "What is the chemical symbol for water?",
    correctAnswers: ["H2O", "h2o"]
  },
  {
    body: "What is the tallest mountain in the world?",
    correctAnswers: ["Mount Everest", "mount everest"]
  },
  {
    body: "Who is the author of Romeo and Juliet?",
    correctAnswers: ["William Shakespeare", "william shakespeare"]
  },
  {
    body: "What year did World War I end?",
    correctAnswers: ["1918", "nineteen eighteen"]
  },
  {
    body: "What is the largest mammal in the world?",
    correctAnswers: ["Blue whale", "blue whale"]
  },
  {
    body: "What is the chemical symbol for gold?",
    correctAnswers: ["Au", "au"]
  }
]

