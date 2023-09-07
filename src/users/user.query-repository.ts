import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Paginator } from "../models/Paginator";
import { QueryParamsModel } from "../models/PaginationQuery";
import { createPaginationQuery } from "../helpers/pagination";
import { User, UserDocument } from "./models/schemas/User";
import { BlogAdminViewModel } from "../blogs/models/view/BlogAdminViewModel";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { SQLUser } from "./models/view/SQLUserView";

@Injectable()
export class UserQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, @InjectDataSource() protected dataSource: DataSource){}
  async getUsers(params: QueryParamsModel): Promise<Paginator<User>> {
    //
    const query = createPaginationQuery(params)
    const skip = (query.pageNumber - 1) * query.pageSize
    //
    const search : any = {}
    if(query.searchLoginTerm != null){
      search.login = {$regex: query.searchLoginTerm, $options: 'i'}
    }
    if(query.searchEmailTerm != null){
      search.email = {$regex: query.searchEmailTerm, $options: 'i'}
    }
    // if(query.banStatus != null && query.banStatus === "banned"){
    //   search["banInfo.isBanned"] = true
    // }
    // if(query.banStatus != null && query.banStatus === "notBanned"){
    //   search["banInfo.isBanned"] = false
    // }

    // const searchTermsArray = Object.keys(search).map(key => ({ [key]: search[key] }))
    // const users = await this.userModel.find({$or: searchTermsArray.length === 0 ? [{}] : searchTermsArray}, { password: false, confirmationEmail: false, confirmationPassword: false, __v: false, role: false, banInfo: {_id: false} })
    // .sort({[query.sortBy]: query.sortDirection === 'asc' ? 1 : -1})
    // .skip(skip).limit(query.pageSize).lean()

    const users: User[] = await this.dataSource.query(`
    SELECT id, login, email, "createdAt" FROM public."Users" u
    WHERE (COALESCE(u."login" ILIKE $1, true) OR COALESCE(u."email" ILIKE $2, true))
    ORDER BY u."${query.sortBy}" COLLATE "C" ${query.sortDirection}
    OFFSET $3
    LIMIT $4
    `, [query.searchLoginTerm ? `%${query.searchLoginTerm}%` : null, query.searchEmailTerm ? `%${query.searchEmailTerm}%` : null, skip, query.pageSize])
    
    const transformedUsers = users.map((user) => {
      const { ...rest } = user
      const id = 'zxc'
      return { id, ...rest }
    })

    // const count = await this.userModel.countDocuments({$or: searchTermsArray.length === 0 ? [{}] : searchTermsArray})
    const count = await this.dataSource.query(`
      SELECT COUNT(*) FROM public."Users" u
      WHERE (COALESCE(u."login" ILIKE $1, true) OR COALESCE(u."email" ILIKE $2, true))
    `,[query.searchLoginTerm ? `%${query.searchLoginTerm}%` : null, query.searchEmailTerm ? `%${query.searchEmailTerm}%` : null])

    const result = Paginator.createPaginationResult(+count[0].count, query, transformedUsers)
    
    return result
  }

  async getUsergByIdNoView(userId: string): Promise<User | null> {
    // const user = await this.userModel.findById(userId, { __v: false }).lean()
    const user: SQLUser = await this.dataSource.query(`
    SELECT * FROM public."Users"
    WHERE id = $1
    `, [userId])
    if(!user[0]){
      return null
    }
    return user[0]
  }

  async findUserByConfirmationEmailCode(code: string): Promise<SQLUser | null>{
    // const user = await this.userModel.findOne({'confirmationEmail.confirmationCode': code})
    // return user
    const user: SQLUser = await this.dataSource.query(`
    SELECT * FROM public."Users"
    WHERE "confirmationEmail"->>'confirmationCode' = $1
    `, [code]);

    return user[0]
  }

  async findUserByConfirmationPasswordCode(code: string): Promise<SQLUser | null>{
    // const user = await this.userModel.findOne({'confirmationPassword.confirmationCode': code})
    // return user
    const user = await this.dataSource.query(`
    SELECT * FROM public."Users"
    WHERE "confirmationPassword"->>'confirmationCode' = $1
    `, [code]);

    return user[0]
  }

  async getUsergByEmail(email: string): Promise<SQLUser | null> {
    // const user = await this.userModel.findOne({email: email})
    const user = await this.dataSource.query(`SELECT * FROM public."Users" 
    WHERE email = $1`, [email])
    if(!user[0]){
      return null
    }
    return user[0]
  }

  // rename method
  async getUsersForAdminBlogs(blogs: BlogAdminViewModel[]) {
    for(const blog of blogs){
      const user = await this.getUsergByIdNoView(blog.blogOwnerInfo.userId)
      if(!user){
        throw new NotFoundException() 
      }

      blog.blogOwnerInfo.userLogin = user.login
    }

    return blogs
  }

  async getUsergByLogin(login: string): Promise<SQLUser | null> {
    // const user = await this.userModel.findOne({login: login})
    const user = await this.dataSource.query(`SELECT * FROM public."Users" 
    WHERE login = $1`, [login])
    if(!user[0]){
      return null
    }
    return user[0]
  }

  async getBannedUsersId(): Promise<string[]> {
    const bannedUsers = await this.userModel.find({'banInfo.isBanned': true}, '_id')
    const bannedUserIds = bannedUsers.map(user => user._id.toString());
    return bannedUserIds
  }
}