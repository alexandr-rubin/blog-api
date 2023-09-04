import { Prop } from "@nestjs/mongoose"
import { IsString, MaxLength, Matches } from "class-validator"

export class BlogInputModel {
    @IsString()
    @MaxLength(15)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    @Prop()
    name!: string
    @IsString()
    @MaxLength(500)
    @Prop()
    description!: string
    @IsString()
    @MaxLength(100)
    @Matches(/^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/, {
    message: 'Invalid website URL format',
    })
    @Prop()
    websiteUrl!: string
}