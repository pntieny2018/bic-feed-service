import models from './models';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { IDatabaseConfig } from '../config/database';

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
          models: models,
          define: {
            underscored: true,
            timestamps: true,
            schema: databaseConfig.schema,
          },
          logging: true,
          benchmark: true,
          logQueryParameters: true,
          native: databaseConfig.ssl,
          ssl: databaseConfig.ssl,
          pool: databaseConfig?.pool,
        };
      },
    }),
    SequelizeModule.forFeature(models),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
