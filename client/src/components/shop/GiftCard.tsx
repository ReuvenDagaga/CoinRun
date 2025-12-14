import TextWithShadow from "../TextWithShadow";
import { ShopItem } from "./config";

function GiftCard({ item, onPurchase }: { item: ShopItem; onPurchase: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      style={{ aspectRatio: '16/7' }}
      onClick={onPurchase}
    >
      <img
        src={item.image}
        alt="Gift"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex items-center justify-between px-5">
        <div className="flex flex-col gap-1">
          <TextWithShadow className="text-white text-2xl font-bold">
            {item.description}
          </TextWithShadow>

          <button
            className="flex items-center gap-2 mt-5 px-6 py-2 
              active:scale-95 transition-transform bg-no-repeat bg-center"
            style={{
              backgroundImage: "url('/ui/Button/Green_.Png')",
              backgroundSize: '100% 100%',
              minWidth: '100px',
              maxWidth: '160px',
              minHeight: '45px'
            }}
          >
            <img
              src="/ui/AdVideo.Png"
              alt=""
              className="w-5 h-5 object-contain"
            />
            <TextWithShadow className="text-white font-bold text-lg">
              {item.price}
            </TextWithShadow>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GiftCard;