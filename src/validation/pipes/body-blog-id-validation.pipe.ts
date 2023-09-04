// import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
// import { plainToClass } from 'class-transformer';
// import { validate } from 'class-validator';
// import { BlogExistValidator } from '../BlogExistValidator';
// import { PostInputModel } from '../../models/Post';

// @Injectable()
// export class BlogIdForPostValidationPipe implements PipeTransform {
//   constructor(private readonly blogExistValidator: BlogExistValidator) {}

//   async transform(value: any): Promise<PostInputModel> {
//     const postInputModel = plainToClass(PostInputModel, value);

//     const errors = await validate(postInputModel);

//     if (errors.length > 0) {
//       throw new BadRequestException(errors);
//     }

//     const isValid = await this.blogExistValidator.validate(postInputModel.blogId);
//     if (!isValid) {
//       throw new BadRequestException(`Blog with id "${postInputModel.blogId}" does not exist.`);
//     }

//     return postInputModel;
//   }
// }