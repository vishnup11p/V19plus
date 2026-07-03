import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PaymentService {
  constructor(private readonly firebase: FirebaseService) {}

  async listPayments(userId: string) {
    const snap = await this.firebase.firestore.collection('payments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
      
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async getRevenueAnalytics() {
    const snap = await this.firebase.firestore.collection('payments')
      .where('status', '==', 'SUCCESS')
      .get();

    const payments = snap.docs.map(d => {
      const data = d.data();
      return { amount: data.amount || 0, createdAt: data.createdAt?.toDate() || new Date() };
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      paymentCount: payments.length,
      history: payments,
    };
  }
}

