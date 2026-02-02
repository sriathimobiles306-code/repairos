
import { Injectable, Inject, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateOrderDto, OrderItemDto } from './orders.dto';

@Injectable()
export class OrdersService {
    constructor(@Inject('DATABASE_POOL') private pool: Pool) { }

    async createOrder(tenantId: number, dto: CreateOrderDto) {
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Order items cannot be empty');
        }

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            let totalAmount = 0;
            const itemsToInsert: OrderItemDto[] = [];

            // 1. Check Stock & Calculate Total
            for (const item of dto.items) {
                const skuRes = await client.query(`
                    SELECT stock_quantity, glass_marketing_name 
                    FROM tempered_glass_skus 
                    WHERE sku_code = $1
                    FOR UPDATE
                `, [item.sku_code]);

                if (skuRes.rows.length === 0) {
                    throw new BadRequestException(`SKU not found: ${item.sku_code}`);
                }

                const currentStock = skuRes.rows[0].stock_quantity;
                if (currentStock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${item.sku_code}. Available: ${currentStock}, Requested: ${item.quantity}`);
                }

                totalAmount += (item.price * item.quantity);
                itemsToInsert.push(item);
            }

            // 2. Create Order
            const orderRes = await client.query(`
                INSERT INTO orders (tenant_id, customer_name, customer_phone, total_amount, status)
                VALUES ($1, $2, $3, $4, 'COMPLETED')
                RETURNING id, created_at
            `, [tenantId, dto.customer_name || 'Walk-in Customer', dto.customer_phone, totalAmount]);

            const orderId = orderRes.rows[0].id;

            // 3. Insert Items & Deduct Stock
            for (const item of itemsToInsert) {
                await client.query(`
                    INSERT INTO order_items (order_id, sku_code, quantity, price_at_sale)
                    VALUES ($1, $2, $3, $4)
                `, [orderId, item.sku_code, item.quantity, item.price]);

                await client.query(`
                    UPDATE tempered_glass_skus
                    SET stock_quantity = stock_quantity - $1
                    WHERE sku_code = $2
                `, [item.quantity, item.sku_code]);
            }

            await client.query('COMMIT');

            return {
                message: 'Order created successfully',
                order_id: orderId,
                total_amount: totalAmount,
                items_count: itemsToInsert.length
            };

        } catch (e: any) {
            await client.query('ROLLBACK');
            throw new InternalServerErrorException(e.message);
        } finally {
            client.release();
        }
    }
}
