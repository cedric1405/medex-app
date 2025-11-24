// CartTotal.jsx
import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';

const CartTotal = ({ totalAmount }) => {
  const { currency, delivery_fee } = useContext(ShopContext);
  const total = totalAmount || 0;
  
  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Title text1={'CART'} text2={'TOTALS'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between dark:text-gray-300'>
          <p>Subtotal</p>
          <p>{currency} {total.toFixed(2)}</p>
        </div>
        <hr className='dark:border-gray-700' />
        <div className='flex justify-between dark:text-gray-300'>
          <p>Shipping Fee</p>
          <p>{currency} {delivery_fee.toFixed(2)}</p>
        </div>
        <hr className='dark:border-gray-700' />
        <div className='flex justify-between font-bold dark:text-white'>
          <b>Total</b>
          <b>{currency} {(total + delivery_fee).toFixed(2)}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;