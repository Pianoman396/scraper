import { Injectable } from '@nestjs/common';
import { dataScrapOutput } from '../interfaces/dataScrapOutput.interface';
import type { BrowserContext, Page } from 'puppeteer';

const puppeteer = require('puppeteer');
import { InjectContext } from 'nest-puppeteer';
import { InjectPage } from 'nest-puppeteer';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';


@Injectable()
export class CrawlerService {

  public resultData: dataScrapOutput = {
    _result: {
      _website: [''],
      _link: [''],
      _statusCode: 200,
    },
  };
  public statusCode: number = 0;

  constructor(
    @InjectContext() private readonly browserContext: BrowserContext,
    @InjectPage() private readonly page: Page,
    private readonly httpService: HttpService,
  ) {
  }


  /*
 * Scraping the multiple pages
 * @Param domains - data for crawling
 * @return {
 *   _website
 *   _link
 *   _status
 * }
 * the details in dataScrapOutput interface
 * */
  async domainScraping(domains): Promise<dataScrapOutput> {
    let links = [];
    for (let i = 0; i <= domains.length; i++) {
      domains[i]?._website.forEach((item) => {
        links.push(item);
      });
    }
    let result = await this.crawling(links);
    console.log([].concat.apply([], result), '<><><><>');
    return domains;
  }

  private async crawling(websites) {
    return new Promise((resolve, reject) => {
      try {
        websites.forEach((item) => {
          let dataResult = this.crawl(item);
          dataResult.then((data) => {
            resolve(data);
          }).catch((error) => {
            if (error)
              throw new Error('Can\'t resolve crawling part');
          });
        });
      } catch (e) {
        console.log(e, '<Error>');
        reject(e);
      }
    });
  }

  private async crawl(url: string) {
    try {
      console.log('Start Crawling ---: ' + url);
      const browser = await puppeteer.launch({
        headless: false,
        args: [
          '--disable-gpu',
          //   '--disable-dev-shm-usage',
          //   '--disable-setuid-sandbox',
          //   '--no-first-run',
          //   '--no-sandbox',
          //   '--no-zygote',
          //   '--deterministic-fetch',
          //   '--disable-features=IsolateOrigins',
          //   '--disable-site-isolation-trials',
          // '--single-process',
          '--no-sandbox',
          '--headless',
        ],
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.content();
      const $ = cheerio.load(content);
      const links = [];
      let linkObjects = $('a');
      linkObjects.each((index, element) => {
        if (!$(element).attr('href').includes('#')) {
          let link = this.linkNormalize($(element).attr('href'), url);
          let status = this.checkLinkValidity(link, url);
          links.push({
            _website: url,
            _link: link,
            _statusCode: status,
          });
        }
      });

      try {
        for (let elem of links) {
          if (elem._link.includes(url) && elem !== url) {
            await page.goto(elem._link, { waitUntil: 'networkidle2' });
            let deepContent = await page.content();
            let response = this.checkLinkValidity(elem, url);
            const c$ = cheerio.load(deepContent);
            let linkObjectsDeep = c$('a');
            linkObjectsDeep.each((index, element) => {
              if (!$(element).attr('href').includes('#')) {
                let deepLink = this.linkNormalize($(element).attr('href'), url);
                if (deepLink.includes(url)) {
                  links.push({
                    _website: url,
                    _link: deepLink,
                    _statusCode: response,
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        console.log(e, '--------------------------ERROR---------------------------');
      }

      // console.log(links);
      await browser.close();
      return links;
    } catch (e) {
      console.log(e, '******/-/-/-/-/-/-/-******');
    }
  }

  private async checkLinkValidity(link, url) {

    return await this.httpService.axiosRef.get(link).then(ok => ok.status).catch(err => 404);
    //   .then((ok) => {
    //   this.statusCode = ok.status;
    // }).catch((err) => {
    //   this.statusCode = 404;
    // });
  }

  private linkNormalize(link, url) {
    if (!link.includes(url) && !link.includes('://')) {
      let uri = url[url.length - 1] == '/' ? url.substring(0, url.length - 1) : url;
      let link_url = link[0] == '/' ? link.substring(1) : link;

      return uri[uri.length - 1] != '/' && link[0] != '/' ? uri + '/' + link_url : url + link_url;
    }

    return link;
  }

}
