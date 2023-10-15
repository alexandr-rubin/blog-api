import { IsString, MaxLength, Matches, MinLength, IsArray } from "class-validator"

export class QuizQuestionInputModel {
    @IsString()
    @MinLength(10)
    @MaxLength(500)
    @Matches(/[^ ]+/, { message: 'Name field should not contain only whitespaces' })
    body: string
    @IsArray()
    correctAnswers!: string[]
}