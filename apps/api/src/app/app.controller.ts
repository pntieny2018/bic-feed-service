import { Controller, Get } from '@nestjs/common';

@Controller({
  path: 'app',
})
export class AppController {
  @Get('health-check')
  public getHealthBeat(): string {
    return 'OK';
  }
}
