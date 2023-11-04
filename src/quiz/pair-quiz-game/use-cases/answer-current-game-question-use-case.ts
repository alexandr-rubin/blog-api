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
import { UpdateResult } from "typeorm";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron"
import { CronJobNames } from "../../../helpers/cronJobNames";

export class AnswerCurrentGameQuestionCommand {
  constructor(public answer: string, public userId: string) {}
}

@CommandHandler(AnswerCurrentGameQuestionCommand)
export class AnswerCurrentGameQuestionUseCase implements ICommandHandler<AnswerCurrentGameQuestionCommand> {
  constructor(private readonly quizGamesRepository: QuizGamesRepository, private readonly quizGamesQueryRepository: QuizGamesQueryRepository,
    private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository, private schedulerRegistry: SchedulerRegistry){}
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

    const atLeastOnePlayerAllQuestionsAnswered = currentGame.firstPlayerProgress.answers.length === 5  || currentGame.secondPlayerProgress.answers.length === 5

    const newQuestionIndex = currentPlayerProgress.answers.length
    const questionId = currentGame.questions[newQuestionIndex].id

    const newAnswer = await this.createNewAnswerInputModel(currentGame.id, command.answer, command.userId, questionId)
    
    const createdAnswer = await this.quizGamesRepository.createAnswer(newAnswer)

    await this.increaseScore(createdAnswer.answerStatus, currentGame, command.userId, isFirstPlayer)

    if(newQuestionIndex === 4 && !atLeastOnePlayerAllQuestionsAnswered){
      this.createEndGameCron(CronJobNames.EndGame, currentGame, isFirstPlayer)
    }

    if(newQuestionIndex === 4 && atLeastOnePlayerAllQuestionsAnswered){
      this.stopCronJob(CronJobNames.EndGame)
      await this.addExtraPointAndEndGame(currentGame, isFirstPlayer)
    }

    return {questionId: questionId, answerStatus: createdAnswer.answerStatus, addedAt: createdAnswer.addedAt}
  }

  private createEndGameCron(name: string, currentGame: GamePairViewModel, isFirstPlayer: boolean) {
    const cronTime = '*/10 * * * * *'
    const job = new CronJob(cronTime, () => {
      this.addExtraPointAndEndGame(currentGame, isFirstPlayer)
    })
    this.schedulerRegistry.addCronJob(name, job)
    job.start()
  }

  private stopCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name)
    job.stop()
  }

  private async createNewAnswerInputModel(gameId: string, answer: string, userId: string, questionId: string): Promise<CreateAnswerInputModel> {
    const question = await this.quizQuestionsQueryRepository.getQuestionByIdNoView(questionId)
    const answerStatus = answer in question.correctAnswers ? AnswerStatuses.Correct : AnswerStatuses.Incorrect
    const newAnswer: CreateAnswerInputModel = {gameId: gameId, questionId: questionId, userId: userId, userAnswer: answer, answerStatus: answerStatus, addedAt: new Date().toISOString()}
    return newAnswer
  }

  private async addExtraPointAndEndGame(currentGame: GamePairViewModel, isFirstPlayer: boolean){
    if (isFirstPlayer && currentGame.secondPlayerProgress.score > 0) {
      await this.quizGamesRepository.increaseSecondPlayerScore(currentGame.id)
    }
    else if(currentGame.firstPlayerProgress.score > 0){
      await this.quizGamesRepository.increasefirstPlayerScore(currentGame.id)
    }
    await this.quizGamesRepository.endGame(currentGame.id, new Date().toISOString(), GameStatuses.Finished)
  }

  private async increaseScore(answerStatus: AnswerStatuses, currentGame: GamePairViewModel, userId: string, isFirstPlayer: boolean): Promise<UpdateResult> {
    if(answerStatus === AnswerStatuses.Correct && isFirstPlayer){
      return await this.quizGamesRepository.increasefirstPlayerScore(currentGame.id)
    }
    else if(answerStatus === AnswerStatuses.Correct && currentGame.secondPlayerProgress.player.id === userId){
      return await this.quizGamesRepository.increaseSecondPlayerScore(currentGame.id)
    }
  } 

  
}