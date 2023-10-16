import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { QuizQuestionsService } from "../../src/quiz/quiz-questions.service";
import { CreateQuestionInputModel } from "../../src/quiz/quiz-questions/models/input/CreateQuestion";
import { QuizQuestionInputModel } from "../../src/quiz/quiz-questions/models/input/QuizQuestion";
import { QuizQuestionViewModel } from "../../src/quiz/quiz-questions/models/view/quiz-question";

export const arr = []

@Injectable()
export class QuizQuestionsServiceMock extends QuizQuestionsService {
  async addQuestion(question: QuizQuestionInputModel): Promise<QuizQuestionViewModel>{
    const newQuestion: CreateQuestionInputModel = {body: question.body, correctAnswers: Object.fromEntries(question.correctAnswers.map(value => [value, value])), published: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}
    const id = randomUUID()
    const result =  {id: id, ...newQuestion, correctAnswers: question.correctAnswers}
    arr.push(result)
    console.log('ЗАПИСАЛ')
    console.log(arr)
    return result
  }

  async deleteQuestionsTesting(): Promise<boolean> {
    arr.length = 0
    console.log('УДАЛИЛ')
    console.log(arr)
    return true
  }
}