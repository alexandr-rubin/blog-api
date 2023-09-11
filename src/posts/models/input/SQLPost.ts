export class SQLPostInputModel {
  title!: string
  shortDescription!: string
  content!: string
  blogId!: string
  blogName!: string
  createdAt!: string
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
}