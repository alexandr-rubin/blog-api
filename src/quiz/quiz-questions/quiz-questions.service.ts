import { Injectable, NotFoundException } from "@nestjs/common";
import { DeleteResult, UpdateResult } from "typeorm";
import { QuizQuestionsRepository } from "./quiz-questions.repository";
import { QuizQuestionInputModel } from "./models/input/QuizQuestion";
import { QuizQuestionViewModel } from "./models/view/quiz-question";
import { CreateQuestionInputModel } from "./models/input/CreateQuestion";
import { UpdateQuestionInputModel } from "./models/input/UpdateQuestion";

@Injectable()
export class QuizQuestionsService {
  constructor(private readonly quizQuestionsRepository: QuizQuestionsRepository){}

  async addQuestion(question: QuizQuestionInputModel): Promise<QuizQuestionViewModel>{
    const newQuestion: CreateQuestionInputModel = {body: question.body, correctAnswers: Object.fromEntries(question.correctAnswers.map(value => [value, value])), published: false, createdAt: new Date().toISOString(), updatedAt: null}
    const id = await this.quizQuestionsRepository.addQuestion(newQuestion)
    return {id: id, ...newQuestion, updatedAt: null, correctAnswers: question.correctAnswers}
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

  async updateQuestionById(id: string, question: QuizQuestionInputModel): Promise<UpdateResult> {
    const newQuestion: UpdateQuestionInputModel = {body: question.body, correctAnswers: Object.fromEntries(question.correctAnswers.map(value => [value, value]))}
    const isUpdated = await this.quizQuestionsRepository.updateQuestionById(id, newQuestion)
    if(!isUpdated){
      throw new NotFoundException()
    }
    return isUpdated
  }

  async publishUnpublishQuestionById(id: string, publishStatus: boolean): Promise<UpdateResult> {
    const isUpdated = await this.quizQuestionsRepository.publishUnpublishQuestionById(id, publishStatus)
    if(!isUpdated){
      throw new NotFoundException()
    }
    return isUpdated
  }
}