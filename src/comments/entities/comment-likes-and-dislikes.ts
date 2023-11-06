import { UserEntity } from "../../users/entities/user.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { CommentEntity } from "./comment.entity"

@Entity('CommentLikesAndDislikes')
export class CommentLikesAndDislikesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @ManyToOne(() => UserEntity, {onDelete: 'CASCADE'})
  user: UserEntity
  @Column('uuid')
  userId: string
  @Column()
  addedAt: string
  @Column()
  likeStatus: string
  @ManyToOne(() => CommentEntity, {onDelete: 'CASCADE'})
  comment: CommentEntity
  @Column('uuid')
  commentId: string
}