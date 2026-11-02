import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

/**
 * CheckoutModal is maintained as a transparent redirect to the full official Checkout page.
 */
export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();

  useEffect(() => {
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
      try {
        window.history.pushState(null, '', '/checkout');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        // iframe fallback
      }
    }
  }, [isCheckoutOpen, setIsCheckoutOpen]);

  return null;
};
