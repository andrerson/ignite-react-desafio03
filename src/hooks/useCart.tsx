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

      if(existProduct >= 0){

        const newCart = cart.map(product => {
          if(product.id === productId){
            
            if((product.amount+1) > productStock[productId]){
              toast.error('Quantidade solicitada fora de estoque');
              return product
            }else {
              return {
                ...product,
                amount: ++product.amount
              }
            }
          } else {
            return product
          }
        })

        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        return 
      }

      if(productStock[productId] === 0){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      await api.get(`products/${productId}`)
      .then(response => {
        setCart([...cart,{
          ...response.data, 
          amount: 1
        }])
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart,{
          ...response.data, 
          amount: 1
        }]))
      })

    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const filteredProduct = cart.filter(product => product.id !== productId);

      setCart(filteredProduct)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProduct))
    } catch {
      // TODO
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

      
        console.log(amount, '>' ,productStockUpdate[productId])

        if(amount > productStockUpdate[productId]){
          toast.error('Quantidade solicitada fora de estoque')
          return
        } else {
          console.log(amount, '>' ,productStockUpdate[productId])
          const updateCart = cart.map( produtct => produtct.id === productId ? {
            ...produtct,
            amount
          }: produtct)
            
          // const updateCart = cart.filter(product => product.id === productId
          //   ? {...product, amount: !amount}
          //   : product
          // )

          console.log(updateCart, 'andersonkk')

          setCart(updateCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
        }
        


      // cart.forEach(product => {
      //   if(product.id === productId){
      //     if((product.amount+1) > amount){
      //       toast.error('Quantidade solicitada fora de estoque')
      //     } else {

      //       const updateCart = cart.map( produtct => produtct.id === productId ? {
      //         ...produtct,
      //         amount: ++produtct.amount
      //       }: produtct)

      //       setCart(updateCart)
      //       localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      //     }
      //   }
      // })
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
