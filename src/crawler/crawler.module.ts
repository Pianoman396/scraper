import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { PuppeteerModule } from 'nest-puppeteer';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PuppeteerModule.forFeature(),
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    })
  ],
  controllers: [],
  providers: [CrawlerService, ],
  exports: [CrawlerService, ]
})
export class CrawlerModule {}
