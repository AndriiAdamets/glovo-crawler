// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CrawlerService } from './crawler/crawler.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const crawler = app.get(CrawlerService);
  const url = process.argv[2]; // Get from CLI args
  if (!url) {
    console.error('Usage: npm run start <restaurant_url>');
    process.exit(1);
  }

  await crawler.crawl(url);
  await app.close();
}
bootstrap();
