import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS = {
  id: 'default',
  siteName: 'V19Plus',
  tagline: 'Stream Unlimited',
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: '#FF6B1A',
  footerText: '© 2026 V19Plus. All rights reserved.',
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await this.prisma.siteSettings.create({ data: DEFAULTS });
    }
    return settings;
  }

  async updateSettings(data: Partial<typeof DEFAULTS>) {
    return this.prisma.siteSettings.upsert({
      where: { id: 'default' },
      create: { ...DEFAULTS, ...data },
      update: data,
    });
  }
}
