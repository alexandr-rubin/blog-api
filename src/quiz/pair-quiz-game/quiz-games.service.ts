import { ForbiddenException, Injectable } from "@nestjs/common";
import { QuizGamesRepository } from "./quiz-games.repository";
import { QuizGameEntity } from "./entities/quiz-game.entity";
import { QuizGamesQueryRepository } from "./quiz-games.query-repository";
import { GameStatuses } from "../../helpers/gameStatuses";
import { CreateQuizGameInputModel } from "./models/input/CreateGame";
import { QuizQuestionsQueryRepository } from "../quiz-questions/quiz-questions.query-repository";
import { QuestionViewModel } from "./models/view/Questions";
import { GamePairViewModel } from "./models/view/GamePair";
import { AnswerViewModel } from "./models/view/Answer";
import { CreateAnswerInputModel } from "./models/input/CreateAnswer";
import { AnswerStatuses } from "../../helpers/answerStatuses";

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

  async answerCurrentGameQuestion(answer: string, userId: string): Promise<AnswerViewModel> {
    let currentGame: GamePairViewModel
    try {
      currentGame = await this.quizGamesQueryRepository.getMyCurrentGame(userId)
    }
    catch {
      throw new ForbiddenException('User not have active game.')
    }
    const currentPlayerProgress = currentGame.firstPlayerProgress.player.id === userId ? currentGame.firstPlayerProgress : currentGame.secondPlayerProgress
    const isAllQuestionsAnswered =  currentPlayerProgress.answers.length === 5
    if(isAllQuestionsAnswered || currentGame.status !== GameStatuses.Active){
      throw new ForbiddenException('You can\'t answer this question.')
    }

    const newQuestionIndex = currentPlayerProgress.answers.length
    const questionId = currentGame.questions[newQuestionIndex].id
    const question = await this.quizQuestionsQueryRepository.getQuestionByIdNoView(questionId)
    const answerStatus = answer in question.correctAnswers ? AnswerStatuses.Correct : AnswerStatuses.Incorrect

    const newAnswer: CreateAnswerInputModel = {gameId: currentGame.id, questionId: questionId, userId: userId, userAnswer: answer, answerStatus: answerStatus, addedAt: new Date().toISOString()}
    const createdAnswer = await this.quizGamesRepository.createAnswer(newAnswer)

    if(currentPlayerProgress.answers.length === 4 && (currentGame.firstPlayerProgress.answers.length === 5  || currentGame.secondPlayerProgress.answers.length === 5)){
      await this.quizGamesRepository.endGame(currentGame.id, new Date().toISOString(), GameStatuses.Finished)
    }

    return {questionId: questionId, answerStatus: answerStatus, addedAt: createdAnswer.addedAt}
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

  async deleteAnswersTesting(): Promise<boolean> {
    return await this.quizGamesRepository.deleteAnswersTesting()
  }
}