import { useRef, useState } from 'react';
import { Content } from '../../api/content';
import { ContentCard } from './ContentCard';
import { ContentRowSkeleton } from '../ui/Skeleton';

interface ContentRowProps {
  title: string;
  items?: Content[];
  historyItems?: { content: Content; progress: number }[];
  isLoading?: boolean;
  showRank?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ContentRow({
  title,
  items,
  historyItems,
  isLoading,
  showRank,
  size = 'md',
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (isLoading) return <ContentRowSkeleton />;

  const hasItems =
    (items && items.length > 0) || (historyItems && historyItems.length > 0);
  if (!hasItems) return null;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 400);
  };

  return (
    <section className="mb-8 group/row">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-12 mb-3">
        <h2 className="text-base md:text-lg font-bold text-n-white hover:text-n-muted cursor-pointer transition-colors flex items-center gap-1 group/title">
          {title}
          <span className="text-n-red opacity-0 group-hover/title:opacity-100 transition-opacity text-sm ml-1">
            Explore All
            <svg className="w-4 h-4 inline-block ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </h2>
      </div>

      {/* Row with arrow buttons */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-n-bg to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <div className="w-8 h-8 rounded-full bg-n-bg/80 border border-n-divider flex items-center justify-center">
              <svg className="w-4 h-4 text-n-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-2 overflow-x-auto px-4 md:px-12 pb-6 pt-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {historyItems?.map((item) => (
            <ContentCard
              key={item.content.id}
              content={item.content}
              progress={item.progress}
              size={size}
            />
          ))}
          {items?.map((item, i) => (
            <ContentCard
              key={item.id}
              content={item}
              rank={showRank ? i + 1 : undefined}
              size={size}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-n-bg to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <div className="w-8 h-8 rounded-full bg-n-bg/80 border border-n-divider flex items-center justify-center">
              <svg className="w-4 h-4 text-n-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
