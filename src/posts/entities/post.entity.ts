import { BlogEntity } from "../../blogs/entities/blog.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { UUID } from "typeorm/driver/mongodb/bson.typings"

@Entity('Posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: UUID
  @Column()
  title: string
  @Column()
  shortDescription!: string
  @Column()
  content: string
  @ManyToOne(() => BlogEntity)
  blog: BlogEntity
  @Column('uuid')
  blogId: UUID
  @Column()
  blogName: string
  @Column()
  createdAt: string
  @Column('jsonb')
  likesAndDislikesCount: { likesCount: number, dislikesCount: number }
}