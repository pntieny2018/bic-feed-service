import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';
import { GiphyController } from './driving-adapter/controller/giphy.controller';
import { giphyProvider } from './provider/giphy.provider';

@Module({
  imports: [HttpModule],
  controllers: [GiphyController],
  providers: [...giphyProvider],
})
export class GiphyModuleV2 {}
