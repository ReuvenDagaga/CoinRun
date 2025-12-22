interface CardStarsProps {
  starLevel: number;
  maxStars?: number;
}

export default function CardStars({ starLevel, maxStars = 3 }: CardStarsProps) {
  const isMaxed = starLevel >= maxStars;

  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: maxStars }).map((_, index) => {
        const isFilled = index < starLevel;

        let starImage = '/ui/cards/star-off.png';
        if (isMaxed) {
          starImage = '/ui/cards/star-red.png';
        } else if (isFilled) {
          starImage = '/ui/cards/star.png';
        }

        return (
          <img
            key={index}
            src={starImage}
            alt={isFilled ? 'filled star' : 'empty star'}
            className="w-5 h-5"
          />
        );
      })}
    </div>
  );
}
