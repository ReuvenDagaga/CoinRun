import TextWithShadow from "../TextWithShadow";
import ButtonSpinner from "../ui/ButtonSpinner";
import { ShopItem } from "./config";

function ShopCard({
  item,
  onPurchase,
  isPurchasing = false
}: {
  item: ShopItem;
  onPurchase: () => void;
  isPurchasing?: boolean;
}) {
  return (
    <div
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-xl"
      onClick={isPurchasing ? undefined : onPurchase}
    >
      {isPurchasing ? (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <ButtonSpinner size="medium" />
        </div>
      ) : (
        <>
          <img
            src={item.image}
            alt="Item"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {item.tag && (
            <div className={`absolute top-2 right-2 ${item.tagColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
              {item.tag}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
            <TextWithShadow className="text-white text-sm font-bold text-center leading-tight">
              {item.description}
            </TextWithShadow>
            <TextWithShadow className="text-yellow-400 text-lg font-bold text-center mt-1">
              {item.price}
            </TextWithShadow>
          </div>
        </>
      )}
    </div>
  );
}

export default ShopCard;