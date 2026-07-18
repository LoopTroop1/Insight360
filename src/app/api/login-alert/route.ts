import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmailAlert } from '@/lib/mailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: parseInt(userId) },
      include: { department: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let backlogHtml = '';
    let emailSubject = `[e-Office Security] Login Detected: ${user.name}`;

    // CASE 1: Secretary / Ministry Admin -> Organization-Wide Backlog
    if (user.role === 'secretary' || user.role === 'ministry_admin') {
      emailSubject = `[e-Office Digest] Organization Backlog Summary - ${user.name}`;
      
      const totalOrgFiles = await db.file.count({ where: { status: 'pending' } });
      const criticalOrgFiles = await db.file.findMany({
        where: { status: 'pending', priority: { in: ['CRITICAL', 'HIGH'] } },
        include: { currentHolder: true },
        take: 5
      });
      const overdueOrgGoals = await db.goal.findMany({
        where: { status: { not: 'completed' }, deadline: { lt: new Date() } },
        take: 5
      });

      let criticalFilesList = '';
      if (criticalOrgFiles.length === 0) {
        criticalFilesList = '<p style="font-size: 13px; color: #10b981; font-style: italic;">🟢 No critical/high-priority pending files in the organization.</p>';
      } else {
        criticalFilesList = '<ul style="padding-left: 20px; margin: 5px 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        criticalOrgFiles.forEach(f => {
          const cleanSubject = f.subject.replace(/^File-\d+:\s*/i, '').replace(/^Discussion on\s*/i, '');
          criticalFilesList += `
            <li style="margin-bottom: 6px;">
              <strong>${cleanSubject}</strong> 
              <br/><span style="font-size: 11px; color: #64748b;">Holder: ${f.currentHolder?.name || 'Unassigned'} (${f.priority})</span>
            </li>`;
        });
        criticalFilesList += '</ul>';
      }

      let overdueGoalsList = '';
      if (overdueOrgGoals.length === 0) {
        overdueGoalsList = '<p style="font-size: 13px; color: #10b981; font-style: italic;">🟢 No overdue organizational goals.</p>';
      } else {
        overdueGoalsList = '<ul style="padding-left: 20px; margin: 5px 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        overdueOrgGoals.forEach(g => {
          overdueGoalsList += `
            <li style="margin-bottom: 6px;">
              <strong>${g.title}</strong> 
              <span style="font-size: 11px; color: #dc2626; font-weight: bold;">(Overdue: ${new Date(g.deadline).toLocaleDateString()})</span>
            </li>`;
        });
        overdueGoalsList += '</ul>';
      }

      backlogHtml = `
        <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #1a3c6e; border-radius: 4px;">
          <h3 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 15px;">🏢 Ministry-Wide Pending Backlog</h3>
          <p style="font-size: 13px; margin: 0; color: #334155;">Total Pending Files in Ministry: <strong style="color: #dc2626;">${totalOrgFiles}</strong></p>
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">⚠️ Critical/High-Priority Files</h3>
          ${criticalFilesList}
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">🏁 Overdue Strategic Goals</h3>
          ${overdueGoalsList}
        </div>
      `;

    // CASE 2: Team Lead / Department Head -> Department-Wide Backlog
    } else if (user.role === 'department_head' || user.role === 'section_officer') {
      emailSubject = `[e-Office Digest] Department Backlog Summary - ${user.name}`;
      
      const totalDeptFiles = await db.file.count({
        where: {
          status: 'pending',
          currentHolder: { departmentId: user.departmentId }
        }
      });
      const criticalDeptFiles = await db.file.findMany({
        where: {
          status: 'pending',
          priority: { in: ['CRITICAL', 'HIGH'] },
          currentHolder: { departmentId: user.departmentId }
        },
        include: { currentHolder: true },
        take: 5
      });
      const overdueDeptTasks = await db.task.findMany({
        where: {
          status: { not: 'done' },
          deadline: { lt: new Date() },
          assignedTo: { departmentId: user.departmentId }
        },
        include: { assignedTo: true },
        take: 5
      });

      let criticalFilesList = '';
      if (criticalDeptFiles.length === 0) {
        criticalFilesList = '<p style="font-size: 13px; color: #10b981; font-style: italic;">🟢 No critical pending files in your department.</p>';
      } else {
        criticalFilesList = '<ul style="padding-left: 20px; margin: 5px 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        criticalDeptFiles.forEach(f => {
          const cleanSubject = f.subject.replace(/^File-\d+:\s*/i, '').replace(/^Discussion on\s*/i, '');
          criticalFilesList += `
            <li style="margin-bottom: 6px;">
              <strong>${cleanSubject}</strong> 
              <br/><span style="font-size: 11px; color: #64748b;">Holder: ${f.currentHolder?.name || 'Unassigned'} (${f.priority})</span>
            </li>`;
        });
        criticalFilesList += '</ul>';
      }

      let overdueTasksList = '';
      if (overdueDeptTasks.length === 0) {
        overdueTasksList = '<p style="font-size: 13px; color: #10b981; font-style: italic;">🟢 No overdue department tasks.</p>';
      } else {
        overdueTasksList = '<ul style="padding-left: 20px; margin: 5px 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        overdueDeptTasks.forEach(t => {
          const cleanDesc = t.description.replace(/^Task-\d+:\s*/i, '').replace(/^Detail action item supporting\s*/i, '');
          overdueTasksList += `
            <li style="margin-bottom: 6px;">
              <strong>${cleanDesc}</strong> 
              <br/><span style="font-size: 11px; color: #dc2626; font-weight: bold;">Assignee: ${t.assignedTo?.name || 'Unassigned'} (Overdue: ${new Date(t.deadline).toLocaleDateString()})</span>
            </li>`;
        });
        overdueTasksList += '</ul>';
      }

      backlogHtml = `
        <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #1e3a8a; border-radius: 4px;">
          <h3 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 15px;">🏢 Department-Wide Pending Backlog</h3>
          <p style="font-size: 13px; margin: 0; color: #334155;">Total Pending Files in ${user.department?.name || 'Department'}: <strong style="color: #dc2626;">${totalDeptFiles}</strong></p>
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">⚠️ Critical/High-Priority Files</h3>
          ${criticalFilesList}
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">🚨 Overdue Department Tasks</h3>
          ${overdueTasksList}
        </div>
      `;

    // CASE 3: Employee / Officer / Others -> Individual Backlog
    } else {
      emailSubject = `[e-Office Digest] Individual Backlog Summary - ${user.name}`;

      const myTasks = await db.task.findMany({
        where: { assignedToId: user.id, status: { not: 'done' } },
        orderBy: { deadline: 'asc' }
      });
      const myFiles = await db.file.findMany({
        where: { currentHolderId: user.id, status: 'pending' },
        orderBy: { createdAt: 'desc' }
      });

      let filesHtml = '';
      if (myFiles.length === 0) {
        filesHtml = '<p style="font-size: 13px; color: #10b981; font-style: italic; margin: 5px 0 0 0;">🟢 All files cleared. Zero backlog in queue.</p>';
      } else {
        filesHtml = '<ul style="padding-left: 20px; margin: 5px 0 0 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        myFiles.forEach(file => {
          const received = new Date(file.createdAt);
          const due = new Date(received.getTime() + file.slaCategoryDays * 24 * 60 * 60 * 1000);
          const isOverdue = due < new Date();
          const cleanSubject = file.subject.replace(/^File-\d+:\s*/i, '').replace(/^Discussion on\s*/i, '');
          
          filesHtml += `
            <li style="margin-bottom: 6px;">
              <strong>${cleanSubject}</strong> 
              <span style="font-size: 11px; padding: 1px 5px; border-radius: 3px; font-weight: bold; ${
                isOverdue 
                  ? 'background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2;' 
                  : 'background-color: #f0fdf4; color: #15803d; border: 1px solid #dcfce7;'
              }">
                Due: ${due.toLocaleDateString()} ${isOverdue ? '(OVERDUE)' : ''}
              </span>
            </li>`;
        });
        filesHtml += '</ul>';
      }

      let tasksHtml = '';
      if (myTasks.length === 0) {
        tasksHtml = '<p style="font-size: 13px; color: #10b981; font-style: italic; margin: 5px 0 0 0;">🟢 No active tasks assigned.</p>';
      } else {
        tasksHtml = '<ul style="padding-left: 20px; margin: 5px 0 0 0; font-size: 13px; color: #334155; line-height: 1.6;">';
        myTasks.forEach(task => {
          const deadline = new Date(task.deadline);
          const isOverdue = deadline < new Date();
          const cleanDesc = task.description.replace(/^Task-\d+:\s*/i, '').replace(/^Detail action item supporting\s*/i, '');
          
          tasksHtml += `
            <li style="margin-bottom: 6px;">
              <strong>${cleanDesc}</strong> 
              <span style="font-size: 11px; padding: 1px 5px; border-radius: 3px; font-weight: bold; ${
                isOverdue 
                  ? 'background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2;' 
                  : 'background-color: #f0fdf4; color: #15803d; border: 1px solid #dcfce7;'
              }">
                Deadline: ${deadline.toLocaleDateString()} ${isOverdue ? '(OVERDUE)' : ''}
              </span>
            </li>`;
        });
        tasksHtml += '</ul>';
      }

      backlogHtml = `
        <div style="margin-top: 25px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">📥 Outstanding e-Office File Backlog</h3>
          ${filesHtml}
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #f1f5f9;">
          <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px;">📋 Active Action Tasks</h3>
          ${tasksHtml}
        </div>
      `;
    }

    const timestamp = new Date().toLocaleString();
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #1a3c6e 0%, #1e3a8a 100%); padding: 15px; border-radius: 8px 8px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 18px;">Security Alert: New Session Login</h2>
          <span style="font-size: 11px; opacity: 0.8;">e-Office Pro NIC Portal</span>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>This is to notify you that a new login session has been opened for your government profile.</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 15px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 120px;">User Name:</td>
              <td style="padding: 8px 0; color: #0f172a;">${user.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Designation:</td>
              <td style="padding: 8px 0; color: #0f172a;">${user.designation}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Department:</td>
              <td style="padding: 8px 0; color: #0f172a;">${user.department?.name || 'e-Office Division'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Timestamp:</td>
              <td style="padding: 8px 0; color: #0f172a;">${timestamp}</td>
            </tr>
          </table>

          ${backlogHtml}

          <p style="font-size: 13px; color: #dc2626; font-weight: bold; margin-top: 25px; padding-top: 10px; border-top: 1px dashed #fee2e2;">
            If you did not initiate this login session, please report it immediately to your NIC Security Officer.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 10px; border-radius: 0 0 8px 8px; text-align: center; font-size: 11px; color: #64748b;">
          This is an automated security audit email dispatched by the National Informatics Centre (NIC).
        </div>
      </div>
    `;

    // Send email asynchronously
    sendEmailAlert(user.email, emailSubject, html).catch(err => 
      console.error('Failed to send login alert email:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending login alert:', error);
    return NextResponse.json({ error: 'Failed to trigger login email alert' }, { status: 500 });
  }
}
