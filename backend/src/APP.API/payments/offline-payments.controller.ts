import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../APP.Infrastructure/auth/jwt.service';
import { PaymentsService } from '../../APP.BLL/services/payments.service';
import { ManualPaymentMethod } from '@prisma/client';

class SubmitOfflinePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderNo!: string;

  @IsEnum(ManualPaymentMethod)
  method!: ManualPaymentMethod;

  @IsNumber()
  @Min(1)
  amountBDT!: number;

  @IsString()
  @IsNotEmpty()
  trxId!: string;

  @IsString()
  @IsOptional()
  agentAccount?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class OfflinePaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Backward compatibility: /payments/offline
  @Post('offline')
  async submit(@Body() dto: SubmitOfflinePaymentDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createManualPayment(user.sub, dto);
  }

  // Alias to match older frontend calls: /payments/manual
  @Post('manual')
  async submitAlias(@Body() dto: SubmitOfflinePaymentDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createManualPayment(user.sub, dto);
  }
}


