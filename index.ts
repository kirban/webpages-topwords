import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import pug from 'pug';
import pdf from 'html-pdf';

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
    .then(async (r) => {
      const template = await pug.renderFile('./views/stats.pug', { data: r });
      const options = {
        height: '11.25in',
        width: '8.5in',
        header: {
          height: '20mm',
        },
        footer: {
          height: '20mm',
        },
      };
      // eslint-disable-next-line consistent-return
      pdf.create(template, options).toStream((err, stream): void => {
        if (err) return res.end(err.stack);
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="stats.pdf"');
        stream.pipe(res);
      });
    })
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
