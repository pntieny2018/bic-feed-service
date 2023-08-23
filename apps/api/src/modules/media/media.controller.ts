import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from '../upload';
import { UploadDto, UploadType } from '../upload/dto/requests/upload.dto';
import { VERSIONS_SUPPORTED } from '../../common/constants';
import { MediaService } from './media.service';
import { AuthUser } from '../auth';
import { ValidatorException } from '../../common/exceptions';
import { WHITE_LIST_MIME_TYPE_IMAGE } from './media.constants';
import { UserDto } from '../v2-user/application';

@ApiTags('Media')
@ApiSecurity('authorization')
@Controller({
  path: 'media',
  version: VERSIONS_SUPPORTED,
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
    throw new BadRequestException('Your version no belong supported, please upgrade new version');
  }
}
