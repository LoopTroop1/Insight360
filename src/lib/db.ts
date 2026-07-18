import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaInstance =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

// Central email alert middleware for all notifications
prismaInstance.$use(async (params, next) => {
  const result = await next(params);
  
  if (params.model === 'Notification' && params.action === 'create') {
    try {
      const notification = result;
      // Fetch user details
      const user = await prismaInstance.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true }
      });
      
      if (user && user.email) {
        const { sendEmailAlert } = await import('./mailer');
        const html = `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background: linear-gradient(135deg, #1a3c6e 0%, #1e3a8a 100%); padding: 15px; border-radius: 8px 8px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 18px;">e-Office Pro Notification</h2>
              <span style="font-size: 11px; opacity: 0.8;">NIC Government Collaboration Suite</span>
            </div>
            <div style="padding: 20px; background-color: #ffffff;">
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>An action event has occurred in your e-Office workspace:</p>
              <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #1e3a8a; margin: 15px 0; border-radius: 0 4px 4px 0;">
                <h3 style="margin: 0; color: #1e3a8a; font-size: 15px;">${notification.title}</h3>
                <p style="margin: 10px 0 0 0; color: #334155; font-size: 13px; line-height: 1.5;">${notification.message}</p>
              </div>
              <p style="font-size: 13px; color: #475569;">
                Please log in to your dashboard to review this record and perform the required dispatch or approval steps.
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 11px; color: #64748b;">
              This is an automated system notification from the National Informatics Centre (NIC) e-Office Pro platform. Do not reply directly to this email.
            </div>
          </div>
        `;
        
        // Dispatch asynchronously to avoid blocking execution
        sendEmailAlert(user.email, `[e-Office Alert] ${notification.title}`, html).catch(err => 
          console.error('Failed to dispatch notification email:', err)
        );
      }
    } catch (err) {
      console.error('Error in Notification Prisma middleware:', err);
    }
  }
  
  return result;
});

export const db = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
