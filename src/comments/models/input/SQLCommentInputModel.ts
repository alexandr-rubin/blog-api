export class SQLCommentInputModel {
  content!: string
  userId: string
  userLogin: string
  createdAt!: string
  postId!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
}