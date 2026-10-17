import { useOutletContext } from 'react-router'
import type { RestaurantSettings } from '../api/types'

export interface SellerOutletContext {
  restaurant: RestaurantSettings
  setRestaurant: (restaurant: RestaurantSettings) => void
}

/** Restaurante do vendedor, carregado uma vez pelo SellerLayout e compartilhado com as páginas. */
export const useSellerRestaurant = () => useOutletContext<SellerOutletContext>()
