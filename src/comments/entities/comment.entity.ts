import { PostEntity } from "../../posts/entities/post.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { UUID } from "typeorm/driver/mongodb/bson.typings"

@Entity('Comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
  @Column()
  content: string
  @Column('jsonb')
  commentatorInfo: {userId: string, userLogin: string}
  @Column()
  createdAt: string
  @ManyToOne(() => PostEntity)
  post: PostEntity
  @Column('uuid')
  postId: UUID
  @Column('jsonb')
  likesAndDislikesCount: { likesCount: number, dislikesCount: number }
}