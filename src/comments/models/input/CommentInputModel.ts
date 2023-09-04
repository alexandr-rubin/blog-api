import { Prop } from "@nestjs/mongoose";
import { IsString, Length } from "class-validator";

export class CommentInputModel {
    @IsString()
    @Length(20, 300)
    @Prop()
    content!: string
  }