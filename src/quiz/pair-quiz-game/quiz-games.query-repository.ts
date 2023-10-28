import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { GameStatuses } from "../../helpers/gameStatuses";
import { GamePairViewModel } from "./models/view/GamePair";
import { UserQueryRepository } from "../../users/user.query-repository";
import { QuizAnswersEntity } from "./entities/quiz-answers.entity";
import { AnswerViewModel } from "./models/view/Answer";
import { AllGameAnswersViewModel } from "./models/view/AllGameAnswers";
import { StatisticViewModel } from "./models/view/Statistic";
import { Paginator } from "../../models/Paginator";
import { QueryParamsModel } from "../../models/PaginationQuery";
import { createPaginationQuery } from "../../helpers/pagination";
import { UserTopViewModel } from "./models/view/userTop";

@Injectable()
export class QuizGamesQueryRepository {
  constructor(@InjectRepository(QuizGameEntity) private readonly quizGamesRepository: Repository<QuizGameEntity>,
  private readonly userQueryRepository: UserQueryRepository, 
  @InjectRepository(QuizAnswersEntity) private readonly quizAnswersRepository: Repository<QuizAnswersEntity>){}
  
  async getUsersTop(params: QueryParamsModel): Promise<Paginator<UserTopViewModel>> {
    const query = createPaginationQuery(params)
    const usersStatistic: UserTopViewModel[] = []
    const players = await this.userQueryRepository.getUsersRelatedToGames()
    for(const player of players){
      const statistic = await this.getMyStatistic(player.id)
      usersStatistic.push({...statistic, player: {id: player.id, login: player.login}})
    }
    const sortedStatistic = this.sortStatistic(usersStatistic, query.sort)
    const startIndex = (query.pageNumber - 1) * query.pageSize
    const endIndex = startIndex + query.pageSize
    const pagedData = sortedStatistic.slice(startIndex, endIndex)
    const result = Paginator.createPaginationResult(players.length, query, pagedData)
    return result
  }

  async findPendingSecondPlayerGame(): Promise<QuizGameEntity | null> {
    return await this.quizGamesRepository.findOneBy({status: GameStatuses.PendingSecondPlayer})
  }

  async findActiveGameForUser(userId: string): Promise<QuizGameEntity | null> {
    const game = await this.quizGamesRepository.createQueryBuilder('game')
      .where('(game.playerOneId = :userId OR game.playerTwoId = :userId)', { userId })
      .andWhere('game.status IN (:...statuses)', { statuses: [GameStatuses.Active, GameStatuses.PendingSecondPlayer] })
      .getOne()
    return game || null
  }

  async getMyStatistic(userId: string): Promise<StatisticViewModel> {
    const games = await this.quizGamesRepository.createQueryBuilder('game')
        .where('(game.playerOneId = :userId OR game.playerTwoId = :userId)', { userId })
        .andWhere('(game.status = :status)', { status: GameStatuses.Finished })
        .getMany()

    const statistic = await this.calculateStatistics(games, userId)

    return statistic
  }

  async getAllMyGames(userId: string, params: QueryParamsModel): Promise<Paginator<GamePairViewModel>> {
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    if(query.sortBy === 'createdAt'){
      query.sortBy = 'pairCreatedDate'
    }

  const whereFilter = '(game.playerOneId = :userId OR game.playerTwoId = :userId)'
  const games = await this.quizGamesRepository
    .createQueryBuilder('game')
    .select()
    .where(whereFilter, { userId })
    .addOrderBy(`game.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .addOrderBy('game.pairCreatedDate', 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

  const mappedGames: GamePairViewModel[] = await Promise.all(games.map(async (game) => {
    const mappedGame = await this.mapGame(game);
    return mappedGame
  }))

  const count = await this.quizGamesRepository
    .createQueryBuilder('game')
    .where(whereFilter, { userId })
    .getCount()

    const result = Paginator.createPaginationResult(count, query, mappedGames)

    return result
  }

  async getMyCurrentGame(userId: string): Promise<GamePairViewModel> {
    const game = await this.findActiveGameForUser(userId)
    if(!game){
      throw new NotFoundException('No active game for user.')
    }
    const result = await this.mapGame(game)

    return result
  }

  async getGameById(id: string, userId: string): Promise<GamePairViewModel> {
    const game = await this.quizGamesRepository.findOneBy({id: id})
    if(!game){
      throw new NotFoundException('Game is not found.')
    }
    if(game.playerOneId !== userId && game.playerTwoId !== userId){
      throw new ForbiddenException('No access to this game.')
    }
    
    const result: GamePairViewModel = await this.mapGame(game)

    return result
  }

  private async calculateStatistics(games: QuizGameEntity[], userId: string): Promise<StatisticViewModel> {
    const statistic: StatisticViewModel = {
      sumScore: 0,
      avgScores: 0,
      gamesCount: 0,
      winsCount: 0,
      lossesCount: 0,
      drawsCount: 0
    }

    for (const game of games) {
      const isFirstPlayer = game.playerOneId === userId
      const isSecondPlayer = game.playerTwoId === userId

      //const allGameAnswers = await this.getAnswersForGame(game, game.player1Id, game.player2Id)
      // const score = this.countScoreForGame(allGameAnswers)

      if (isFirstPlayer || isSecondPlayer) {
          const playerScore = isFirstPlayer ? game.firstPlayerScore : game.secondPlayerScore
          statistic.sumScore += playerScore
          const isFirstPlayerWin = isFirstPlayer && playerScore > game.secondPlayerScore
          const isSecondPlayerWin = isSecondPlayer && playerScore > game.firstPlayerScore
          const isDraw = game.firstPlayerScore === game.secondPlayerScore


          if (isFirstPlayerWin) {
            statistic.winsCount++
          } else if (isSecondPlayerWin) {
            statistic.winsCount++
          } else if (isFirstPlayer && playerScore < game.secondPlayerScore) {
            statistic.lossesCount++
          } else if (isSecondPlayer && playerScore < game.firstPlayerScore) {
            statistic.lossesCount++
          } else if (isDraw) {
            statistic.drawsCount++
          }
      }
    }

    const gamesCount = statistic.winsCount + statistic.lossesCount + statistic.drawsCount
    statistic.gamesCount = gamesCount
    const avgScores = gamesCount > 0 ? statistic.sumScore / gamesCount : 0
    statistic.avgScores = parseFloat(avgScores.toFixed(2))

    return statistic
  }

  private async mapGame(game: QuizGameEntity) {
    const player1 = await this.userQueryRepository.getUsergByIdNoView(game.playerOneId)
    const player2Login = game.playerTwoId !== null ? (await this.userQueryRepository.getUsergByIdNoView(game.playerTwoId)).login : game.playerTwoId

    const allGameAnswers = await this.getAnswersForGame(game, player1.id, game.playerTwoId)
    // const score = this.countScoreForGame(allGameAnswers)

    const result: GamePairViewModel = {
      id: game.id, 
      firstPlayerProgress: {answers: allGameAnswers.firstPlayerAnswers, player: {id: game.playerOneId, login: player1.login }, score: game.firstPlayerScore},
      secondPlayerProgress: {answers: allGameAnswers.secondPlayerAnswers, player: {id: game.playerTwoId, login: player2Login}, score: game.secondPlayerScore},
      questions: game.questions,
      status: game.status,
      pairCreatedDate: game.pairCreatedDate,
      startGameDate: game.startGameDate,
      finishGameDate: game.finishGameDate
    }

    if(game.status === GameStatuses.PendingSecondPlayer){
      result.questions = null
      result.secondPlayerProgress = null
    }

    return result
  }

  async getGameByIdNoView(id: string): Promise<QuizGameEntity | null> {
    const game = await this.quizGamesRepository.findOneBy({id: id})

    return game
  }

  private async getAnswersForGame(game: QuizGameEntity, player1Id: string, player2Id: string): Promise<AllGameAnswersViewModel> {
    const firstPlayerAnswers = await this.quizAnswersRepository.findBy({gameId: game.id, userId: player1Id})
    const secondPlayerAnswers = await this.quizAnswersRepository.findBy({gameId: game.id, userId: player2Id})

    const firstPlayerMappedAnswers = this.mapAnswers(firstPlayerAnswers)
    const secondPlayerMappedAnswers = this.mapAnswers(secondPlayerAnswers)

    return {firstPlayerAnswers: firstPlayerMappedAnswers, secondPlayerAnswers: secondPlayerMappedAnswers}
  }

  private mapAnswers(answers: QuizAnswersEntity[]): AnswerViewModel[] {
    const mappedAnswers = answers.map(answer => {
      return {
          questionId: answer.questionId,
          answerStatus: answer.answerStatus,
          addedAt: answer.addedAt
      }
    })

    mappedAnswers.sort((a, b) => {
      if (a.addedAt < b.addedAt) return -1;
      if (a.addedAt > b.addedAt) return 1;
      return 0;
    })

    return mappedAnswers
  }

  private sortStatistic(statistic: UserTopViewModel[], sortCriteria: string | string[]): UserTopViewModel[] {
    if (typeof sortCriteria === 'string') {
      sortCriteria = [sortCriteria];
    }
  
    return statistic.sort((a, b) => {
      for (const criteria of sortCriteria) {
        const [key, order] = criteria.split(' ')
        const aValue = a[key]
        const bValue = b[key]
  
        const comparison = typeof aValue === 'string'
          ? aValue.localeCompare(bValue)
          : aValue - bValue
  
        if (comparison !== 0) {
          return order.toLowerCase() === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  }
}