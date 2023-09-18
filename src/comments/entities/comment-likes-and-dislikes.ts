import { UserEntity } from "../../users/user.entity"
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { UUID } from "typeorm/driver/mongodb/bson.typings"
import { CommentEntity } from "./comment.entity"

@Entity('CommentLikesAndDislikes')
export class CommentLikesAndDislikesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
  @OneToOne(() => UserEntity)
  @JoinColumn()
  user: UserEntity
  @Column('uuid')
  userId: UUID
  @Column()
  addedAt: string
  @Column()
  likeStatus: string
  @ManyToOne(() => CommentEntity)
  comment: CommentEntity
  @Column('uuid')
  commentId: UUID
}