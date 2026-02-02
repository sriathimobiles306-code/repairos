
export interface OrderItemDto {
    sku_code: string;
    quantity: number;
    price: number;
}

export interface CreateOrderDto {
    customer_name?: string;
    customer_phone?: string;
    items: OrderItemDto[];
}
