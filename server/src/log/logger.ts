import pino from 'pino';

const transport = 
  pino.transport({
      targets: [
        {
          target: 'pino-pretty',
          level: 'info',
          options: { destination: 1 },
        },
        {
          target: 'pino/file',
          level: 'info',
          options: { destination: './logs/app.log' },
        },
      ],
    })

export const LOGGER = pino({ level: 'debug' }, transport);
