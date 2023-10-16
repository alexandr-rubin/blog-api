import { IsBoolean } from "class-validator";

export class PublishUnpublishQuestionInputModel {
  @IsBoolean()
  published: boolean
}