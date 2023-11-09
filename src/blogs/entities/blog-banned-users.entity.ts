import { UserEntity } from "../../users/entities/user.entity"
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
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
  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity
  @Column()
  userId: string
  @Column()
  login: string
  @ManyToOne(() => BlogEntity, {onDelete: 'CASCADE'})
  blog: BlogEntity
  @Column()
  blogId: string
}