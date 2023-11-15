import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { QuizGamesRepository } from "../quiz-games.repository";
import { QuizQuestionsQueryRepository } from "../../../quiz/quiz-questions/quiz-questions.query-repository";
import { QuizGamesQueryRepository } from "../quiz-games.query-repository";
import { GamePairViewModel } from "../models/view/GamePair";
import { CreateAnswerInputModel } from "../models/input/CreateAnswer";
import { AnswerStatuses } from "../../../helpers/answerStatuses";
import { ForbiddenException } from "@nestjs/common";
import { GameStatuses } from "../../../helpers/gameStatuses";
import { AnswerViewModel } from "../models/view/Answer";
import { DataSource, QueryRunner, UpdateResult } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { GameTimestampsEntity } from "../entities/game-last-answer-timestamp";
import { TimestampInputModel } from "../models/input/Timestamp";

export class AnswerCurrentGameQuestionCommand {
  constructor(public answer: string, public userId: string) {}
}

@CommandHandler(AnswerCurrentGameQuestionCommand)
export class AnswerCurrentGameQuestionUseCase implements ICommandHandler<AnswerCurrentGameQuestionCommand> {
  constructor(private readonly quizGamesRepository: QuizGamesRepository, private readonly quizGamesQueryRepository: QuizGamesQueryRepository,
    private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository, private dataSource: DataSource){}
  async execute(command: AnswerCurrentGameQuestionCommand): Promise<AnswerViewModel> {
    let currentGame: GamePairViewModel
    try {
      currentGame = await this.quizGamesQueryRepository.getMyCurrentGame(command.userId)
    }
    catch {
      throw new ForbiddenException('User not have active game.')
    }
    
    const isFirstPlayer = currentGame.firstPlayerProgress.player.id === command.userId
    const currentPlayerProgress = isFirstPlayer ? currentGame.firstPlayerProgress : currentGame.secondPlayerProgress
    const isAllQuestionsAnswered =  currentPlayerProgress.answers.length === 5
    if(isAllQuestionsAnswered || currentGame.status !== GameStatuses.Active){
      throw new ForbiddenException('You can\'t answer this question.')
    }

    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()

    try{
      const atLeastOnePlayerAllQuestionsAnswered = currentGame.firstPlayerProgress.answers.length === 5  || currentGame.secondPlayerProgress.answers.length === 5

      const newQuestionIndex = currentPlayerProgress.answers.length
      const questionId = currentGame.questions[newQuestionIndex].id

      const newAnswer = await this.createNewAnswerInputModel(currentGame.id, command.answer, command.userId, questionId)

      const createdAnswer = await this.quizGamesRepository.createAnswer(newAnswer, qr)

      await this.increaseScore(createdAnswer.answerStatus, currentGame, command.userId, isFirstPlayer, qr)

      if(newQuestionIndex === 4 && atLeastOnePlayerAllQuestionsAnswered){
        await this.addExtraPoint(currentGame.id, currentGame.firstPlayerProgress.score, currentGame.secondPlayerProgress.score, isFirstPlayer, qr)
        await this.quizGamesRepository.endGame(currentGame.id, new Date().toISOString(), GameStatuses.Finished, qr)
      }

      if(newQuestionIndex === 4 && !atLeastOnePlayerAllQuestionsAnswered){
        const timestamp: TimestampInputModel = { gameId: currentGame.id, isActive: true, createdAt: new Date().toISOString(), isFirstPlayerEndFirst: !isFirstPlayer }
        await this.quizGamesRepository.createTimestamp(timestamp, qr)
      }

      await qr.commitTransaction()
      
      return {questionId: questionId, answerStatus: createdAnswer.answerStatus, addedAt: createdAnswer.addedAt}
    }
    catch(error) {
      console.log(error)
      await qr.rollbackTransaction()
    }
    finally {
      await qr.release()
    }
  }

  @Cron('*/10 * * * * *')
  private async endExpiredGames(){
    const expiredTimestamps: GameTimestampsEntity[] | null = await this.quizGamesQueryRepository.findExpiredTimestamps()
    for(const expiredTimestamp of expiredTimestamps){
      const qr = this.dataSource.createQueryRunner()
      await qr.connect()
      await qr.startTransaction()
      try{
        // Add extra points
        const game = await this.quizGamesQueryRepository.getGameByIdNoView(expiredTimestamp.gameId)
        await this.addExtraPoint(game.id, game.firstPlayerScore, game.secondPlayerScore, expiredTimestamp.isFirstPlayerEndFirst, qr)
        await this.quizGamesRepository.endGame(expiredTimestamp.gameId, new Date().toISOString(), GameStatuses.Finished, qr)
        await this.quizGamesRepository.deactivateTimestamp(expiredTimestamp.id, qr)
        await qr.commitTransaction()
      }
      catch(error) {
        console.log(error)
        await qr.rollbackTransaction()
      }
      finally {
        await qr.release()
      }
    }
  }

  private async createNewAnswerInputModel(gameId: string, answer: string, userId: string, questionId: string): Promise<CreateAnswerInputModel> {
    const question = await this.quizQuestionsQueryRepository.getQuestionByIdNoView(questionId)
    const answerStatus = answer in question.correctAnswers ? AnswerStatuses.Correct : AnswerStatuses.Incorrect
    const newAnswer: CreateAnswerInputModel = {gameId: gameId, questionId: questionId, userId: userId, userAnswer: answer, answerStatus: answerStatus, addedAt: new Date().toISOString()}
    return newAnswer
  }

  private async addExtraPoint(gameId: string, firstPlayerScore: number, secondPlayerScore: number , isFirstPlayer: boolean, qr: QueryRunner | null){
    if (isFirstPlayer && secondPlayerScore > 0) {
      await this.quizGamesRepository.increaseSecondPlayerScore(gameId, qr)
    }
    else if(firstPlayerScore > 0){
      await this.quizGamesRepository.increasefirstPlayerScore(gameId, qr)
    }
  }

  private async increaseScore(answerStatus: AnswerStatuses, currentGame: GamePairViewModel, userId: string, isFirstPlayer: boolean, qr: QueryRunner): Promise<UpdateResult> {
    if(answerStatus === AnswerStatuses.Correct && isFirstPlayer){
      return await this.quizGamesRepository.increasefirstPlayerScore(currentGame.id, qr)
    }
    else if(answerStatus === AnswerStatuses.Correct && currentGame.secondPlayerProgress.player.id === userId){
      return await this.quizGamesRepository.increaseSecondPlayerScore(currentGame.id, qr)
    }
  } 

  
}