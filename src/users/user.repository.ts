import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { LoginValidation } from "../validation/login";
import { User, UserDocument } from "./models/schemas/User";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { SQLUser } from "./models/view/SQLUserView";

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>, @InjectDataSource() protected dataSource: DataSource){}
  //типизация
  async createUser(newUser: User) {
    // const user = new this.userModel(newUser)
    // const save = (await user.save()).toJSON()
    // return save
    const user = await this.dataSource.query(`
    INSERT INTO public."Users"(
      id, login, password, email, "createdAt", "confirmationEmail", "confirmationPassword", role, "banInfo")
    VALUES (
      uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8
    )
    RETURNING id`,
    [
      newUser.login,
      newUser.password,
      newUser.email,
      newUser.createdAt,
      newUser.confirmationEmail,
      newUser.confirmationPassword,
      newUser.role,
      newUser.banInfo
    ]);

    return user[0].id
  }

  async deleteUserById(id: string) {
    await this.dataSource.query(`
    DELETE FROM public."Devices"
    WHERE "userId" = $1
    `, [id])
    const user = await this.dataSource.query(`
    DELETE FROM public."Users"
    WHERE id = $1
    `, [id])
    return user[0]
    // const result = await this.userModel.findByIdAndDelete(id)
    // return !!result
  }
  //
  async deleteUsersTesting(): Promise<boolean> {
    // const result = await this.userModel.deleteMany({})
    // return !!result
    return await this.dataSource.query(`
    DELETE FROM public."Users"
    `)
  }

  async updateConfirmation(user: SQLUser): Promise<User> {
    // const result = await user.save()
    // return result.toJSON()
    return await this.dataSource.query(`
    UPDATE public."Users"
    SET
      "confirmationEmail" = jsonb_set("confirmationEmail", '{isConfirmed}', $1)
    WHERE "id" = $2`,
    [
      JSON.stringify(user.confirmationEmail.isConfirmed), user.id
    ]);
  }

  async updateConfirmationCode(user: SQLUser): Promise<SQLUser> {
    // const result = await user.save()
    // return result.toJSON()
    return await this.dataSource.query(`
    UPDATE public."Users"
    SET
      "confirmationEmail" = jsonb_set(
        jsonb_set("confirmationEmail", '{confirmationCode}', $1),
        '{expirationDate}', $2
      )
    WHERE "id" = $3`,
    [
      JSON.stringify(user.confirmationEmail.confirmationCode),
      JSON.stringify(user.confirmationEmail.expirationDate),
      user.id
    ]);
  }
  async updateconfirmationPasswordData(user: SQLUser): Promise<User> {
    // const result = await user.save()
    // return result.toJSON()
    return await this.dataSource.query(`
    UPDATE public."Users"
    SET
      "confirmationPassword" = jsonb_set(
        jsonb_set("confirmationPassword", '{confirmationCode}', $1),
        '{expirationDate}', $2
      )
    WHERE "id" = $3`,
    [
      JSON.stringify(user.confirmationPassword.confirmationCode),
      JSON.stringify(user.confirmationPassword.expirationDate),
      user.id
    ]);
  } 

  async updatePassword(password: string, code: string): Promise<boolean> {
    // const result = await this.userModel.updateOne({'confirmationPassword.confirmationCode': code}, {password: password})
    // return result.modifiedCount === 1
    return await this.dataSource.query(`
    UPDATE public."Users"
    SET
      password = $1
    WHERE "confirmationPassword"->>'confirmationCode' = $2`,
    [
      password, code
    ])
  }

  async verifyUser(loginData: LoginValidation): Promise<SQLUser | null> {
    //return await this.userModel.findOne({$or: [{login: loginData.loginOrEmail}, {email: loginData.loginOrEmail}]})
    const user = await this.dataSource.query(`
    SELECT * FROM public."Users"
    WHERE login = $1 OR email = $1
    `, [loginData.loginOrEmail])

    return user[0]
  }

  async banOrUnbanUserById(userId: string, isBanned: boolean, banReason: string, banDate: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndUpdate(userId, {banInfo: {isBanned: isBanned, banDate: banDate, banReason: banReason}})
    return !!result
  }
}