import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminApi.dashboard()).data,
  });

  const cards = [
    { label: 'Users', value: stats?.users, color: 'text-blue-400' },
    { label: 'Content', value: stats?.content, color: 'text-v-orange' },
    { label: 'Categories', value: stats?.categories, color: 'text-green-400' },
    { label: 'Watch Sessions', value: stats?.watchHistory, color: 'text-purple-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-v-muted mb-8">Overview of your V19+ platform</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-v-raised rounded-xl p-6 border border-v-divider">
            <p className="text-sm text-v-muted mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.color}`}>
              {isLoading ? '—' : card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
