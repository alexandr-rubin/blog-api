import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { QuizGamesRepository } from "../quiz-games.repository";
import { QuizQuestionsQueryRepository } from "../../../quiz/quiz-questions/quiz-questions.query-repository";
import { QuizGamesQueryRepository } from "../quiz-games.query-repository";
import { GamePairViewModel } from "../models/view/GamePair";
import { ForbiddenException } from "@nestjs/common";
import { GameStatuses } from "../../../helpers/gameStatuses";
import { QuizGameEntity } from "../entities/quiz-game.entity";
import { QuestionViewModel } from "../models/view/Questions";
import { CreateQuizGameInputModel } from "../models/input/CreateGame";

export class CreateOrConnectToTheGameCommand {
  constructor(public userId: string) {}
}

@CommandHandler(CreateOrConnectToTheGameCommand)
export class CreateOrConnectToTheGameUseCase implements ICommandHandler<CreateOrConnectToTheGameCommand> {
  constructor(private readonly quizGamesRepository: QuizGamesRepository, private readonly quizGamesQueryRepository: QuizGamesQueryRepository,
    private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository){}
  async execute(command: CreateOrConnectToTheGameCommand): Promise<GamePairViewModel> {
    // мб в гуард запихнуть?
    const userActiveGame = await this.quizGamesQueryRepository.findActiveGameForUser(command.userId)
    if(userActiveGame){
      throw new ForbiddenException('User already have active game.')
    }
    
    const pendingGame = await this.quizGamesQueryRepository.findPendingSecondPlayerGame()
    if(pendingGame){
      return await this.pendingGame(pendingGame, (command.userId))
    }

    return await this.createGame((command.userId))
  }

  private async pendingGame(game: QuizGameEntity, userId: string): Promise<GamePairViewModel>{
    game.playerTwoId = userId
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

    const newGame: CreateQuizGameInputModel = {playerOneId: userId, status: GameStatuses.PendingSecondPlayer, pairCreatedDate: new Date().toISOString(), questions: mapQuestions }

    const createdGame = await this.quizGamesRepository.createGame(newGame)

    return await this.quizGamesQueryRepository.getGameById(createdGame.id, userId)
  }
}