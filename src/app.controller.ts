import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { dataScrapInput } from './interfaces/dataScrapInput.interface';
import { CrawlerService } from './crawler/crawler.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly crawlerService: CrawlerService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('domains')
 async scrapDomains ( @Body('_websites') data: dataScrapInput ) {
    console.log(data, '<<<<<<<');
    return this.crawlerService.domainScraping(data);
  }

}
