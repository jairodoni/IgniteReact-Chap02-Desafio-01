import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = (await api.get<Stock>(`stock/${productId}`)).data;

      if(stock.amount > 0) {
        const filterCartForAdd = cart.find(product => product.id === productId);

        if(filterCartForAdd){
          updateProductAmount({ productId, amount: filterCartForAdd.amount + 1});
          return;

        }
      
        const productSelected = (await api.get(`/products/${productId}`)).data;
        
        const newCart = [...cart, {...productSelected,   amount: 1}];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));        
        
        setCart(newCart);
        toast.success('Produto adicionado!!!');
      }else{
        toast.error('Produto fora de estoque');
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const productExists = cart.some(product => product.id === productId);
      
      if(!productExists){
        toast.error('Erro na remoção do produto');
        return;
      }

      const filterCartForRemove = cart.filter(product => product.id !== productId);
      setCart(filterCartForRemove)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filterCartForRemove))
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };
 
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if( amount < 1) return;

      const stock = (await api.get<Stock>(`/stock/${productId}`)).data;
      
      if(amount <= stock.amount) {
   
        const updateCart = cart.map(product => {
          if(product.id === productId) {
              product.amount = amount;
          }
          return product
        })
        
        await setCart([...updateCart])
        await localStorage.setItem('@RocketShoes:cart', JSON.stringify([...updateCart]))
        
      }else{
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
