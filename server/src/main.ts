import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as compression from "compression";
import helmet from "helmet";

/**
 * 启动应用程序
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全中间件
  app.use(helmet());

  // 压缩中间件
  app.use(compression());

  // 设置全局API前缀
  app.setGlobalPrefix("api");

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger API文档配置
  const config = new DocumentBuilder()
    .setTitle("Monitor Server API")
    .setDescription("轻量级监控数据接收后端系统API文档")
    .setVersion("1.0")
    .addTag("monitor", "监控数据上报接口")
    .addTag("health", "健康检查接口")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Monitor Server is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
