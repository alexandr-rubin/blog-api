import { UUID } from "crypto"

export class SQLPostViewModel {
  id!: UUID
  title!: string
  shortDescription!: string
  content!: string
  blogId!: string
  blogName!: string
  createdAt!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
}