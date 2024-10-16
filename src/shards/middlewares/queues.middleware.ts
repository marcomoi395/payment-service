import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ConnectionOptions, Queue } from 'bullmq';

export function queueUIMiddleware(connection: ConnectionOptions) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = [`bot-TELEGRAM`, `bot-DISCORD`, 'webhook'].map(
    (queueName) =>
      new BullMQAdapter(
        new Queue(queueName, {
          connection,
        }),
      ),
  );
  createBullBoard({
    queues,
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
