import { Injectable, NotFoundException } from "@nestjs/common";
import { QuizQuestionViewModel } from "./quiz-questions/models/view/quiz-question";
import { QuizQuestionInputModel } from "./quiz-questions/models/input/QuizQuestion";
import { QuizQuestionsRepository } from "./quiz-questions.repository";
import { CreateQuestionInputModel } from "./quiz-questions/models/input/CreateQuestion";
import { DeleteResult } from "typeorm";

@Injectable()
export class QuizQuestionsService {
  constructor(private readonly quizQuestionsRepository: QuizQuestionsRepository){}

  async addQuestion(question: QuizQuestionInputModel): Promise<QuizQuestionViewModel>{
    const newQuestion: CreateQuestionInputModel = {body: question.body, correctAnswers: Object.fromEntries(question.correctAnswers.map(value => [value, value])), published: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}
    const id = await this.quizQuestionsRepository.addQuestion(newQuestion)
    return {id: id, ...newQuestion, correctAnswers: question.correctAnswers}
  }

  async deleteQuestionsTesting(): Promise<boolean> {
    return await this.quizQuestionsRepository.deleteQuestionsTesting()
  }

  async deleteQuestionById(questionId: string): Promise<DeleteResult> {
    const isDeleted = await this.quizQuestionsRepository.DeleteQuestionById(questionId)
    if(isDeleted.affected === 0){
      throw new NotFoundException()
    }
    return isDeleted
  }
}