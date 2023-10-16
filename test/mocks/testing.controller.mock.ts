import { Controller, Delete, Res } from "@nestjs/common";
import { Response } from "express";
import { HttpStatusCode } from "../../src/helpers/httpStatusCode";
import { QuizQuestionsServiceMock } from "./quiz-questions.service.mock";

@Controller('testing/all-data')
export class TestingControllerMock {
  constructor(private quizQuestionsService: QuizQuestionsServiceMock){}
  @Delete()
  async deleteAllDataTesting(@Res() res: Response) {
    await this.quizQuestionsService.deleteQuestionsTesting()

    return res.sendStatus(HttpStatusCode.NO_CONTENT_204)  
  }
}