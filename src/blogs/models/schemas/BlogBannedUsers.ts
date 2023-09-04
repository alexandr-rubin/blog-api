import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type BlogBannedUsersDocument = HydratedDocument<BlogBannedUsers>;

@Schema()
export class BlogBannedUsers {
  @Prop()
  isBanned!: boolean
  @Prop()
  banReason!: string
  @Prop()
  banDate!: string
  @Prop()
  userId!: string
  @Prop()
  login!: string
  @Prop()
  blogId!: string
}

export const BlogBannedUsersSchema = SchemaFactory.createForClass(BlogBannedUsers)