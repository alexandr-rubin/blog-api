import { UserEntity } from "../../users/entities/user.entity"
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { UUID } from "typeorm/driver/mongodb/bson.typings"
import { BlogEntity } from "./blog.entity"

@Entity('BlogBannedUsers')
export class BlogBannedUsersEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
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
  @ManyToOne(() => BlogEntity)
  blog: BlogEntity
  @Column()
  blogId: string
}