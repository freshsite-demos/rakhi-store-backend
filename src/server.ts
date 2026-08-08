import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  // Connect database
  await connectDB();

  // Start listening
  const server = app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err: any) => {
    console.error(`Unhandled Rejection: ${err.message || err}`);
    server.close(() => process.exit(1));
  });
};

startServer();
