import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { QuizQuestionInputModel } from "./quiz-questions/models/input/QuizQuestion";
import { QuizQuestionsService } from "./quiz-questions.service";
import { QuizQuestionsQueryRepository } from "./quiz-questions.query-repository";
import { QueryParamsModel } from "../models/PaginationQuery";
import { QuestionIdValidationPipe } from "../validation/pipes/question-Id-validation.pipe";
import { PublishUnpublishQuestionInputModel } from "./quiz-questions/models/input/publishUnpublishQuestion";

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

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Delete(':questionId')
  async deleteQuestionById(@Param('questionId', QuestionIdValidationPipe) id: string) {
    return await this.quizQuestionsService.deleteQuestionById(id)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':questionId')
  async updateQuestionById(@Param('questionId', QuestionIdValidationPipe) id: string, @Body() question: QuizQuestionInputModel) {
    return await this.quizQuestionsService.updateQuestionById(id, question)
  }

  @HttpCode(HttpStatusCode.NO_CONTENT_204)
  @Put(':questionId/publish')
  async publishUnpublishQuestionById(@Param('questionId', QuestionIdValidationPipe) id: string, @Body() publishStatus: PublishUnpublishQuestionInputModel) {
    return await this.quizQuestionsService.publishUnpublishQuestionById(id, publishStatus.published)
  }
}