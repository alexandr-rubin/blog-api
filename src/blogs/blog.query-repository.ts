import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { BlogViewModel } from "./models/view/BlogViewModel";
import { Blog, BlogDocument } from "./models/schemas/Blog";
import { BlogBannedUsers, BlogBannedUsersDocument } from "./models/schemas/BlogBannedUsers";
import { DataSource, Repository } from "typeorm";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { BlogEntity } from "./entities/blog.entity";
import { BlogAdminViewModel } from "./models/view/BlogAdminViewModel";
import { BlogBannedUsersEntity } from "./entities/blog-banned-users.entity";

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>, @InjectModel(BlogBannedUsers.name) private blogBannedUsersModel: Model<BlogBannedUsersDocument>,
  @InjectDataSource() protected dataSource: DataSource, @InjectRepository(BlogEntity) private readonly blogRepository: Repository<BlogEntity>,
  @InjectRepository(BlogBannedUsersEntity) private readonly blogBannedUsersRepository: Repository<BlogBannedUsersEntity>){}
  async getBlogs(params: QueryParamsModel, userId: string | null): Promise<Paginator<BlogViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, userId)
    
    const transformedBlogs = blogs.filter(blog => !blog.banInfo.isBanned).map(({ userId, banInfo, ...rest }) => ({ id: rest.id, ...rest }))

    const count = await this.countBlogs(query, userId)
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    
    return result
  }

  async getBlogsIds(userId: string | null): Promise<string[]> {
    const notBannedBlogs = await this.blogRepository
    .createQueryBuilder('blog')
    .select(['blog.id'])
    .where((qb) => {
      qb.andWhere('blog.userId = :userId AND blog.banInfo ->> \'isBanned\' = :isBanned', { isBanned: false })
      if (userId !== null) {
        qb.andWhere('blog.userId = :userId', {
          userId: userId
        })
      }
    })
    .getMany()

    const blogIdArray = notBannedBlogs.map((blog) => (blog.id))
    
    return blogIdArray
  }

  async getSuperAdminBlogs(params: QueryParamsModel): Promise<Paginator<BlogAdminViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, null)
    const count = await this.countBlogs(query, null)
    const transformedBlogs = blogs.map(({ userId, ...rest }) => ({ id: rest.id, ...rest, blogOwnerInfo: {userId: userId, userLogin: null}, 
    /*banInfo: {isBanned: rest.banInfo.isBanned, banDate: rest.banInfo.banDate}*/ }))
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    return result
  }

  async getBlogById(blogId: string): Promise<BlogViewModel> {
    const blog = await this.blogRepository.findOneBy({id: blogId})
    if (!blog || blog.banInfo.isBanned){
      throw new NotFoundException()
    }
    
    const result = {...blog, userId: undefined, banInfo: undefined}
    const id = result.id
    return { id, ...result }
  }

  async getBlogByIdNoView(blogId: string): Promise<Blog | null> {
    const blog = await this.blogRepository.findOneBy({id: blogId})
    
    if(!blog){
      return null
    }
    return blog
  }

  async getBannedBlogsId(): Promise<string[]> {
    const bannedBlogs = await this.blogRepository
    .createQueryBuilder('blog')
    .select(['blog.id'])
    .where('blog."banInfo"->>\'isBanned\' = :isBanned', { isBanned: true })
    .getMany()
    
    const bannedBlogsIds = bannedBlogs.map(blog => blog.id)
    return bannedBlogsIds
  }

  async getBannedUsersForBlog(params: QueryParamsModel, blogId: string)/*: Promise<Paginator<>>*/ {
    
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize

    const users = await this.blogBannedUsersRepository
    .createQueryBuilder('user')
    .select()
    .where((qb) => {
      if (query.searchLoginTerm) {
        qb.andWhere('user.login ILIKE :searchLoginTerm', {
          searchLoginTerm: query.searchLoginTerm ? `%${query.searchLoginTerm}%` : '',
        })
      }
      qb.andWhere('user.blogId = :blogId AND user.isBanned = :isBanned', {blogId: blogId, isBanned: true})
    })
    .orderBy(`"user"."${query.sortBy}" COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    const mappedUsers = users.map(user => ({
        id: user.userId,
        login: user.login,
        banInfo: {
          isBanned: user.isBanned,
          banDate: user.banDate,
          banReason: user.banReason
        }
    }))

    const count = await this.blogBannedUsersRepository
    .createQueryBuilder('user')
    .select()
    .where((qb) => {
      if (query.searchLoginTerm) {
        qb.andWhere('user.login ILIKE :searchLoginTerm', {
          searchLoginTerm: query.searchLoginTerm ? `%${query.searchLoginTerm}%` : '',
        })
      }
      qb.andWhere('user.blogId = :blogId AND user.isBanned = :isBanned', {blogId: blogId, isBanned: true})
    })
    .getCount()
    
    const result = Paginator.createPaginationResult(count, query, mappedUsers)
    
    return result
  }

  async getSingleBannedUserForBlog(userId: string, blogId: string): Promise<BlogBannedUsersEntity>{
    const user = await this.blogBannedUsersRepository.findOneBy({userId: userId, blogId: blogId})
    return user
  }

  // add filter to params
  private async getBlogsWithFilter(query: QueryParamsModel, userId: string | null): Promise<BlogEntity[]>{
    const skip = (query.pageNumber - 1) * query.pageSize

    const blogs = await this.blogRepository
    .createQueryBuilder('blog')
    .select()
    .where((qb) => {
      if (userId === null && query.searchNameTerm !== null) {
        qb.andWhere('blog.name ILIKE :searchNameTerm', {
          searchNameTerm: query.searchNameTerm ? `%${query.searchNameTerm}%` : ''
        })
      }
      else if(userId !== null && query.searchNameTerm !== null) {
        qb.andWhere(`blog.name ILIKE :searchNameTerm AND blog.userId = :userId`, {
          searchNameTerm: query.searchNameTerm ? `%${query.searchNameTerm}%` : '',
          userId: userId
        })
      }
      else if(userId !== null && query.searchNameTerm === null){
        qb.andWhere(`blog.userId = :userId`, {
          userId: userId
        })
      }
    })
    .orderBy(`blog.${query.sortBy} COLLATE "C"`, query.sortDirection === 'asc' ? 'ASC' : 'DESC')
    .skip(skip)
    .take(query.pageSize)
    .getMany()

    return blogs
  }

  private async countBlogs(query: QueryParamsModel, userId: string | null): Promise<number> {

    const builder = this.blogRepository.createQueryBuilder('blog')
      .select('COUNT(*)', 'count')
      .where((qb) => {
        if (userId === null) {
          qb.andWhere('(COALESCE(blog."name" ILIKE :searchNameTerm, true))', {
            searchNameTerm: query.searchNameTerm ? `%${query.searchNameTerm}%` : null,
          })
        }
        else {
          qb.andWhere('(COALESCE(blog."name" ILIKE :searchNameTerm, true) AND blog.userId = :userId)', {
            searchNameTerm: query.searchNameTerm ? `%${query.searchNameTerm}%` : null,
            userId: userId
          })
        }
      })

    const result = await builder.getRawOne()
    return +result.count
  }
}