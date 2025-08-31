import { Module } from '@nestjs/common';

import { LoggingService } from './logging.service';
import { ProgressService } from '../progress/progress.service';

@Module({
	imports: [],
	providers: [LoggingService, ProgressService],
	exports: [LoggingService, ProgressService],
})
export class LoggingModule {}
