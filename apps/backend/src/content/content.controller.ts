import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ContentService } from './content.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

/** Extract userId from a Bearer token without hard-failing if absent */
function optionalUserId(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  const token = header.split(' ')[1];
  try {
    const jwtService = new JwtService({});
    const payload = jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_production',
    });
    return payload?.userId as string | undefined;
  } catch {
    return undefined;
  }
}

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ─── Public browsing ──────────────────────────────────────────────────────

  @Get()
  list(
    @Query('type') type?: string,
    @Query('genre') genre?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.listContent({
      type,
      genre,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('featured')
  featured() {
    return this.contentService.getFeatured();
  }

  @Get('trending')
  trending() {
    return this.contentService.getTrending();
  }

  @Get('originals')
  originals() {
    return this.contentService.getOriginals();
  }

  // ─── Authenticated browsing ───────────────────────────────────────────────

  @Get('continue-watching')
  @UseGuards(AuthGuard)
  continueWatching(@CurrentUser('userId') userId: string) {
    return this.contentService.getContinueWatching(userId);
  }

  @Get('recommended')
  @UseGuards(AuthGuard)
  recommended(@CurrentUser('userId') userId: string) {
    return this.contentService.getRecommended(userId);
  }

  // ─── Content detail ───────────────────────────────────────────────────────

  @Get('id/:id/episodes')
  getEpisodes(@Param('id') id: string) {
    return this.contentService.getEpisodes(id);
  }

  /** Slug-based lookup — optionally enriches with user watch progress */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const userId = optionalUserId(req);
    return this.contentService.getBySlug(slug, userId);
  }

  // ─── Admin CRUD ───────────────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: any) {
    if (!body.title || !body.type) {
      throw new BadRequestException('title and type are required');
    }
    return this.contentService.createContent(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.contentService.updateContent(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.contentService.deleteContent(id);
  }
}
