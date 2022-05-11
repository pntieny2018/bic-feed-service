import { Controller } from '@nestjs/common';
import { ProcessVideoResponseDto } from './dto';
import { EVENTS } from '../../../common/constants';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateVideoPostService } from './create-video-post.service';

@Controller()
export class CreateVideoPostController {
  public constructor(private readonly _createVideoPostService: CreateVideoPostService) {}
  @EventPattern(EVENTS.BEIN_UPLOAD.VIDEO_HAS_BEEN_PROCESSED)
  public async createVideoPostDone(
    @Payload('value') processVideoResponseDto: ProcessVideoResponseDto
  ): Promise<void> {
    return this._createVideoPostService.publishOrRejectVideoPost(processVideoResponseDto);
  }
}
