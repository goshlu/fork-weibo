import type { ServerResponse } from 'node:http';

import type { NotificationView } from './interaction.types.js';

type StreamConnection = {
  response: ServerResponse;
  heartbeat: NodeJS.Timeout;
};

export class NotificationStreamHub {
  private readonly connections = new Map<string, Set<StreamConnection>>();

  constructor(private readonly heartbeatMs = 25000) {}

  addConnection(userId: string, response: ServerResponse): void {
    const heartbeat = setInterval(() => {
      this.sendEvent(response, 'heartbeat', { ts: new Date().toISOString() });
    }, this.heartbeatMs);

    const connection: StreamConnection = { response, heartbeat };
    const bucket = this.connections.get(userId) ?? new Set<StreamConnection>();
    bucket.add(connection);
    this.connections.set(userId, bucket);

    response.on('close', () => {
      this.removeConnection(userId, connection);
    });

    this.sendEvent(response, 'connected', { userId, ts: new Date().toISOString() });
  }

  publishNotification(userId: string, notification: NotificationView): void {
    const bucket = this.connections.get(userId);
    if (!bucket) return;

    const payload = { eventId: notification.id, notification };
    for (const connection of bucket) {
      this.sendEvent(connection.response, 'notification.created', payload, notification.id);
    }
  }

  private removeConnection(userId: string, connection: StreamConnection): void {
    clearInterval(connection.heartbeat);
    const bucket = this.connections.get(userId);
    if (!bucket) return;
    bucket.delete(connection);
    if (!bucket.size) {
      this.connections.delete(userId);
    }
  }

  private sendEvent(response: ServerResponse, event: string, data: unknown, id?: string): void {
    if (response.writableEnded || response.destroyed) {
      return;
    }

    if (id) {
      response.write(`id: ${id}\n`);
    }
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
