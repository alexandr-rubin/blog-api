import { UUID } from 'crypto';

export class SQLBlog {
  id!: UUID
  name!: string
  description!: string
  websiteUrl!: string
  createdAt!: string
  isMembership!: boolean
  userId!: string
  banInfo!: {
    isBanned: boolean,
    banDate: string | null
  }
}