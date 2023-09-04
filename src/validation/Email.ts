import { IsEmail } from "class-validator";

export class EmailValidation {
  @IsEmail()
  email: string
}