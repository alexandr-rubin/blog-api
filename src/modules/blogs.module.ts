// import { Module, forwardRef } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { BlogsController } from '../controllers/blogs.controller';
// import { BlogService } from '../domain/blog.service';
// import { Blog, BlogSchema } from '../models/Blogs';
// import { BlogQueryRepository } from '../queryRepositories/blog.query-repository';
// import { BlogRepository } from '../repositories/blog.repository';
// import { BlogExistValidator } from '../validation/BlogExistValidator';
// import { PostsModule } from './posts.module';
// import { BlogIdForPostValidationPipe } from '../validation/pipes/body-blog-id-validation.pipe';
// import { JwtAuthService } from '../domain/JWT.service';
// import { BasicAuthGuard } from '../guards/basic-auth.guard';

// @Module({
//   imports: [
//     //
//     forwardRef(() => PostsModule),
//     MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
// ],
//   controllers: [BlogsController],
//   providers: [BlogService, BlogQueryRepository, BlogRepository, BlogExistValidator, BlogIdForPostValidationPipe, JwtAuthService, BasicAuthGuard],
//   exports: [BlogService, BlogQueryRepository, BlogRepository, BlogExistValidator, BlogIdForPostValidationPipe, MongooseModule],
// })
// export class BlogsModule {}
