import { Injectable } from "@nestjs/common";
import { QuizGamesRepository } from "./quiz-games.repository";

@Injectable()
export class QuizGamesService {
  constructor(private readonly quizGamesRepository: QuizGamesRepository){}

  async deleteGamesTesting(): Promise<boolean> {
    return await this.quizGamesRepository.deleteGamesTesting()
  }

  async deleteAnswersTesting(): Promise<boolean> {
    return await this.quizGamesRepository.deleteAnswersTesting()
  }
}