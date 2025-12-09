import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from = process.env.RESEND_FROM || 'Pet Koi <onboarding@resend.dev>';

  async sendEmail(params: { to: string; subject: string; text: string; html?: string }) {
    if (!this.apiKey) {
      this.logger.error('RESEND_API_KEY is not set');
      throw new InternalServerErrorException('Email service not configured');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend send failed: ${res.status} ${body}`);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}

