import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PetTagOrderService } from '../../APP.BLL/services/pet-tag-order.service';
import { CreatePetTagOrderDto, UpdatePetTagOrderStatusDto, PetTagOrderStatus } from '../../APP.Shared/dtos/pet-tag.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('pet-tags')
@ApiBearerAuth('JWT-auth')
@Controller('pet-tags')
@UseGuards(JwtAuthGuard)
export class PetTagsController {
  constructor(private readonly petTagOrderService: PetTagOrderService) {}

  @Post('order')
  @ApiOperation({ summary: 'Create a new pet tag order' })
  @ApiBody({ type: CreatePetTagOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or pet has no QR code' })
  @ApiResponse({ status: 403, description: 'User does not own the pet' })
  @ApiResponse({ status: 404, description: 'Pet not found' })
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() createOrderDto: CreatePetTagOrderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.petTagOrderService.createOrder(user.sub, createOrderDto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get all orders for the current user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getMyOrders(@CurrentUser() user: { sub: string }) {
    return this.petTagOrderService.getMyOrders(user.sub);
  }

  @Get('order/:id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'User does not own the order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.petTagOrderService.getOrderById(id, user.sub);
  }

  @Patch('order/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdatePetTagOrderStatusDto })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 403, description: 'User does not own the order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePetTagOrderStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.petTagOrderService.updateOrderStatus(id, updateStatusDto.status, user.sub);
  }
}

