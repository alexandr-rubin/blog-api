import { Prop } from "@nestjs/mongoose"
import { IsString, MaxLength, Matches } from "class-validator"

export class PostForSpecBlogInputModel {
    @IsString()
    @MaxLength(30)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    @Prop()
    title!: string
    @IsString()
    @MaxLength(100)
    @Prop()
    shortDescription!: string
    @IsString()
    @MaxLength(1000)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    @Prop()
    content!: string
}