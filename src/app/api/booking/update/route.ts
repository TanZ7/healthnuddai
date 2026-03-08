// app/api/booking/update/route.ts
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
    try {
        const { ap_id, status } = await request.json();

        // ดึงข้อมูล appointment ก่อนอัปเดต
        const apResult = await db.execute({
            sql: `SELECT a.*, d.name as department_name 
                  FROM appointments a 
                  LEFT JOIN department d ON a.departmentId = d.dno 
                  WHERE a.ap_id = ?`,
            args: [ap_id],
        });

        if (apResult.rows.length === 0) {
            return NextResponse.json({ error: "ไม่พบการนัดหมาย" }, { status: 404 });
        }

        const appointment = apResult.rows[0] as any;

        // อัปเดตสถานะ
        await db.execute({
            sql: `UPDATE appointments SET status = ? WHERE ap_id = ?`,
            args: [status, ap_id],
        });

        // แปลงวันที่เป็นภาษาไทย
        const dateObj = new Date(appointment.date);
        const thaiDate = dateObj.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const timeLabel = appointment.time === "morning" ? "ช่วงเช้า" : "ช่วงบ่าย";
        const deptName = appointment.department_name || "ไม่ระบุ";

        // สร้าง notification ตามสถานะ 
        let notifTitle = "";
        let notifMessage = "";
        let notifType = "";

        if (status === "done") {
            notifTitle = "ยืนยันนัดหมาย";
            notifMessage = `นัดหมายของคุณแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} ได้รับการยืนยันแล้ว`;
            notifType = "appointment";
        } else if (status === "cancelled" || status === "cancel") {
            notifTitle = "ยกเลิกนัดหมาย";
            notifMessage = `นัดหมายของคุณแผนก${deptName} วันที่ ${thaiDate} ${timeLabel} ถูกยกเลิกแล้ว`;
            notifType = "cancel";
        } else if (status === "completed") {
            notifTitle = "ตรวจเสร็จสิ้น";
            notifMessage = `การตรวจแผนก${deptName} ของคุณเสร็จสิ้นแล้ว ขอบคุณที่ใช้บริการ`;
            notifType = "system";
        }

        // ส่ง notification ถ้ามีการเปลี่ยนสถานะที่ต้องแจ้ง
        if (notifTitle) {
            try {
                await db.execute({
                    sql: `INSERT INTO notifications (user_id, title, message, type, related_ap_id)
                          VALUES (?, ?, ?, ?, ?)`,
                    args: [
                        appointment.identification_number,
                        notifTitle,
                        notifMessage,
                        notifType,
                        ap_id,
                    ],
                });
            } catch (notifError) {
                console.error("Notification error:", notifError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}