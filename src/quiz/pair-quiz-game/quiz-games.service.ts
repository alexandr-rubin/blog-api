import { ForbiddenException, Injectable } from "@nestjs/common";
import { QuizGamesRepository } from "./quiz-games.repository";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { QuizGamesQueryRepository } from "./quiz-games.query-repository";
import { GameStatuses } from "../../helpers/gameStatuses";
import { CreateQuizGameInputModel } from "./models/input/CreateGame";
import { QuizQuestionsQueryRepository } from "../quiz-questions/quiz-questions.query-repository";
import { QuestionViewModel } from "./models/view/Questions";
import { GamePairViewModel } from "./models/view/GamePair";

@Injectable()
export class QuizGamesService {
  constructor(private readonly quizGamesRepository: QuizGamesRepository, private readonly quizGamesQueryRepository: QuizGamesQueryRepository,
    private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository){}

  async createOrConnectToTheGame(userId: string): Promise<GamePairViewModel> {
    // мб в гуард запихнуть?
    const userActiveGame = await this.quizGamesQueryRepository.findActiveGameForUser(userId)
    if(userActiveGame){
      throw new ForbiddenException('User already have active game.')
    }
    // вынести pending в отдельный метод
    const pendingGame = await this.quizGamesQueryRepository.findPendingSecondPlayerGame()
    if(pendingGame){
      return await this.pendingGame(pendingGame, userId)
    }

    return await this.createGame(userId)
  }

  private async pendingGame(game: QuizGameEntity, userId: string): Promise<GamePairViewModel>{
    game.player2Id = userId
    game.startGameDate = new Date().toISOString()
    game.status = GameStatuses.Active

    const savedGame = await this.quizGamesRepository.saveGame(game)
    return await this.quizGamesQueryRepository.getGameById(savedGame.id, userId)
  }

  private async createGame(userId: string): Promise<GamePairViewModel> {
    const questions = await this.quizQuestionsQueryRepository.getQuestionsForGame()

    const mapQuestions: QuestionViewModel[] = questions.map(question => ({
      id: question.id,
      body: question.body,
    }))

    const newGame: CreateQuizGameInputModel = {player1Id: userId, status: GameStatuses.PendingSecondPlayer, pairCreatedDate: new Date().toISOString(), questions: mapQuestions }

    const createdGame = await this.quizGamesRepository.createGame(newGame)

    return await this.quizGamesQueryRepository.getGameById(createdGame.id, userId)
  }

  async deleteGamesTesting(): Promise<boolean> {
    return await this.quizGamesRepository.deleteGamesTesting()
  }
}