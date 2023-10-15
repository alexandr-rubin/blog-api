import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { QuizQuestionInputModel } from "./quiz-questions/models/input/QuizQuestion";
import { QuizQuestionsService } from "./quiz-questions.service";
import { QuizQuestionsQueryRepository } from "./quiz-questions.query-repository";
import { QueryParamsModel } from "../models/PaginationQuery";

@UseGuards(BasicAuthGuard)
@Controller('sa/quiz/questions')
export class QuizQuestionsController {
  constructor(private readonly quizQuestionsService: QuizQuestionsService, private readonly quizQuestionsQueryRepository: QuizQuestionsQueryRepository){}

  @HttpCode(HttpStatusCode.CREATED_201)
  @Post()
  async createQuestion(@Body() question: QuizQuestionInputModel) {
    return await this.quizQuestionsService.addQuestion(question)
  }

  @Get()
  async getQuestions(@Query() params: QueryParamsModel) {
    const questions = await this.quizQuestionsQueryRepository.getQuestions(params)
    return questions
  }
}