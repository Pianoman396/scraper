import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('Should return input objects', () => {
    return request(app.getHttpServer())
      .post('/domains')
      .send({_websites: [{_website: ["https://news.ycombinator.com/"]}, {_website: ["https://techcrunch.com/"]}, {_website: ["https://techwebsite.net/"]} ]})
      .expect(201)
      .expect([{_website: ["https://news.ycombinator.com/"]}, {_website: ["https://techcrunch.com/"]}])
  })

});
