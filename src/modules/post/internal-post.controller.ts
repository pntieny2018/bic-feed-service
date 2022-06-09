import { Controller, Logger } from '@nestjs/common';
import { PostService } from './post.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPIC } from '../../common/constants';
import { UpdatePrivacyDto } from './dto/requests/update-privacy.dto';

@Controller()
export class InternalPostController {
  private _logger = new Logger(InternalPostController.name);
  public constructor(private _postSevice: PostService) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async privacyUpdate(@Payload('value') updatePrivacyDto: UpdatePrivacyDto): Promise<void> {
    this._logger.debug(`[privacyUpdate]: ${JSON.stringify(updatePrivacyDto)}`);
    const postIds = await this._postSevice.findPostIdsByGroupId([updatePrivacyDto.groupId]);
    await this._postSevice.bulkUpdatePostPrivacy(postIds, updatePrivacyDto.privacy);
  }
}
