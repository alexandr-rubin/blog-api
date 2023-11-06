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

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>, @InjectModel(BlogBannedUsers.name) private blogBannedUsersModel: Model<BlogBannedUsersDocument>,
  @InjectDataSource() protected dataSource: DataSource, @InjectRepository(BlogEntity) private readonly blogRepository: Repository<BlogEntity>){}
  async getBlogs(params: QueryParamsModel, userId: string | null): Promise<Paginator<BlogViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, userId)
    
    // раскомментить когда верну баны
    const transformedBlogs = blogs.filter(blog => !blog.banInfo.isBanned).map(({ userId, banInfo, ...rest }) => ({ id: rest.id, ...rest }))

    const count = await this.countBlogs(query, userId)
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    
    return result
  }

  async getBlogsIds(userId: string | null): Promise<string[]> {
    const blogs = await this.blogModel.find({userId: userId, 'banInfo.isBanned': false})
    const blogIdArray = blogs.map((blog) => (blog._id.toString()))
    
    return blogIdArray
  }

  async getSuperAdminBlogs(params: QueryParamsModel): Promise<Paginator<BlogAdminViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, null)
    const count = await this.countBlogs(query, null)
    const transformedBlogs = blogs.map(({ userId, banInfo, ...rest }) => ({ id: rest.id, ...rest, blogOwnerInfo: {userId: userId, userLogin: null}, 
    /*banInfo: {isBanned: rest.banInfo.isBanned, banDate: rest.banInfo.banDate}*/ }))
    // const transformedBlogs = blogs.map(({ ...rest }) => ({ id: rest.id, ...rest, userId: undefined}))
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    return result
  }

  async getBlogById(blogId: string): Promise<BlogViewModel> {
    const blog = await this.blogRepository.findOneBy({id: blogId})

    if (!blog || blog[0].banInfo.isBanned){
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
    const bannedBlogs = await this.blogModel.find({'banInfo.isBanned': true}, '_id')
    const bannedBlogsIds = bannedBlogs.map(blog => blog._id.toString());
    return bannedBlogsIds
  }

  async getBannedUsersForBlog(params: QueryParamsModel, blogId: string)/*: Promise<Paginator<>>*/ {
    // const blog = await this.blogModel.findById(blogId)
    
    // if(!blog){
    //   throw new NotFoundException()
    // }
    // const query = createPaginationQuery(params)
    
    // // const bannedUsers = blog.blogBannedUsers.filter(user => 
    // //   user.isBanned === true && 
    // //   (query.searchLoginTerm === null || new RegExp(query.searchLoginTerm, 'i').test(user.userLogin))
    // // )

    // const skip = (query.pageNumber - 1) * query.pageSize

    // //fix
    // const bannedUsers = blog.blogBannedUsers
    // .filter(user => 
    // user.isBanned === true && 
    // (query.searchLoginTerm === null || new RegExp(query.searchLoginTerm, 'i').test(user.userLogin))
    // )
    // .sort((a, b) => {
    //   if (query.sortDirection === 'asc') {
    //     return a[query.sortBy] - b[query.sortBy];
    //   } else {
    //     return b[query.sortBy] - a[query.sortBy];
    //   }
    // })
    // .slice(skip, skip + query.pageSize)
    
    // const mappedArray = bannedUsers.map(user => ({
    //   id: user.userId,
    //   login: user.userLogin,
    //   banInfo: {
    //     isBanned: user.isBanned,
    //     banDate: user.banDate,
    //     banReason: user.banReason
    //   }
    // }))

    // const count = blog.blogBannedUsers.filter(user => user.isBanned === true).length

    // const result = Paginator.createPaginationResult(count, query, mappedArray)

    // return result
    
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    const filter = query.searchLoginTerm === null ? {blogId: blogId, isBanned: true} : { userLogin: { $regex: query.searchLoginTerm, $options: 'i' }, isBanned: true}
    const users = await this.blogBannedUsersModel.find(filter, { __v: false })
    .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1}).skip(skip).limit(query.pageSize).lean()

    const mappedUsers = users.map(user => ({
        id: user.userId,
        login: user.login,
        banInfo: {
          isBanned: user.isBanned,
          banDate: user.banDate,
          banReason: user.banReason
        }
    }))

    const count = await this.blogBannedUsersModel.countDocuments({blogId: blogId, isBanned: true})

    const result = Paginator.createPaginationResult(count, query, mappedUsers)
    
    return result
  }

  async getSingleBannedUserForBlog(userId: string, blogId: string): Promise<BlogBannedUsersDocument>{
    const user = await this.blogBannedUsersModel.findOne({userId: userId, blogId: blogId})
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

  // private generateUserIdFilter(query: QueryParamsModel, userId: string | null) {
  //   const filter: any = userId === null ? `WHERE (COALESCE(b."name" ILIKE $1, true))` : `WHERE (COALESCE(b."name" ILIKE $1, true)) AND "userId" = ${userId}`
  //   if (query.searchNameTerm !== null) {
  //     filter.name = { $regex: query.searchNameTerm, $options: 'i' }
  //   }

  //   return filter
  // }
}