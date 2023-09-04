import { IsString, Length } from "class-validator";

export class LoginValidation {
  @IsString()
  loginOrEmail: string
  @IsString()
  @Length(6, 20)
  password: string
}