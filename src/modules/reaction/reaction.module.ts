import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from '../../config/kafka';
import { DatabaseModule } from '../../database';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { REACTION_SERVICE } from './reaction.constant';
import { ReactionController } from './reaction.controller';
import { CreateReactionService } from './services';
import { CommonReactionService } from './services/common-reaction.service';

const KAFKA_CONFIG = getKafkaConfig();

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    GroupModule,
    ClientsModule.register([
      {
        name: REACTION_SERVICE,
        transport: Transport.KAFKA,
        options: KAFKA_CONFIG,
      },
    ]),
  ],
  controllers: [ReactionController],
  providers: [CreateReactionService, CommonReactionService],
})
export class ReactionModule {}
