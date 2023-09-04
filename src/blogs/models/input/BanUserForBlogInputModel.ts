import { IsBoolean, IsString, MinLength } from "class-validator"
import { IsBlogIdValid } from "../../../decorators/isBlogIdValid"

export class BanUserForBlogInputModel {
  @IsBoolean()
  isBanned!: boolean
  @IsString()
  @MinLength(20)
  banReason!: string
  @IsString()
  @IsBlogIdValid({message: 'Blog with id does not exist.'})
  blogId: string
}