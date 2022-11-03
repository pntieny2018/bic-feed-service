import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadService } from '../upload';
import { UploadDto, UploadType } from '../upload/dto/requests/upload.dto';
import { APP_VERSION } from '../../common/constants';
import { MediaService } from './media.service';
import { AuthUser, UserDto } from '../auth';
import { MediaHelper } from './media.helper';
import { MediaStatus } from '../../database/models/media.model';
import { ValidatorException } from '../../common/exceptions';
import { WHITE_LIST_MIME_TYPE_IMAGE } from './media.constants';

@ApiTags('Media')
@ApiSecurity('authorization')
@Controller({
  path: 'media',
  version: APP_VERSION,
})
export class MediaController {
  public constructor(private _uploadService: UploadService, private _mediaService: MediaService) {}
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!WHITE_LIST_MIME_TYPE_IMAGE.includes(file.mimetype)) {
          return cb(new ValidatorException(`Unsupported mimetype ${file.mimetype}`), false);
        }
        cb(null, true);
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload',
    type: UploadDto,
  })
  public async create(
    @AuthUser() user: UserDto,
    @UploadedFile() file: Express.Multer.File,
    @Body('upload_type') uploadType: UploadType
  ): Promise<any> {
    const url = await this._uploadService.upload(file, uploadType);

    let width = 0;
    let height = 0;
    if (file.mimetype.includes('image') || file.mimetype.includes('video')) {
      const des = await MediaHelper.getDimensions(file.buffer);
      width = des.width;
      height = des.height;
    }
    const result = await this._mediaService.create(user, {
      url,
      name: url.split('/').pop(),
      uploadType,
      originName: file.originalname,
      extension: file.mimetype.split('/').pop(),
      width,
      height,
      size: file.size ?? 0,
      status: MediaStatus.COMPLETED,
      mimeType: file.mimetype,
    });
    return result.toJSON();
  }
}
