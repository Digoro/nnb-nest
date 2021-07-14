import { ImATeapotException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CheckClientVersionMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService
  ) { }

  use(req: Request, res: Response, next: NextFunction) {
    const clientVersion = req.get('X-Client-Version');
    if (!clientVersion || clientVersion === this.configService.get('CLIENT_VERSION')) {
      next();
    }
    else {
      throw new ImATeapotException()
    }
  }
}
