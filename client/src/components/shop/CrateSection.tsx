import TextWithShadow from "../TextWithShadow";
import { ShopItem } from "./config";

function CrateSection({
  items,
  backgroundImage
}: {
  items: ShopItem[];
  backgroundImage: string;
}) {
  const handlePurchase = (id: string) => {
    console.log(`Purchase: ${id}`);
  };

  const premiumCrate = items[2];
  const basicCrates = [items[0], items[1]];

  return (
    <section
      className="relative px-4 py-6"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10">
        <div className="flex flex-col gap-3">
          <div
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl bg-gradient-to-b from-red-700 via-red-800 to-red-950 p-4"
            onClick={() => handlePurchase(premiumCrate.id)}
          >
            {premiumCrate.tag && (
              <div className={`absolute top-1 right-3 ${premiumCrate.tagColor} text-white text-sm font-bold py-1 rounded-full shadow-lg z-10`}>
                {premiumCrate.tag}
              </div>
            )}
            <div className="flex flex-col items-center">
              <img
                src={premiumCrate.image}
                alt="Premium Crate"
                className="w-60 h-32 object-contain drop-shadow-2xl"
              />
              <TextWithShadow className="text-white text-xl font-bold mt-2">
                {premiumCrate.description}
              </TextWithShadow>
              <TextWithShadow className="text-yellow-400 text-2xl font-bold mt-1">
                {premiumCrate.price}
              </TextWithShadow>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {basicCrates.map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl p-3 ${
                  index === 0 
                    ? 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900' 
                    : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-800'
                }`}
                onClick={() => handlePurchase(item.id)}
              >
                {item.tag && (
                  <div className={`absolute top-2 right-2 ${item.tagColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10`}>
                    {item.tag}
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <img
                    src={item.image}
                    alt="Crate"
                    className="w-20 h-20 object-contain drop-shadow-xl"
                  />
                  <TextWithShadow className="text-white text-sm font-bold mt-2">
                    {item.description}
                  </TextWithShadow>
                  <TextWithShadow className="text-yellow-400 text-lg font-bold mt-1">
                    {item.price}
                  </TextWithShadow>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CrateSection;