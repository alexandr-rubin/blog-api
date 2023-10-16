import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, Repository } from "typeorm";
import { QuizQuestionEntity } from "./quiz-questions/entities/quiz-question.entity";
import { CreateQuestionInputModel } from "./quiz-questions/models/input/CreateQuestion";

@Injectable()
export class QuizQuestionsRepository {
  constructor(@InjectRepository(QuizQuestionEntity) private readonly quizQuestionsRepository: Repository<QuizQuestionEntity>){}
  async addQuestion(quizQuestion: CreateQuestionInputModel): Promise<string> {
    return (await this.quizQuestionsRepository.save(quizQuestion)).id
  }

  async deleteQuestionsTesting(): Promise<boolean> {
    await this.quizQuestionsRepository.clear()
    return true
  }

  async DeleteQuestionById(id: string): Promise<DeleteResult> {
    return await this.quizQuestionsRepository.delete(id)
  }
}