import { Controller, Delete, Res } from "@nestjs/common";
import { UserService } from "../users/user.service";
import { HttpStatusCode } from "../helpers/httpStatusCode";
import { Response } from "express";
import { PostService } from "../posts/post.service";
import { BlogService } from "../blogs/blog.service";
import { CommentService } from "../comments/comment.service";
import { SecurityService } from "../security/security.service";
import { QuizQuestionsService } from "../quiz/quiz-questions/quiz-questions.service";

@Controller('testing/all-data')
export class TestingController {
  constructor(private userService: UserService, private postService: PostService, private blogService: BlogService, private commentService: CommentService, 
    private securityService: SecurityService, private quizQuestionsService: QuizQuestionsService){}
  @Delete()
  async deleteAllDataTesting(@Res() res: Response) {
    await this.securityService.deleteAllAPILogsTesting()
    await this.securityService.deleteAllDevicesTesting()
    await this.commentService.deleteCommentTesting()
    await this.postService.deletePostsTesting()
    await this.blogService.deleteBlogsTesting()
    await this.userService.deleteUsersTesting()
    await this.blogService.deleteBannedUsersTesting()
    await this.quizQuestionsService.deleteQuestionsTesting()

    return res.sendStatus(HttpStatusCode.NO_CONTENT_204)  
  }
}