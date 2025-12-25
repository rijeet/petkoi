import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../APP.Infrastructure/prisma/prisma.service';
import { SupportTicketStatus, SupportTicketPriority, MessageSenderType } from '../../APP.Shared/dtos/support.dto';

@Injectable()
export class SupportTicketService {
  constructor(private prisma: PrismaService) {}

  private generateTicketNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TICKET-${timestamp}-${random}`;
  }

  async createTicket(userId: string, subject: string, message: string, priority?: SupportTicketPriority) {
    const ticketNo = this.generateTicketNo();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNo,
        userId,
        subject,
        priority: priority || SupportTicketPriority.MEDIUM,
        status: SupportTicketStatus.OPEN,
        messages: {
          create: {
            senderId: userId,
            senderType: MessageSenderType.USER,
            content: message,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    return ticket;
  }

  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        assignedAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketById(ticketId: string, userId?: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        assignedAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    // Check access: user can only see their own tickets, admin can see all
    if (!isAdmin && ticket.userId !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return ticket;
  }

  async addMessage(ticketId: string, senderId: string, content: string, senderType: MessageSenderType) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    // If ticket is closed, only allow reopening with a new message
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Cannot add message to a closed ticket. Please create a new ticket.');
    }

    // If ticket is resolved and user is adding a message, reopen it
    if (ticket.status === SupportTicketStatus.RESOLVED && senderType === MessageSenderType.USER) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: SupportTicketStatus.OPEN },
      });
    }

    // If admin is replying, set status to IN_PROGRESS if it's OPEN
    if (senderType === MessageSenderType.ADMIN && ticket.status === SupportTicketStatus.OPEN) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: SupportTicketStatus.IN_PROGRESS },
      });
    }

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        senderType,
        content,
      },
    });

    // Mark all messages as read for the sender
    await this.prisma.supportMessage.updateMany({
      where: {
        ticketId,
        senderId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return message;
  }

  async getAllTickets(status?: SupportTicketStatus, assignedTo?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    return this.prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest message
        },
        assignedAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicketStatus(ticketId: string, status: SupportTicketStatus, adminId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const updateData: any = {
      status,
    };

    if (status === SupportTicketStatus.RESOLVED && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (status === SupportTicketStatus.OPEN && ticket.resolvedAt) {
      updateData.resolvedAt = null;
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        assignedAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async assignTicket(ticketId: string, adminId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    // Verify admin exists
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: adminId,
        status: ticket.status === SupportTicketStatus.OPEN ? SupportTicketStatus.IN_PROGRESS : ticket.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async updateTicketPriority(ticketId: string, priority: SupportTicketPriority) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { priority },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async markMessagesAsRead(ticketId: string, userId: string, isAdmin: boolean) {
    const where: any = {
      ticketId,
      isRead: false,
    };

    // Mark messages as read that are NOT from the current user/admin
    if (isAdmin) {
      where.senderType = MessageSenderType.USER;
    } else {
      where.senderType = MessageSenderType.ADMIN;
    }

    return this.prisma.supportMessage.updateMany({
      where,
      data: { isRead: true },
    });
  }
}

