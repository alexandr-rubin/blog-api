import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { AccessTokenVrifyModel } from "../../models/Auth";
import { QuizGamesQueryRepository } from "./quiz-games.query-repository";
import { HttpStatusCode } from "../../helpers/httpStatusCode";
import { QuizGameIdValidationPipe } from "../../validation/pipes/game-id-validation.pipe";
import { AnswerInputModel } from "./models/input/Answer";
import { QueryParamsModel } from "../../models/PaginationQuery";
import { CommandBus } from "@nestjs/cqrs";
import { AnswerCurrentGameQuestionCommand } from "./use-cases/answer-current-game-question-use-case";
import { CreateOrConnectToTheGameCommand } from "./use-cases/create-or-connect-to-the-game-use-case";

@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz')
export class QuizGamesController {
  constructor(private readonly quizGamesQueryRepository: QuizGamesQueryRepository, private commandBus: CommandBus){}

  @HttpCode(HttpStatusCode.OK_200)
  @Post('pairs/connection')
  async createOrConnectToTheGame(@Req() req: AccessTokenVrifyModel) {
    return await this.commandBus.execute(new CreateOrConnectToTheGameCommand(req.user.userId))
  }

  @HttpCode(HttpStatusCode.OK_200)
  @Post('pairs/my-current/answers')
  async answerCurrentGameQuestion(@Body() answer: AnswerInputModel, @Req() req: AccessTokenVrifyModel) {
    return await this.commandBus.execute(new AnswerCurrentGameQuestionCommand(answer.answer, req.user.userId))
  }

  @Get('pairs/my')
  async getAllMyGames(@Req() req: AccessTokenVrifyModel, @Query() params: QueryParamsModel) {
    return await this.quizGamesQueryRepository.getAllMyGames(req.user.userId, params)
  }

  @Get('pairs/my-current')
  async getMyCurrentGame(@Req() req: AccessTokenVrifyModel) {
    return await this.quizGamesQueryRepository.getMyCurrentGame(req.user.userId)
  }

  @Get('pairs/:gameId')
  async getGameById(@Param('gameId', QuizGameIdValidationPipe) gameId: string, @Req() req: AccessTokenVrifyModel) {
    return await this.quizGamesQueryRepository.getGameById(gameId, req.user.userId)
  }

  @Get('users/my-statistic')
  async getMyStatistic(@Req() req: AccessTokenVrifyModel) {
    return await this.quizGamesQueryRepository.getMyStatistic(req.user.userId)
  }
}