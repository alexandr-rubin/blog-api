import { Prop, Schema } from "@nestjs/mongoose"

@Schema()
export class CommentLike {
  @Prop()
  userId!: string
  @Prop()
  addedAt!: string
  @Prop()
  likeStatus!: string
}