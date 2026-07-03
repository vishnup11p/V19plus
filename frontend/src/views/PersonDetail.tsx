import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { searchApi } from '../api/search';
import { ContentCard } from '../components/content/ContentCard';
import { Content } from '../api/content';
import { Skeleton } from '../components/ui/Skeleton';

interface PersonInfo {
  name: string;
  photoUrl?: string;
  roles: string[];
}

export function PersonDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonInfo | null>(null);
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      if (!name) return;
      setLoading(true);
      try {
        const { data } = await searchApi.person(name);
        setPerson(data.person);
        setItems(data.items);
      } catch {
        setPerson(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonDetails();
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-n-bg pt-28 px-4 md:px-12 animate-pulse">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
          <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-1/3 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-n-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-2xl font-bold text-n-white mb-2">Person not found</h1>
          <p className="text-n-muted mb-6">Could not retrieve details for this person.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-n-white text-black font-bold rounded hover:bg-n-white/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-n-bg pt-28 pb-16 px-4 md:px-12 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 mb-12">
        {/* Photo */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-n-surface border-4 border-n-divider shadow-xl flex-shrink-0">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-black text-n-muted bg-n-raised">
              {person.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 mt-2">
          <h1 className="text-4xl md:text-5xl font-black text-n-white mb-2">{person.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
            {person.roles.map((role) => (
              <span
                key={role}
                className="text-xs uppercase tracking-wider px-3 py-1 rounded bg-v-orange/10 border border-v-orange/20 text-v-orange font-bold"
              >
                {role}
              </span>
            ))}
          </div>
          <p className="text-sm text-n-muted">Starred in {items.length} title{items.length !== 1 ? 's' : ''} on V19+</p>
        </div>
      </div>

      {/* Filmography List */}
      <div>
        <h2 className="text-xl font-bold text-n-white mb-6">Starred In</h2>
        {items.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
            {items.map((item) => (
              <ContentCard key={item.id} content={item} size="sm" />
            ))}
          </div>
        ) : (
          <p className="text-n-muted">No titles found for this person.</p>
        )}
      </div>
    </div>
  );
}
