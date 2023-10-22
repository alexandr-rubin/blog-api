import { IsString, Matches } from "class-validator";

export class AnswerInputModel {
  @IsString()
  @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
  answer: string
}