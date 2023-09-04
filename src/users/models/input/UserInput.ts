import { IsString, Length, Matches } from "class-validator"

export class UserInputModel {
    @IsString()
    @Length(3, 10)
    @Matches(/^[a-zA-Z0-9_-]*$/, {
      message: 'Only alphanumeric characters, underscores, and hyphens are allowed',
    })
    login!: string
    @IsString()
    @Length(6, 20)
    password!: string
    @IsString()
    @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
      message: 'Invalid email format',
    })
    email!: string
  }