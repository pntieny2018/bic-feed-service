import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UploadService } from '../upload';
import { UploadDto, UploadType } from '../upload/dto/requests/upload.dto';
import { APP_VERSION } from '../../common/constants';
import { MediaService } from './media.service';
import { AuthUser } from '../auth';
import { MediaHelper } from './media.helper';
import { MediaStatus } from '../../database/models/media.model';
import { ValidatorException } from '../../common/exceptions';
import { WHITE_LIST_MIME_TYPE_IMAGE } from './media.constants';
import { UserDto } from '../v2-user/application';
import { ObjectHelper } from '../../common/helpers';

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
    const test = [
      {
        type: 'p',
        align: 'start',
        children: [
          {
            text: 'Chúng tôi kỳ vọng phương án này vừa đáp ứng được yêu cầu xét công nhận tốt nghiệp, đánh giá chất lượng dạy và học; vừa đủ độ tin cậy để các cơ sở giáo dục đại học dùng điểm thi tốt nghiệp để xét tuyển.',
          },
        ],
        id: 'dqpes4ghd66VZd1YBJUIU',
      },
      {
        type: 'img',
        url: 'https://i1-vnexpress.vnecdn.net/2023/03/30/chuong-6876-1680142384.jpg?w=680&h=0&q=100&dpr=1&fit=crop&s=WsXOwmNEyxJqy7JUwsFdsw',
        children: [{ text: '' }],
        id: 'IOdvD2C4vf1MLo2sC8CdG',
      },
      { type: 'p', children: [{ text: '\n' }], id: 'SwHrejDYWyWweE7EYyTiW' },
      { type: 'p', id: 'qZXDhlaLyOP0w_UvSZ9fU', children: [{ text: '' }] },
      {
        type: 'table',
        children: [
          {
            type: 'tr',
            children: [
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: '8MZm9pXBfcQPerqaVyi9i' }],
                id: 'aK_k_0J0RnbtsY8uiZ8YH',
              },
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: 'H2ca3WAlo3w9Gw-HXIXF4' }],
                id: 'EUEWUg3eIrNMZigcWOQnl',
              },
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: 'VGTe43k7t3dMXrwZdmRef' }],
                id: '66drNR-gNAZ4wQmu3EmeH',
              },
            ],
            id: 'mgOYT2qiIw2sLyKclqa9P',
          },
          {
            type: 'tr',
            children: [
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: '8MLaZowtMtQahzYwM1M5c' }],
                id: 'RHucNCGVUobtA198dLAeF',
              },
              {
                type: 'td',
                children: [
                  { type: 'p', children: [{ text: '' }], id: 'NBJWYgB4xh8g77aVaRAiT' },
                  { type: 'p', children: [{ text: '' }], id: 'yMk3Z9GN2FL_mnlKyWR_m' },
                  {
                    type: 'img',
                    url: 'https://bic-dev-user-upload-images-s3-bucket.s3.ap-southeast-1.amazonaws.com/post/original/d12efac5-9534-4267-b9df-56d129330901.jpg',
                    children: [{ text: '' }],
                    id: 'v_KFpJwziSWLgkKev2CLy',
                  },
                  { type: 'p', children: [{ text: '' }], id: '-vnhI8YcjclOaviU6VUxj' },
                ],
                id: 'NR2tka0CnIn77yRX5HQlg',
              },
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: 'Ese2-f5iG0VVXLTNvvBJb' }],
                id: 'UdFbjkMCEdzCZtJYqH0v0',
              },
            ],
            id: '1o5DThp2rttnxp-VFzZF_',
          },
          {
            type: 'tr',
            children: [
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: 'du34m-qs8R2EAoxPyRPHV' }],
                id: 'zCCQNnM3ciYrsy7JOq9Da',
              },
              {
                type: 'td',
                children: [{ type: 'p', children: [{ text: '' }], id: 'XLilhVCtb3sw7cWOGugdx' }],
                id: 'f-ICzaiF6qUnEiTPrRF4b',
              },
              {
                type: 'td',
                children: [
                  { type: 'p', children: [{ text: '' }], id: 'HylfUojG-Qmfzk2RMbhIe' },
                  {
                    type: 'img',
                    url: 'https://google.com/2222',
                    children: [{ text: '' }],
                    id: '-gVq9wTVoveISRdWlhJTS',
                  },
                  { type: 'p', children: [{ text: '' }], id: '-DnnEubXbKX3PhJzAjELj' },
                ],
                id: 'ga3uES9QYd01HXoCM8A9d',
              },
            ],
            id: 'fX8WBktfjjn0j-xuayCq7',
          },
        ],
        id: 'xtcs5j3tP2ckCt4fl2qBu',
      },
      { type: 'p', children: [{ text: '' }], id: 'b6sv-eJVg6eh2YAsMUru5' },
      { type: 'p', id: 'zxBPw9-BuRCVrU2W73l4T', children: [{ text: '' }] },
      {
        type: 'img',
        url: 'https://bic-dev-user-upload-images-s3-bucket.s3.ap-southeast-1.amazonaws.com/post/original/98909a70-36ed-4dca-ad73-bd6665ff0fec.jpg',
        children: [{ text: '' }],
        id: 'iZKf1oK8i_-rBLyb_bTC1',
      },
      { type: 'p', children: [{ text: '' }], id: '33F8Wio86wOjA5HFaeR6V' },
    ];

    const urlImages = ObjectHelper.nodeToUrlImages({ children: test });

    const availableUrlImages = urlImages
      .filter((image) =>
        image.url.includes(`bic-dev-user-upload-images-s3-bucket.s3.ap-southeast-1`)
      )
      .map((image) => {
        const identifyChar = 'post/original/';
        const offsetUUID = image.url.indexOf(identifyChar);
        const uuidLength = 36;
        const newId = image.url.substring(
          offsetUUID + identifyChar.length,
          offsetUUID + identifyChar.length + uuidLength
        );
        return {
          id: newId,
          plateId: image.plateId,
        };
      });

    return availableUrlImages;
  }
}
