import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema()
export class Post {
  @Prop()
  title!: string
  @Prop()
  shortDescription!: string
  @Prop()
  content!: string
  @Prop()
  blogId!: string
  @Prop()
  blogName!: string
  @Prop()
  createdAt!: string
  // _id
  @Prop({type: {
    likesCount: Number, 
    dislikesCount: Number
  }})
  likesAndDislikesCount!: { likesCount: number, dislikesCount: number }
  @Prop({ default: () => [] })
  likesAndDislikes!: PostLike[]
}

export class PostLike {
  @Prop()
  userId!: string
  @Prop()
  login!: string
  @Prop()
  addedAt!: string
  @Prop()
  likeStatus!: string
}

export const PostSchema = SchemaFactory.createForClass(Post)