import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

import Page from './src/Page';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('index', { title: 'Lad TZ' });
});

app.post('/gettop', (req, res, next) => {
  const { urlsInput } = req.body;

  const urls = urlsInput.trim().split(',');

  Promise.all(
    urls.map(async (url: string) => (
      { [url]: await new Page(url).getTopNWords(3) })),
  )
    .then(res.send)
    .catch(next);
});

const server = app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

function handleShutDown(signal: string) {
  console.error(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.error('HTTP server closed');
  });
}

process.on('SIGINT', handleShutDown);
process.on('SIGTERM', handleShutDown);
