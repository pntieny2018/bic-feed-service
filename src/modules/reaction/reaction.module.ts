import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from 'src/config/kafka';
import { DatabaseModule } from 'src/database';
import { UserModule } from 'src/shared/user';
import { REACTION_SERVICE } from './reaction.constant';
import { ReactionController } from './reaction.controller';
import { CreateReactionService, DeleteReactionService } from './services';

const KAFKA_CONFIG = getKafkaConfig();

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ClientsModule.register([
      {
        name: REACTION_SERVICE,
        transport: Transport.KAFKA,
        options: KAFKA_CONFIG,
      },
    ]),
  ],
  controllers: [ReactionController],
  providers: [CreateReactionService, DeleteReactionService],
})
export class ReactionModule {}
