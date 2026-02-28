import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { ServerOptions } from 'socket.io';

export class SocketIoAdapter extends IoAdapter {
  private readonly origin: string | undefined;

  constructor(app: INestApplication, origin?: string) {
    super(app);
    this.origin = origin;
  }

  createIOServer(port: number, options?: ServerOptions) {
    const corsOptions = this.origin
      ? { origin: this.origin, credentials: true, methods: ['GET', 'POST'] }
      : { origin: true, credentials: true };

    const opts: ServerOptions = {
      ...(options || {}),
      cors: {
        ...(options && (options as any).cors),
        ...corsOptions,
      },
    };

    return super.createIOServer(port, opts);
  }
}
