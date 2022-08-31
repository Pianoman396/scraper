import { Injectable } from '@nestjs/common';
import { dataScrapOutput } from '../interfaces/dataScrapOutput.interface';
import type { BrowserContext, Page } from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import { InjectPage, InjectContext } from 'nest-puppeteer';
import * as cheerio from 'cheerio';
import { HttpService } from '@nestjs/axios';

const request = require('request');


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
  public links: any[] = [];
  public linksDeep: any[] = [];

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
  async domainScraping(domains) {
    let links = [];
    for (let i = 0; i <= domains.length; i++) {
      domains[i]?._website.forEach((item) => {
        links.push(item);
      });
    }
    let result = await this.crawling(links);
    console.log('You\'r response is in progress <><><><>');
    return 'You\'r response is in progress <><><><>'; //[].concat.apply([], result)
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

  private async clusterForCrawl(url, mainUrl, deep = false) {

    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 2,
    });
    await cluster.task(async ({ page, data: url }) => {
      await page.goto(url);
      const content = await page.content();
      const $ = cheerio.load(content);
      let linkObjects = $('a');
      linkObjects.each((index, element) => {
        if (!$(element).attr('href').includes('#') && $(element).attr('href').includes(url)) {
          let link = this.linkNormalize($(element).attr('href'), url);
          this.checkLinkValidity(link);
          if (this.statusCode == 0) {
            this.checkLinkValidity(link);
          }
          if (deep) {
            if (!this.links.includes(url)) {
              this.linksDeep.push({
                _website: mainUrl,
                _link: link,
                _statusCode: this.statusCode,
              });
            }
          } else {
            this.links.push({
              _website: mainUrl,
              _link: link,
              _statusCode: this.statusCode,
            });
          }
          this.links = this.links.concat(this.linksDeep);
          console.log([].concat.apply([], this.links), '>>>>>>>>>>>>>');
        }
      });
    });
    await cluster.queue(url);

    await cluster.idle();
    await cluster.close();
  }

  private async crawl(url: string) {
    try {
      console.log('Start Crawling ---: ' + url);
      await this.clusterForCrawl(url, url);

      for (let item of this.links) {
        if (item._link.includes(url) && item._link != url) {
          await this.clusterForCrawl(item._link, url, true);
        }
      }

      return this.links.concat(this.linksDeep);
    } catch (e) {
      console.log(e, '******/-/-/-/-/-/-/-******');
    }
  }

  private checkLinkValidity(link) {
    request({
        url: link,
      },
      (error, response, body) => {
        if (response && !error)
          this.statusCode = response.statusCode;
        else
          this.statusCode = 404;
      });
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
