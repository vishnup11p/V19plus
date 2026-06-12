import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  getHistory(@CurrentUser('userId') userId: string) {
    return this.contentService.getHistory(userId);
  }

  @Get(':contentId')
  getProgress(
    @CurrentUser('userId') userId: string,
    @Param('contentId') contentId: string,
    @Query('episodeId') episodeId?: string
  ) {
    return this.contentService.getProgress(userId, contentId, episodeId);
  }

  @Post()
  upsert(
    @CurrentUser('userId') userId: string,
    @Body() body: { contentId: string; episodeId?: string; progress: number; completed?: boolean }
  ) {
    return this.contentService.upsertHistory(userId, body);
  }

  @Delete(':contentId')
  remove(
    @CurrentUser('userId') userId: string,
    @Param('contentId') contentId: string
  ) {
    return this.contentService.removeFromHistory(userId, contentId);
  }
}
