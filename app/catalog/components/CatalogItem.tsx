type CatalogItemProps = {
  item: {
    category: string;
    description: string;
    id: string;
    name: string;
    price: number;
    quantity: number;
    preview: string;
  };
};

const CatalogItem = ({ item }: CatalogItemProps) => {
  return (
    <div className="rounded-lg bg-[#1a1a1a] mb-4 flex flex-col space-x-4 w-fit cursor-pointer flex-1">
      <img src={item.preview} alt={item.name} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="flex-1 p-4">
        <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block text-sm px-3 py-1 rounded-full bg-[#2a2a2a] text-white">{item.category}</span>
        </div>
        <p className="text-gray-300 mb-1">{item.description}</p>
        <div className="flex justify-between">
          <p className="">{item.price} ₸</p>
          <p>{item.quantity}</p>
        </div>
      </div>
    </div>
  )
};

export default CatalogItem;