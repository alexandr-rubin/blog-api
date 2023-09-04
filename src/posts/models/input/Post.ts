import { IsString, MaxLength, Matches } from "class-validator"
import { IsBlogIdValid } from "../../../decorators/isBlogIdValid"

export class PostInputModel {
    @IsString()
    @MaxLength(30)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    title!: string
    @IsString()
    @MaxLength(100)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    shortDescription!: string
    @IsString()
    @MaxLength(1000)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    content!: string
    @IsString()
    @IsBlogIdValid({message: 'Blog with id does not exist.'})
    blogId!: string
}