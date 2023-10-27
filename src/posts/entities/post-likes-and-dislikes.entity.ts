import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { PostEntity } from "./post.entity"
import { UserEntity } from "../../users/entities/user.entity"

@Entity('PostLikesAndDislikes')
export class PostLikesAndDislikesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column('uuid')
  userId: string
  @Column()
  login: string
  @Column()
  addedAt: string
  @Column()
  likeStatus: string
  @ManyToOne(() => PostEntity)
  post: PostEntity
  @Column('uuid')
  postId: string
}