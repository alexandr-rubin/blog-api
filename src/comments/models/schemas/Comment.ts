import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { CommentLike } from "./CommentLike";

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class Comment {
  @Prop()
  content!: string
  @Prop({type: {
    userId: String,
    userLogin: String
  }})
  commentatorInfo!: {userId: string, userLogin: string}
  @Prop()
  createdAt!: string
  @Prop()
  postId!: string
  @Prop({type: {
    likesCount: Number, 
    dislikesCount: Number
  }})
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
  @Prop({ default: () => [] })
  likesAndDislikes!: CommentLike[]
}

export const CommentSchema = SchemaFactory.createForClass(Comment)