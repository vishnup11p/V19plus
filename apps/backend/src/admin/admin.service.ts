import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ContentService } from '../content/content.service';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly contentService: ContentService,
  ) {}

  async getDashboard() {
    const [users, content, categories, watchHistory] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.content.count(),
      this.prisma.category.count(),
      this.prisma.watchHistory.count(),
    ]);
    return { users, content, categories, watchHistory };
  }

  getSettings() {
    return this.settingsService.getSettings();
  }

  updateSettings(data: Parameters<SettingsService['updateSettings']>[0]) {
    return this.settingsService.updateSettings(data);
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createCategory(data: { name: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    const slug = slugify(data.name);
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });
    if (existing) throw new ConflictException('Category already exists');

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug,
        icon: data.icon || '🎬',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCategory(
    id: string,
    data: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean },
  ) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) updateData.slug = slugify(data.name);

    return this.prisma.category.update({ where: { id }, data: updateData });
  }

  async removeCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
      },
    });
  }

  async updateUserRole(userId: string, role: string) {
    if (!['USER', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Invalid role');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  async listContent() {
    const items = await this.prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cast: { take: 2 },
        genres: { include: { genre: true } },
        _count: { select: { seasons: true } },
      },
    });

    return items.map((c) => ({
      ...c,
      genre: c.genres ? c.genres.map((g) => g.genre.name) : [],
      genres: undefined,
    }));
  }

  createContent(data: Record<string, unknown>) {
    return this.contentService.createContent(data);
  }

  updateContent(id: string, data: Record<string, unknown>) {
    return this.contentService.updateContent(id, data);
  }

  deleteContent(id: string) {
    return this.contentService.deleteContent(id);
  }
}
