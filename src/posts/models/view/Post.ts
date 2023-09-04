import { Prop } from "@nestjs/mongoose"

class NewestLikes {
  @Prop()
  addedAt!: string
  @Prop()
  userId!: string
  @Prop()
  login!: string
}

export class PostViewModel {
    @Prop()
    title!: string
    @Prop()
    shortDescription!: string
    @Prop()
    content!: string
    @Prop()
    blogId!: string
    @Prop()
    blogName!: string
    @Prop()
    createdAt!: string
    @Prop({type: {
      likesCount: Number, 
      dislikesCount: Number,
      myStatus: String,
      newestLikes: [NewestLikes]
    }})
    extendedLikesInfo: {likesCount: number, dislikesCount: number, myStatus: string,
      newestLikes: NewestLikes[]}
  }