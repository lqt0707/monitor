import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SourceCodeParserService } from "./services/source-code-parser.service";
import { SourceMapParserService } from "./services/sourcemap-parser.service";
import { CodeIndexerService } from "./services/code-indexer.service";
import { SourceCodeChunk } from "./entities/source-code-chunk.entity";
import { ProjectIndex } from "./entities/project-index.entity";
import { SourceCodeController } from "./controllers/source-code.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SourceCodeChunk, ProjectIndex])],
  providers: [
    SourceCodeParserService,
    SourceMapParserService,
    CodeIndexerService,
  ],
  controllers: [SourceCodeController],
  exports: [
    SourceCodeParserService,
    SourceMapParserService,
    CodeIndexerService,
  ],
})
export class SourceCodeModule {}
