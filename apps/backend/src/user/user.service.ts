import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        subscription: {
          select: { plan: true, status: true, currentPeriodEnd: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }

  async listProfiles(userId: string) {
    return this.prisma.profile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createProfile(userId: string, data: { name: string; avatarColor?: string; isKids?: boolean; pin?: string }) {
    const count = await this.prisma.profile.count({ where: { userId } });
    if (count >= 5) {
      throw new BadRequestException('Maximum 5 profiles allowed');
    }

    return this.prisma.profile.create({
      data: { userId, ...data },
    });
  }

  async deleteProfile(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({ where: { id: profileId, userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    await this.prisma.profile.delete({ where: { id: profileId } });
    return { message: 'Profile deleted' };
  }

  async listDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async registerDevice(userId: string, data: { deviceName: string; deviceType: string; ipAddress: string }) {
    return this.prisma.device.create({
      data: {
        userId,
        deviceName: data.deviceName,
        deviceType: data.deviceType,
        ipAddress: data.ipAddress,
      },
    });
  }

  async deleteDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, userId } });
    if (!device) throw new NotFoundException('Device not found');
    await this.prisma.device.delete({ where: { id: deviceId } });
    return { message: 'Device revoked' };
  }
}
