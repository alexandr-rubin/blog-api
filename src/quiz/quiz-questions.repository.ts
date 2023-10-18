import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { QuizQuestionEntity } from "./quiz-questions/entities/quiz-question.entity";
import { CreateQuestionInputModel } from "./quiz-questions/models/input/CreateQuestion";
import { UpdateQuestionInputModel } from "./quiz-questions/models/input/UpdateQuestion";

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

  async updateQuestionById(id: string, question: UpdateQuestionInputModel): Promise<UpdateResult> {
    return await this.quizQuestionsRepository.update( { id: id }, question)
  }

  async publishUnpublishQuestionById(id: string, publishStatus: boolean): Promise<UpdateResult> {
    return await this.quizQuestionsRepository.update( { id: id }, { published: publishStatus })
  }
}