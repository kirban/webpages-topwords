import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

export default class Page {
  url: string;

  textContent: string = '';

  words: string[] = [];

  wordsHash: {[key: string]: number} = {};

  constructor(url: string) {
    this.url = url;
  }

  private static async getContent(url: string): Promise<string> {
    try {
      return await fetch(url)
        .then((response) => response.text());
    } catch (e) {
      throw new Error(`Failed to fetch url ${url}:\n ${e}`);
    }
  }

  private async parseContent(): Promise<void> {
    this.textContent = await Page.getContent(this.url);
    const root = parse(this.textContent, {
      lowerCaseTagName: false,
      comment: false,
      blockTextElements: {
        script: false,
        noscript: false,
        style: false,
        pre: false,
      },
    });

    const structuredTextBody: string[] = root.querySelector('html').text.split('\n');

    const paragraphsArray: string[] = structuredTextBody.map((el: string) => {
      if (el.trim().length > 0) {
        // remove special chars from each paragraph
        return el
          .trimLeft()
          .trimRight()
          .replace(/[©….,\\/#!?$%\\^&\\*;:{}=\-_`~()+«»]/g, '')
          .toLowerCase();
      }
      return '';
    }).filter(Boolean);

    // create array of words (splitted from paragraphs by space)
    paragraphsArray.forEach((paragraph) => {
      if (paragraph) {
        this.words = this.words.concat(paragraph.split(' '));
      }
    });
    this.words = this.words.filter(Boolean);

    // create hash table of words with count (default 0)
    this.words.forEach((word: string) => {
      if (word.length > 4) {
        if (!this.wordsHash[word]) Object.assign(this.wordsHash, { [word]: 0 });
        this.wordsHash[word] += 1;
      }
    });
  }

  public async getTopNWords(n: number): Promise<string[]> {
    try {
      await this.parseContent();
    } catch (e) {
      throw new Error(`Failed to parse web page content: ${e}`);
    }
    return Object.entries(this.wordsHash)
      .sort((first, second) => second[1] - first[1])
      .map((el) => el[0])
      .slice(0, n);
  }
}
