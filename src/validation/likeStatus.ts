import { IsEnum, IsString, Matches } from "class-validator";
import { LikeStatuses } from "../helpers/likeStatuses";

export class likeStatusValidation {
  @IsString()   
  @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
  @IsEnum(LikeStatuses, { message: 'Invalid likeStatus value' })
  likeStatus: LikeStatuses
}