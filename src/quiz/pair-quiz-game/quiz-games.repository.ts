import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository, UpdateResult } from "typeorm";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { CreateQuizGameInputModel } from "./models/input/CreateGame";
import { CreateAnswerInputModel } from "./models/input/CreateAnswer";
import { QuizAnswersEntity } from "./entities/quiz-answers.entity";
import { GameStatuses } from "../../helpers/gameStatuses";
import { GameTimestampsEntity } from "./entities/game-last-answer-timestamp";
import { TimestampInputModel } from "./models/input/Timestamp";

@Injectable()
export class QuizGamesRepository {
  constructor(@InjectRepository(QuizGameEntity) private readonly quizGamesRepository: Repository<QuizGameEntity>,
  @InjectRepository(QuizAnswersEntity) private readonly quizAnswersRepository: Repository<QuizAnswersEntity>,
  @InjectRepository(GameTimestampsEntity) private readonly gameTimestampsRepository: Repository<GameTimestampsEntity>){}

  async createGame(newGame: CreateQuizGameInputModel) {
    return await this.quizGamesRepository.save(newGame)
  }

  async saveGame(gameEntity: QuizGameEntity): Promise<QuizGameEntity> {
    return await this.quizGamesRepository.save(gameEntity)
  }

  async endGame(gameId: string, finishGameDate: string, status: GameStatuses, qr: QueryRunner | null): Promise<UpdateResult> {
    if(!qr){
      return await this.quizGamesRepository.update({id: gameId}, {finishGameDate: finishGameDate, status: status})
    }

    return await qr.manager.getRepository(QuizGameEntity).update({id: gameId}, {finishGameDate: finishGameDate, status: status})
  }

  async createAnswer(answer: CreateAnswerInputModel, qr: QueryRunner): Promise<QuizAnswersEntity> {
    return await qr.manager.getRepository(QuizAnswersEntity).save(answer)
  }

  async increasefirstPlayerScore(gameId: string, qr: QueryRunner | null): Promise<UpdateResult> {
    const queryBuilder = qr
      ? qr.manager.getRepository(QuizGameEntity).createQueryBuilder()
      : this.quizGamesRepository.createQueryBuilder()

    const updateResult: UpdateResult = await queryBuilder
    .update()
    .set({ firstPlayerScore: () => '"firstPlayerScore" + 1' })
    .where('id = :gameId', { gameId })
    .execute()

    return updateResult
  }

  async increaseSecondPlayerScore(gameId: string, qr: QueryRunner | null): Promise<UpdateResult> {
    const queryBuilder = qr
      ? qr.manager.getRepository(QuizGameEntity).createQueryBuilder()
      : this.quizGamesRepository.createQueryBuilder()

    const updateResult: UpdateResult = await queryBuilder
    .update()
    .set({ secondPlayerScore: () => '"secondPlayerScore" + 1' })
    .where('id = :gameId', { gameId })
    .execute()

    return updateResult
  }

  async createTimestamp(timestamp: TimestampInputModel, qr: QueryRunner) {
    await qr.manager.getRepository(GameTimestampsEntity).save(timestamp)
  }

  async deactivateTimestamp(id: string, qr: QueryRunner) {
    await qr.manager.getRepository(GameTimestampsEntity).update({id: id}, { isActive: false })
  }

  async deleteGamesTesting(): Promise<boolean> {
    await this.quizGamesRepository.delete({})
    return true
  }

  async deleteTimestampsTesting(): Promise<boolean> {
    await this.gameTimestampsRepository.delete({})
    return true
  }

  async deleteAnswersTesting(): Promise<boolean> {
    await this.quizAnswersRepository.delete({})
    return true
  }
}