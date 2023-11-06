import { PostEntity } from "../../posts/entities/post.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity('Comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  content: string
  @Column('jsonb')
  commentatorInfo: {userId: string, userLogin: string}
  @Column()
  createdAt: string
  @ManyToOne(() => PostEntity, {onDelete: 'CASCADE'})
  post: PostEntity
  @Column('uuid')
  postId: string
  @Column('jsonb')
  likesAndDislikesCount: { likesCount: number, dislikesCount: number }
}