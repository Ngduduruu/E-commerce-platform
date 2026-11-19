"use client";

import { useEffect } from "react";
import { clearCart } from "@/app/actions";

// Cookies can't be modified while rendering a page, so the success page
// clears the cart through a Server Action once it has loaded.
export function ClearCart() {
  useEffect(() => {
    void clearCart();
  }, []);
  return null;
}
