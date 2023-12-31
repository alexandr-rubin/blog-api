import { UUID } from "crypto";

export class SQLComment {
  id!: UUID
  content!: string
  commentatorInfo!: {userId: string, userLogin: string}
  createdAt!: string
  postId!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
}