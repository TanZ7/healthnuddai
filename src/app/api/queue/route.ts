import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // วันนี้ในรูปแบบ YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // ดึงข้อมูลแผนกทั้งหมด
    const deptResult = await db.execute({
      sql: "SELECT dno, name FROM department ORDER BY dno ASC",
      args: [],
    });

    // ดึงคิววันนี้ที่ยืนยันแล้ว (status = 'done')
    const queueResult = await db.execute({
      sql: `
        SELECT 
          departmentId,
          status,
          time,
          ap_id
        FROM appointments 
        WHERE date = ? AND status = 'done'
        ORDER BY departmentId, ap_id
      `,
      args: [todayStr],
    });

    // สร้างสถิติแต่ละแผนก
    const deptStats = deptResult.rows.map((dept: any) => {
      const deptQueues = queueResult.rows.filter((q: any) => q.departmentId === dept.dno);
      
      const total = deptQueues.length;

      // คิวปัจจุบัน (คิวแรกของแผนก)
      const currentQueue = deptQueues.length > 0 ? deptQueues[0] : null;
      
      // รหัสคิวปัจจุบัน
      const deptCode = String.fromCharCode(64 + dept.dno); // A, B, C, D, E, F
      const currentCode = currentQueue ? `${deptCode}${String(currentQueue.ap_id).padStart(2, '0')}` : '-';

      // เวลารอโดยประมาณ (สมมติ 15 นาทีต่อคิว)
      const waitMinutes = total * 15;
      const waitText = waitMinutes > 0 ? `${waitMinutes} นาที` : 'ไม่ต้องรอ';

      return {
        dno: dept.dno,
        name: dept.name,
        currentCode,
        waitTime: waitText,
        waiting: total, // คิวที่รอตรวจ (ยืนยันแล้ว)
        total,
      };
    });

    return NextResponse.json({
      success: true,
      date: todayStr,
      data: deptStats,
    });
  } catch (error) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
