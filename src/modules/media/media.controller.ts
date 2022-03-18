import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from '../upload';
import { UploadDto, UploadType } from '../upload/dto/requests/upload.dto';
import { APP_VERSION } from '../../common/constants';
import { MediaService } from './media.service';
import { AuthUser, UserDto } from '../auth';
import { ResponseMessages } from '../../common/decorators';

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
        fileSize: 10 * 1024 * 1024,
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
    @Body('uploadType') uploadType: UploadType
  ): Promise<any> {
    const url = await this._uploadService.upload(file, uploadType);
    return this._mediaService.create(user, url, 'image');
  }

  @ApiOperation({ summary: 'Delete Media' })
  @ApiBadRequestResponse({
    description: 'Delete media fails',
  })
  @ApiOkResponse({
    description: 'Delete media successfully',
  })
  @Delete('/:mediaId')
  @ResponseMessages({
    success: 'Delete media successfully',
    validator: {
      fails: 'Delete media fails',
    },
  })
  public async destroy(@AuthUser() user: UserDto, @Param('mediaId') mediaId: number): Promise<any> {
    return this._mediaService.destroy(user, mediaId);
  }
}
