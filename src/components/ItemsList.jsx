// src/components/ItemsList.jsx
import { useItems, useDeleteItem } from '../api/items';

const ItemsList = () => {
  const { data: items, isLoading } = useItems({ 
    status: 'found' 
  });
  const deleteItem = useDeleteItem();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <button onClick={() => deleteItem.mutate(item.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};