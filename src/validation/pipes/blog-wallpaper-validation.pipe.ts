import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import sharp from 'sharp';
import { AllowedImageFormats } from '../../helpers/allowedImageFormats';
import { BlogAllowedWallpaperResolution } from '../../helpers/blogAllowedWallpaperResolution';

@Injectable()
export class BlogWallpaperValidationPipe implements PipeTransform {

  async transform(value: Express.Multer.File) {
    if (!value) {
      throw new BadRequestException(`No image`)
    }

    let metadata: sharp.Metadata

    try{
      metadata = await sharp(value.buffer).metadata()
    }
    catch (err) {
      throw new BadRequestException(`It's not an image`)
    }
    

    if(!(metadata.format in AllowedImageFormats)){
      throw new BadRequestException(`Invalid image format: ${metadata.format}`)
    }

    // remove magic numbers
    const imageMaxSizeBytes = 100000
    if(metadata.size > imageMaxSizeBytes){
      throw new BadRequestException('Too large image')
    }

    if(metadata.width !== BlogAllowedWallpaperResolution.width){
      throw new BadRequestException(`Width must be ${BlogAllowedWallpaperResolution.width}`)
    }

    if(metadata.height !== BlogAllowedWallpaperResolution.height){
      throw new BadRequestException(`Height must be ${BlogAllowedWallpaperResolution.height}`)
    }

    return metadata
  }
}