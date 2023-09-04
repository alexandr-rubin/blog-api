import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PostRepository } from "../posts/post.repository";
import { BlogInputModel } from "./models/input/BlogInputModel";
import { Blog, BlogDocument } from "./models/schemas/Blog";
import { Post, PostDocument } from "../posts/models/schemas/Post";
import { BlogBannedUsers, BlogBannedUsersDocument } from "./models/schemas/BlogBannedUsers";

@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>, private postRepository: PostRepository,
  @InjectModel(BlogBannedUsers.name) private blogBannedUsersModel: Model<BlogBannedUsersDocument>){}

  // типизация
  async addBlog(blog: Blog){
    const newBlog = new this.blogModel(blog)
    await newBlog.save()
    return newBlog
  }

  async addPostForSpecificBlog(post: Post): Promise<PostDocument>{
    //
    const newPost = await this.postRepository.addPost(post)
    return newPost
  }

  async deleteBlogById(id: string): Promise<boolean> {
    const result = await this.blogModel.findByIdAndDelete(id)
    return !!result
  }

  async updateBlogById(id: string, blog: BlogInputModel): Promise<boolean> {
    const result = await this.blogModel.findByIdAndUpdate(id, blog)
    return !!result
  }

  async deleteBlogsTesting(): Promise<boolean> {
    const result = await this.blogModel.deleteMany({})
    return !!result
  }

  async deleteBannedUsersTesting(): Promise<boolean> {
    const result = await this.blogBannedUsersModel.deleteMany({})
    return !!result
  }

  async bindBlogWithUser(blogId: string, userId: string): Promise<boolean>{
    const result = await this.blogModel.findByIdAndUpdate(blogId, {userId: userId})  
    return !!result
  }

  async banOrUnbanBlogById(blogId: string, isBanned: boolean, banDate: string): Promise<boolean> {
    const result = await this.blogModel.findByIdAndUpdate(blogId, {banInfo: {isBanned: isBanned, banDate: banDate}})
    return !!result
  }

  async banNewUserForBlog(newBannedUserInfo: BlogBannedUsers) {
    const bannedUser = new this.blogBannedUsersModel(newBannedUserInfo)
    await bannedUser.save()
    return bannedUser
  }

  async banExistingUserForBlog(blog: BlogBannedUsersDocument) {
    return await blog.save()
  }
}