import { Prop } from "@nestjs/mongoose"

export class BlogViewModel {
    @Prop()
    id!: string
    @Prop()
    name!: string
    @Prop()
    description!: string
    @Prop()
    websiteUrl!: string
    @Prop()
    createdAt!: string
    @Prop()
    isMembership!: boolean
}