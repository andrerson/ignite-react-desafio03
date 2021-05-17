import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
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
      // TODO
      const existProduct = cart.findIndex( product => product.id === productId);

      const productStock = await api.get(`stock/${productId}`)
        .then(productStock => {
          return {
            [`${productStock.data.id}`] : productStock.data.amount
          }
        })

      if(productStock[productId] <= 0){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(existProduct >= 0){
        cart.filter(product => {
          if(product.id === productId){

            if(product.amount > productStock[product.id]){
              toast.error('Quantidade solicitada fora de estoque');
              return
            } else {

              if(product.amount+1 > productStock[product.id]){
                toast.error('Quantidade solicitada fora de estoque');
                return
              }
              updateProductAmount({productId: product.id, amount: ++product.amount})
            }
          }
        })
        return 
      }

      await api.get(`products/${productId}`)
      .then(response => {
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart,{
          ...response.data, 
          amount: 1
        }]))

        setCart([...cart,{
          ...response.data, 
          amount: 1
        }])
      })

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      
      const productExist = cart.findIndex(productExist => productExist.id === productId);
      if(productExist <= 0 ){
        throw("");
      }

      const filteredProduct = cart.filter(product => product.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProduct))
      setCart(filteredProduct)
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      const productStockUpdate = await api.get(`stock/${productId}`)
        .then(productStock => {
          return {
            [`${productStock.data.id}`] : productStock.data.amount
          }
        })

      if(amount > productStockUpdate[productId]){
        toast.error('Quantidade solicitada fora de estoque')
        return
      } else {

        if(amount === 0){
          return
        }

        const updateCart = cart.map( produtct => produtct.id === productId ? {
          ...produtct,
          amount
        }: produtct)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
        setCart(updateCart)
      }
    } catch {
      // TODO
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
