import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { CreateQuizGameInputModel } from "./models/input/CreateGame";

@Injectable()
export class QuizGamesRepository {
  constructor(@InjectRepository(QuizGameEntity) private readonly quizGamesRepository: Repository<QuizGameEntity>){}

  async createGame(newGame: CreateQuizGameInputModel) {
    return await this.quizGamesRepository.save(newGame)
  }

  async saveGame(gameEntity: QuizGameEntity): Promise<QuizGameEntity> {
    return await this.quizGamesRepository.save(gameEntity)
  }

  async deleteGamesTesting(): Promise<boolean> {
    await this.quizGamesRepository.delete({})
    return true
  }
}