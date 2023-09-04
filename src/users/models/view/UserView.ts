import { Prop } from "@nestjs/mongoose"

export class UserViewModel {
  @Prop()
  id!: string
  @Prop()
  login!: string
  @Prop()
  email!: string
  @Prop()
  createdAt!: string
}