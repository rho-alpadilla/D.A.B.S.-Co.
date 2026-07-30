import { Flower2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const cardStyles = [
  'left-1 top-5 -rotate-[9deg] xl:left-[74px] xl:group-hover:left-0 xl:group-hover:translate-x-0 xl:group-hover:translate-y-0 xl:group-hover:rotate-0',
  'left-1/2 top-12 z-10 -translate-x-1/2 rotate-[2deg] xl:group-hover:-translate-x-1/2 xl:group-hover:translate-y-0 xl:group-hover:rotate-0',
  'right-1 top-7 rotate-[10deg] xl:right-[74px] xl:group-hover:right-0 xl:group-hover:translate-x-0 xl:group-hover:translate-y-0 xl:group-hover:rotate-0',
];

const getProductImage = (product) => product.imageUrls?.[0] || product.imageUrl || null;

const ArtisanCardStack = ({ recentWorks, isLoading, error, formatPrice }) => {
  if (isLoading) {
    return (
      <div aria-label="Loading recent works" className="h-[360px] w-full max-w-[330px] animate-pulse rounded-[2rem] bg-white/35 sm:h-[400px] sm:max-w-[370px]" />
    );
  }

  if (error || recentWorks.length === 0) {
    return (
      <div className="flex h-[360px] w-full max-w-[330px] items-center justify-center rounded-[2rem] border border-artisan-primary/15 bg-white/65 p-8 text-center text-artisan-text-muted shadow-artisan-card sm:h-[400px] sm:max-w-[370px]">
        Recent works are currently unavailable.
      </div>
    );
  }

  return (
    <div className="group relative mx-auto h-[360px] w-full max-w-[330px] sm:h-[400px] sm:max-w-[370px] xl:h-[340px] xl:max-w-none xl:w-[560px]">
      <div className="absolute inset-0 rounded-full bg-artisan-primary/10 blur-3xl" />

      {recentWorks.map((work, index) => {
        const image = getProductImage(work);
        const cardClassName = cardStyles[index] || cardStyles[1];

        return (
          <Link
            key={work.id}
            to={`/product/${work.id}`}
            aria-label={`View recent work: ${work.name}`}
            className={`absolute h-[260px] w-[205px] overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-[#f7f1fb] via-[#e5d0f1] to-[#cba8df] shadow-artisan-lg transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-artisan-primary/40 sm:h-[290px] sm:w-[230px] xl:h-[250px] xl:w-[170px] ${cardClassName}`}
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#ead8f5] via-[#d6b7e8] to-[#c39bdc]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D0E5A]/75 via-[#2D0E5A]/10 to-transparent" />
            <div className="absolute right-5 top-5 h-11 w-11 rounded-md opacity-45 [background-image:repeating-linear-gradient(45deg,#FFFFFF_0,#FFFFFF_1px,transparent_1px,transparent_50%),repeating-linear-gradient(-45deg,#FFFFFF_0,#FFFFFF_1px,transparent_1px,transparent_50%)] [background-size:8px_8px]" />
            <div className="absolute inset-x-5 bottom-5 pr-9 text-white">
              <p className="line-clamp-1 font-artisan-script text-base text-white/85">{work.category || 'Recent work'}</p>
              <p className="mt-1 line-clamp-2 font-artisan-display text-xl font-bold leading-tight">{work.name}</p>
              <p className="mt-1 text-sm font-semibold text-white/90">{formatPrice(work.price)}</p>
            </div>
            <span className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-artisan-primary shadow-artisan-btn transition-transform duration-300 group-hover:scale-110">
              <Flower2 size={18} aria-hidden="true" />
            </span>
          </Link>
        );
      })}

      <div className="absolute left-0 top-0 z-20 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-artisan-primary shadow-artisan-sm backdrop-blur-sm">
        <Flower2 size={16} aria-hidden="true" />
        Recent works
      </div>
    </div>
  );
};

export default ArtisanCardStack;
