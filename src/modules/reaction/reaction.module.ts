import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaConfig } from 'src/config/kafka';
import { DatabaseModule } from 'src/database';
import { REACTION_SERVICE } from './reaction.constants';
import { ReactionController } from './reaction.controller';
import { ReactionService } from './reaction.service';

const KAFKA_CONFIG = getKafkaConfig();

@Module({
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: REACTION_SERVICE,
        transport: Transport.KAFKA,
        options: KAFKA_CONFIG,
      },
    ]),
  ],
  controllers: [ReactionController],
  providers: [ReactionService],
})
export class ReactionModule {}
