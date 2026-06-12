import prisma from '../../config/db';

const DEFAULTS = {
  id: 'default',
  siteName: 'V19+',
  tagline: 'Stream Unlimited',
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: '#FF6B1A',
  footerText: '© 2026 V19+. All rights reserved.',
};

export async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: DEFAULTS });
  }
  return settings;
}

export async function updateSettings(data: Partial<typeof DEFAULTS>) {
  return prisma.siteSettings.upsert({
    where: { id: 'default' },
    create: { ...DEFAULTS, ...data },
    update: data,
  });
}
