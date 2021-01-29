import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

import Page from './Page';

const p = new Page('https://vk.com/');

// export default async function (url: string): Promise<any> {
async function countWordsOnPage(url: string): Promise<any> {
  await fetch(url)
    .then((r) => r.text())
    .then((content: string) => {
      // parse html text from page
      const root = parse(content, {
        lowerCaseTagName: false,
        comment: false,
        blockTextElements: {
          script: false,
          noscript: false,
          style: false,
          pre: false,
        },
      });
      const html = root.querySelector('html');
      const structuredBody = html.text.split('\n');

      const paragraphsArray = structuredBody.map((el: string) => {
        if (el.trim().length > 0) {
          // remove special chars from each paragraph
          return el
            .trimLeft()
            .trimRight()
            .replace(/[©….,\/#!?$%\^&\*;:{}=\-_`~()+«»]/g, '')
            .toLowerCase();
        }
        return null;
      }).filter(Boolean);

      // create array of words (splitted from paragraphs by space)
      let wordsArray: string[] = [];
      paragraphsArray.forEach((paragraph) => {
        if (paragraph) {
          wordsArray = wordsArray.concat(paragraph.split(' '));
        }
      });
      wordsArray = wordsArray.filter(Boolean);

      // create hash table of words with count (default 0)
      const temp: {[k: string]: any} = {};
      wordsArray.forEach((word: string) => {
        if (!temp[word]) Object.assign(temp, { [word]: 0 });
        temp[word] += 1;
      });

      const top4 = Object.entries(temp)
        .sort((first, second) => second[1] - first[1])
        .slice(0, 4);

      return top4;
    })
    .catch((err: Error) => { console.error(`failed to fetch ${url}:\n${err}`); });
}

countWordsOnPage('https://vk.com/')
  .catch((e) => console.error('Error:', e));