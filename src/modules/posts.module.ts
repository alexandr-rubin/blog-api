// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { PostsController } from '../controllers/posts.controller';
// import { PostService } from '../domain/post.service';
// import { Post, PostSchema } from '../models/Post';
// import { PostQueryRepository } from '../queryRepositories/post.query-repository';
// import { PostRepository } from '../repositories/post.repository';
// import { PostExistValidator } from '../validation/PostExistValidator';
// import { BlogsModule } from './blogs.module';
// import { CommentsModule } from './comments.module';
// import { JwtAuthService } from '../domain/JWT.service';
// import { IsBlogIdValidConstraint } from 'src/decorators/IsBlogIdValid';

// @Module({
//   imports: [
//     BlogsModule,
//     CommentsModule,
//     MongooseModule.forFeature([{ name: Post.name, schema: PostSchema },]),
// ],
//   controllers: [PostsController],
//   providers: [PostService, PostQueryRepository, PostRepository, PostExistValidator, JwtAuthService, IsBlogIdValidConstraint],
//   exports: [PostService, PostQueryRepository, PostRepository, PostExistValidator, MongooseModule],
// })
// export class PostsModule {}
