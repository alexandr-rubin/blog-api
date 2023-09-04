import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { BlogViewModel } from "./models/view/BlogViewModel";
import { Blog, BlogDocument } from "./models/schemas/Blog";
import { BlogAdminViewModel } from "./models/view/BlogAdminViewModel";
import { BlogBannedUsers, BlogBannedUsersDocument } from "./models/schemas/BlogBannedUsers";

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>, @InjectModel(BlogBannedUsers.name) private blogBannedUsersModel: Model<BlogBannedUsersDocument>){}
  async getBlogs(params: QueryParamsModel, userId: string | null): Promise<Paginator<BlogViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, userId)
    
    //
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const transformedBlogs = blogs.filter(blog => !blog.banInfo.isBanned).map(({ _id, userId, banInfo, ...rest }) => ({ id: _id.toString(), ...rest }))

    const count = transformedBlogs.length
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    
    return result
  }

  async getBlogsIds(userId: string | null): Promise<string[]> {
    const blogs = await this.blogModel.find({userId: userId, 'banInfo.isBanned': false})
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const blogIdArray = blogs.map((blog) => (blog._id.toString()))
    
    return blogIdArray
  }

  async getSuperAdminBlogs(params: QueryParamsModel): Promise<Paginator<BlogAdminViewModel>> {
    const query = createPaginationQuery(params)
    const blogs = await this.getBlogsWithFilter(query, null)
    const filter = this.generateFilter(query, null)
    const count = await this.blogModel.countDocuments(filter)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const transformedBlogs = blogs.map(({ _id, userId, ...rest }) => ({ id: _id.toString(), ...rest, blogOwnerInfo: {userId: userId, userLogin: null}, 
    banInfo: {isBanned: rest.banInfo.isBanned, banDate: rest.banInfo.banDate} }))
    const result = Paginator.createPaginationResult(count, query, transformedBlogs)
    return result
  }

  async getBlogById(blogId: string): Promise<BlogViewModel> {
    const blog = await this.blogModel.findById(blogId, { __v: false, userId: false })
    if (!blog || blog.banInfo.isBanned){
      throw new NotFoundException()
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, banInfo, ...rest } = blog.toJSON()
    const id = rest.id
    return { id, ...rest }
  }

  async getBlogByIdNoView(blogId: string): Promise<Blog | null> {
    // to json?
    const blog = await this.blogModel.findById(blogId, { __v: false })
    if (!blog){
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
  private async getBlogsWithFilter(query: QueryParamsModel, userId: string | null){
    const filter = this.generateFilter(query, userId)
    const skip = (query.pageNumber - 1) * query.pageSize
    //
    const blogs = await this.blogModel.find(filter, { __v: false })
    .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    .skip(skip).limit(query.pageSize).lean()

    return blogs
  }

  private generateFilter(query: QueryParamsModel, userId: string | null) {
    const filter: any = userId === null ? {} : {userId: userId}
    if (query.searchNameTerm !== null) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' }
    }

    return filter
  }
}