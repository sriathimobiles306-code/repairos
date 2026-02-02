
import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../../shared/auth/auth.guard';
import { User } from '../../shared/auth/user.decorator';
import { UserContext } from '../../shared/auth/auth.types';
import { CreateOrderDto } from './orders.dto';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    async createOrder(@User() user: UserContext, @Body() dto: CreateOrderDto) {
        if (!user || !user.tenantId) throw new BadRequestException('User context missing');
        return this.ordersService.createOrder(user.tenantId, dto);
    }
}
