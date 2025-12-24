import { Controller, Get, Post, Body, Query, UseGuards, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../APP.Infrastructure/auth/jwt.service';
import { PaymentsService } from '../../APP.BLL/services/payments.service';
import { DomainException } from '@APP.Shared/exceptions/domain.exception';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  orderNo!: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  failUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

@Controller('payments/sslcommerz')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async createSession(@Body() body: CreateSessionDto, @CurrentUser() user: JwtPayload) {
    const backend = process.env.BACKEND_URL || 'http://localhost:3001';
    const successUrl = body.successUrl || `${backend}/payments/sslcommerz/success?orderNo=${body.orderNo}`;
    const failUrl = body.failUrl || `${backend}/payments/sslcommerz/fail?orderNo=${body.orderNo}`;
    const cancelUrl = body.cancelUrl || failUrl;
    return this.paymentsService.createSslSession(user.sub, body.orderNo, { successUrl, failUrl, cancelUrl });
  }

  // SSLCommerz will POST to the success/fail URLs; we accept both POST/GET for flexibility.
  @Post('success')
  @Get('success')
  async success(@Query('val_id') valId: string, @Query('tran_id') tranId: string, @Res() res: Response) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.paymentsService.handleSuccess({ val_id: valId, tran_id: tranId });
      return res.redirect(`${frontend}/checkout/success?orderNo=${result.orderNo}`);
    } catch (e) {
      return res.redirect(`${frontend}/checkout/fail`);
    }
  }

  @Post('fail')
  @Get('fail')
  async fail(@Query('tran_id') tranId: string, @Res() res: Response) {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.paymentsService.handleFail({ tran_id: tranId });
      return res.redirect(`${frontend}/checkout/fail?orderNo=${result.orderNo}`);
    } catch (e) {
      return res.redirect(`${frontend}/checkout/fail`);
    }
  }

  @Post('notify')
  async notify(@Body() body: any) {
    // IPN fallback: use val_id if present
    if (body?.val_id) {
      try {
        return await this.paymentsService.handleSuccess({ val_id: body.val_id, tran_id: body.tran_id });
      } catch (e) {
        throw e instanceof DomainException ? e : new DomainException('IPN processing failed', 500);
      }
    }
    throw new DomainException('Invalid IPN payload', 400);
  }
}


