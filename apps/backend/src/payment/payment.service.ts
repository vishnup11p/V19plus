import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async listPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevenueAnalytics() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      paymentCount: payments.length,
      history: payments,
    };
  }
}
