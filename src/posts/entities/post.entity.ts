import { BlogEntity } from "../../blogs/entities/blog.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity('Posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string
  @Column()
  title: string
  @Column()
  shortDescription!: string
  @Column()
  content: string
  @ManyToOne(() => BlogEntity, {onDelete: 'CASCADE'})
  blog: BlogEntity
  @Column('uuid')
  blogId: string
  @Column()
  blogName: string
  @Column()
  createdAt: string
  @Column('jsonb')
  likesAndDislikesCount: { likesCount: number, dislikesCount: number }
}