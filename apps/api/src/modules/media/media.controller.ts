import { UserDto } from '@libs/service/user';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { VERSIONS_SUPPORTED } from '../../common/constants';
import { AuthUser } from '../../common/decorators';
import { ValidatorException } from '../../common/exceptions';

import { WHITE_LIST_MIME_TYPE_IMAGE } from './media.constants';

@ApiTags('Media')
@ApiSecurity('authorization')
@Controller({
  path: 'media',
  version: VERSIONS_SUPPORTED,
})
export class MediaController {
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
  })
  public async create(
    @AuthUser() user: UserDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    throw new BadRequestException('Your version no belong supported, please upgrade new version');
  }
}
