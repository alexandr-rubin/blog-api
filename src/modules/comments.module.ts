// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Comment, CommentSchema } from '../models/Comment';
// import { CommentController } from '../controllers/comments.controller';
// import { CommentService } from '../domain/comment.service';
// import { CommentQueryRepository } from '../queryRepositories/comment.query-repository';
// import { CommentRepository } from '../repositories/comment.repository';
// import { CommentExistValidator } from '../validation/CommentExistValidator';
// import { JwtAuthService } from '../domain/JWT.service';

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
// ],
//   controllers: [CommentController],
//   providers: [CommentService, CommentQueryRepository, CommentRepository, CommentExistValidator, JwtAuthService],
//   exports: [CommentService, CommentQueryRepository, CommentRepository, CommentExistValidator, MongooseModule],
// })
// export class CommentsModule {}
