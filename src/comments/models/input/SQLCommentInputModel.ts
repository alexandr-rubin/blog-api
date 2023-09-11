export class SQLCommentInputModel {
  content!: string
  commentatorInfo!: {userId: string, userLogin: string}
  createdAt!: string
  postId!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
}