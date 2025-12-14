import TextWithShadow from "../TextWithShadow";
import { ShopItem } from "./config";

function ComboCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      style={{ aspectRatio: '16/7' }}
      onClick={onPurchase}
    >
      <img
        src={item.image}
        alt="Combo"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {item.tag && (
        <div className={`absolute top-3 right-3 ${item.tagColor} text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg`}>
          {item.tag}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center px-5">
        <div className="flex flex-col gap-1">
          <TextWithShadow className="text-white text-2xl font-bold">
            {item.description}
          </TextWithShadow>

          <button
            className="flex items-center justify-center gap-2 mt-3 px-6 py-2 
              active:scale-95 transition-transform bg-no-repeat bg-center"
            style={{
              backgroundImage: "url('/ui/Button/Green_.Png')",
              backgroundSize: '100% 100%',
              minWidth: '120px',
              maxWidth: '160px',
              minHeight: '45px'
            }}
          >
            <TextWithShadow className="text-white font-bold text-lg">
              {item.price}
            </TextWithShadow>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComboCard;