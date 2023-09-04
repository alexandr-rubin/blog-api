import { Prop } from "@nestjs/mongoose"

export class CommentViewModel {
    @Prop()
    id!: string
    @Prop()
    content!: string
    @Prop({type: {
      userId: String,
      userLogin: String
    }})
    commentatorInfo!: {userId: string, userLogin: string}
    @Prop()
    createdAt!: string
    @Prop({type: {
      likesCount: Number,
      dislikesCount: Number,
      myStatus: String
    }})
    likesInfo: {likesCount: number, dislikesCount: number, myStatus: string}
  }