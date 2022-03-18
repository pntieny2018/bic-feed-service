import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from 'src/config/kafka';
import { DatabaseModule } from 'src/database';
import { UserModule } from 'src/shared/user';
import { REACTION_SERVICE } from './reaction.constant';
import { ReactionController } from './reaction.controller';
import { CreateReactionService } from './services';

const KAFKA_CONFIG = getKafkaConfig();

//FIXME: change expose of dtos to snake_case
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
  providers: [CreateReactionService],
})
export class ReactionModule {}
