import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';         // ou: import * as helmet from 'helmet'
import morgan from 'morgan';         // ou: import * as morgan from 'morgan'
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import type { ErrorRequestHandler } from 'express';

const app: Application = express();

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(helmet());

const allowed = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed, credentials: true } : { origin: true, credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

const jsonSyntaxError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
    return;
  }
  next(err);
};
app.use(jsonSyntaxError);

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
