import { HEADER_VERSION_KEY } from '@libs/common/constants';
import { BadRequestException, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import semver from 'semver';

import { MINIMUM_VERSION_SUPPORT, VERSIONS_SUPPORTED } from '../common/constants';

@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    if (!req.headers[HEADER_VERSION_KEY]) {
      req.headers[HEADER_VERSION_KEY] = MINIMUM_VERSION_SUPPORT;
    } else {
      const serviceVersion = req.headers[HEADER_VERSION_KEY] as string;
      const version = serviceVersion.slice(0, -1) + '0'; // 1.4.2 -> 1.4.0
      if (!semver.valid(version)) {
        throw new BadRequestException(`Version ${version} is not valid.`);
      }
      if (semver.lt(version, MINIMUM_VERSION_SUPPORT)) {
        throw new BadRequestException(
          `Version ${version} is not supported. Please use version ${VERSIONS_SUPPORTED[0]} or higher.`
        );
      }
      if (VERSIONS_SUPPORTED.indexOf(version) === -1) {
        throw new NotFoundException(
          `Couldn't find any versions for "${version}". Please use one of the following versions: ${VERSIONS_SUPPORTED.join(
            ', '
          )}`
        );
      }
    }

    next();
  }
}
