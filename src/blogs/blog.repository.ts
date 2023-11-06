import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BlogInputModel } from "./models/input/BlogInputModel";
import { Blog, BlogDocument } from "./models/schemas/Blog";
import { BlogBannedUsers, BlogBannedUsersDocument } from "./models/schemas/BlogBannedUsers";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeleteResult, Repository, UpdateResult } from "typeorm";
import { SQLPostInputModel } from "../posts/models/input/SQLPost";
import { BlogEntity } from "./entities/blog.entity";
import { PostEntity } from "../posts/entities/post.entity";

@Injectable()
export class BlogRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  @InjectModel(BlogBannedUsers.name) private blogBannedUsersModel: Model<BlogBannedUsersDocument>, @InjectDataSource() protected dataSource: DataSource,
  @InjectRepository(BlogEntity) private readonly blogRepository: Repository<BlogEntity>, @InjectRepository(PostEntity) private readonly postRepository: Repository<PostEntity>){}

  // типизация
  async addBlog(blog: Blog): Promise<string> {
    return (await this.blogRepository.save(blog)).id
  }

  async addPostForSpecificBlog(post: SQLPostInputModel): Promise<string>{
    return (await this.postRepository.save(post)).id
  }

  async deleteBlogById(id: string): Promise<DeleteResult> {
    return await this.blogRepository.delete(id)
  }

  async updateBlogById(id: string, blog: BlogInputModel): Promise<UpdateResult> {
    return await this.blogRepository.update( { id: id }, blog)
  }

  async updatePostBlogName(blogId: string, blogName: string): Promise<UpdateResult> {
    return await this.postRepository.update( { blogId: blogId }, {blogName: blogName})
  }

  async deleteBlogsTesting(): Promise<boolean> {
    return await this.dataSource.query(`
    DELETE FROM public."Blogs"
    `)
  }

  async deleteBannedUsersTesting(): Promise<boolean> {
    // const result = await this.blogBannedUsersModel.deleteMany({})
    // return !!result
    return await this.dataSource.query(`
    DELETE FROM public."BlogBannedUsers"
    `)
  }

  async bindBlogWithUser(blogId: string, userId: string): Promise<boolean>{
    const result = await this.blogRepository.update({id: blogId}, {userId: userId})  
    return !!result
  }

  async banOrUnbanBlogById(blogId: string, isBanned: boolean, banDate: string): Promise<UpdateResult> {
    const result = await this.blogRepository.update({id: blogId}, {banInfo: {isBanned: isBanned, banDate: banDate}})
    return result
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