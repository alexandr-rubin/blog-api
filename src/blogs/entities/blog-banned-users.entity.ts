import { UserEntity } from "../../users/entities/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { BlogEntity } from "./blog.entity"

@Entity('BlogBannedUsers')
export class BlogBannedUsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  isBanned: boolean
  @Column()
  banReason: string
  @Column()
  banDate: string
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column()
  userId: string
  @Column()
  login: string
  @ManyToOne(() => BlogEntity, {onDelete: 'CASCADE'})
  blog: BlogEntity
  @Column()
  blogId: string
  @Column()
  createdAt: string
}