import { IDatabaseConfig } from '@libs/database/postgres/common';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import { MODEL_CTORS } from './model';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get<IDatabaseConfig>('database');
        return {
          host: databaseConfig.host,
          port: databaseConfig.port,
          dialect: databaseConfig.dialect,
          database: databaseConfig.database,
          username: databaseConfig.username,
          password: databaseConfig.password,
          models: MODEL_CTORS,
          define: {
            underscored: true,
            timestamps: true,
            schema: databaseConfig.schema,
          },
          logging: databaseConfig.isDebug,
          benchmark: true,
          logQueryParameters: true,
          native: databaseConfig.ssl,
          ssl: databaseConfig.ssl,
          pool: databaseConfig?.pool,
        };
      },
    }),
    SequelizeModule.forFeature(MODEL_CTORS),
  ],
  exports: [SequelizeModule],
})
export class PostgresModule {}
