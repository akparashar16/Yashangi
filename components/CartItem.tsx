/**
 * Cart Item Component
 * Displays a single item in the shopping cart
 */

'use client';

import React from 'react';
import { CartItem as CartItemType } from '@/models/Cart';
import Image from 'next/image';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (onUpdateQuantity) {
      onUpdateQuantity(item.productId.toString(), newQuantity);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item.productId.toString());
    }
  };

  const subtotal = item.lineTotal || (item.unitPrice * item.quantity);

  return (
    <div className="cart-item flex items-center gap-4 p-4 border-b">
      <div className="product-image relative w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      <div className="product-details flex-grow">
        <h3 className="font-semibold mb-1">{item.productName}</h3>
        {item.size && <p className="text-gray-500 text-xs mb-1">Size: {item.size}</p>}
        <p className="text-gray-600 text-sm mb-2">₹{item.unitPrice.toFixed(2)} each</p>
        
        <div className="flex items-center gap-4">
          <div className="quantity-controls flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="w-8 h-8 rounded border hover:bg-gray-100 transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="w-8 h-8 rounded border hover:bg-gray-100 transition-colors"
            >
              +
            </button>
          </div>

          <span className="font-semibold text-lg">₹{subtotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleRemove}
        className="text-red-600 hover:text-red-800 transition-colors px-2"
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  );
};

export default CartItem;

