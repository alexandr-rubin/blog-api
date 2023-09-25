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
    // const newBlog = new this.blogModel(blog)
    // await newBlog.save()
    // return newBlog
    // const newBlog = await this.dataSource.query(`
    // INSERT INTO public."Blogs"(
    //   id, name, description, "websiteUrl", "createdAt", "isMembership", "userId", "banInfo")
    //   VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)
    //   RETURNING id
    // `,
    // [
    //   blog.name,
    //   blog.description,
    //   blog.websiteUrl,
    //   blog.createdAt,
    //   blog.isMembership,
    //   blog.userId,
    //   blog.banInfo
    // ])

    // return newBlog[0].id
    return (await this.blogRepository.save(blog)).id
  }

  async addPostForSpecificBlog(post: SQLPostInputModel): Promise<string>{
    //
    // const newPost = await this.postRepository.addPost(post)
    // return newPost
    // const newPost = await this.dataSource.query(`
    // INSERT INTO public."Posts"(
    //   id, title, "shortDescription", content, "blogId", "blogName", "createdAt", "likesAndDislikesCount")
    //   VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)
    //   RETURNING id
    // `,
    // [
    //   post.title,
    //   post.shortDescription,
    //   post.content,
    //   post.blogId,
    //   post.blogName,
    //   post.createdAt,
    //   post.likesAndDislikesCount
    // ])

    // return newPost[0].id
    return (await this.postRepository.save(post)).id
  }

  async deleteBlogById(id: string): Promise<DeleteResult> {
    // const result = await this.blogModel.findByIdAndDelete(id)
    // return !!result
    await this.postRepository
    .createQueryBuilder()
    .delete()
    .where('"blogId" = :id', { id: id })
    .execute()
    // await this.dataSource.query(`
    // DELETE FROM public."Posts"
    // WHERE "blogId" = $1
    // `, [id])
    // const blog = await this.dataSource.query(`
    // DELETE FROM public."Blogs"
    // WHERE id = $1
    // `, [id])
    // return blog[0]
    return await this.blogRepository.delete(id)
  }

  async updateBlogById(id: string, blog: BlogInputModel): Promise<UpdateResult> {
    // const result = await this.blogModel.findByIdAndUpdate(id, blog)
    // return !!result
    // return await this.dataSource.query(`
    // UPDATE public."Blogs"
    // SET
    //   name = $1, description = $2, "websiteUrl" = $3
    // WHERE "id" = $4`,
    // [
    //   blog.name, blog.description, blog.websiteUrl, id
    // ])
    return await this.blogRepository.update( { id: id }, blog)
  }

  async deleteBlogsTesting(): Promise<boolean> {
    // const result = await this.blogModel.deleteMany({})
    // return !!result
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