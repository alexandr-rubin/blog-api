import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { GameStatuses } from "../../helpers/gameStatuses";
import { GamePairViewModel } from "./models/view/GamePair";
import { UserQueryRepository } from "../../users/user.query-repository";

@Injectable()
export class QuizGamesQueryRepository {
  constructor(@InjectRepository(QuizGameEntity) private readonly quizQuestionsRepository: Repository<QuizGameEntity>,
  private readonly userQueryRepository: UserQueryRepository){}
  
  async findPendingSecondPlayerGame(): Promise<QuizGameEntity | null> {
    return await this.quizQuestionsRepository.findOneBy({status: GameStatuses.PendingSecondPlayer})
  }

  async findActiveGameForUser(userId: string): Promise<QuizGameEntity | null> {
    const game = await this.quizQuestionsRepository.createQueryBuilder('game')
      .where(qb => {
        qb.where('(game.player1Id = :userId)', { userId })
        .orWhere('(game.player2Id = :userId)', { userId })
      })
      .andWhere('game.status IN (:...statuses)', { statuses: [GameStatuses.Active, GameStatuses.PendingSecondPlayer] })
      .getOne();
    return game || null;
  }

  async getGameById(id: string, userId: string): Promise<GamePairViewModel> {
    const game = await this.quizQuestionsRepository.findOneBy({id: id})
    if(!game){
      throw new NotFoundException('Game is not found.')
    }
    if(game.player1Id !== userId && game.player2Id !== userId){
      throw new ForbiddenException('No access to this game.')
    }

    //wtf
    const player1 = await this.userQueryRepository.getUsergByIdNoView(game.player1Id)
    const player2Login = game.player2Id !== null ? (await this.userQueryRepository.getUsergByIdNoView(game.player2Id)).login : game.player2Id
    
    const result: GamePairViewModel = {
      id: game.id, 
      firstPlayerProgress: {answers: [], player: {id: game.player1Id, login: player1.login }, score: 0},
      secondPlayerProgress: {answers: [], player: {id: game.player2Id, login: player2Login}, score: 0},
      questions: game.questions,
      status: GameStatuses.PendingSecondPlayer,
      pairCreatedDate: new Date().toISOString(),
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate
    }

    return result
  }

  async getGameByIdNoView(id: string): Promise<QuizGameEntity | null> {
    const game = await this.quizQuestionsRepository.findOneBy({id: id})

    return game
  }
}