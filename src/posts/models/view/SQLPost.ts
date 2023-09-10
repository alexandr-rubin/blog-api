import { UUID } from "crypto"
import { PostLike } from "../schemas/Post"

export class SQLPostViewModel {
  id!: UUID
  title!: string
  shortDescription!: string
  content!: string
  blogId!: string
  blogName!: string
  createdAt!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
  likesAndDislikes!: PostLike[]
}