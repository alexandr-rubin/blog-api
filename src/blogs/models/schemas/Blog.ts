import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

@Schema()
export class Blog {
  @Prop()
  name!: string
  @Prop()
  description!: string
  @Prop()
  websiteUrl!: string
  @Prop()
  createdAt!: string
  @Prop()
  isMembership!: boolean
  @Prop()
  userId!: string
  @Prop({type: {
    isBanned: Boolean,
    banDate: String
  }})
  banInfo!: {
    isBanned: boolean,
    banDate: string | null
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog)