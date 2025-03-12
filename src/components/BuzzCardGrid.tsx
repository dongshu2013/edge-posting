import BuzzCard, { BuzzCardProps } from "./BuzzCard";

interface BuzzCardGridProps {
  cards: BuzzCardProps[];
}

export function BuzzCardGrid({ cards }: BuzzCardGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-y-12 gap-x-16">
      {cards.map((card) => (
        <div
          key={card.id}
          className="w-full min-w-[400px] transition-transform duration-200 hover:scale-[1.01]"
        >
          <BuzzCard {...card} />
        </div>
      ))}
    </div>
  );
}
