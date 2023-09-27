import { UserEntity } from "../../users/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { CommentEntity } from "./comment.entity"

@Entity('CommentLikesAndDislikes')
export class CommentLikesAndDislikesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @ManyToOne(() => UserEntity)
  user: UserEntity
  @Column('uuid')
  userId: string
  @Column()
  addedAt: string
  @Column()
  likeStatus: string
  @ManyToOne(() => CommentEntity)
  comment: CommentEntity
  @Column('uuid')
  commentId: string
}