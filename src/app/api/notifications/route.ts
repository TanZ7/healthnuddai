import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// ดึงรายการแจ้งเตือนของผู้ใช้
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ user_id" },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `
        SELECT id, user_id, title, message, type, is_read, created_at, related_ap_id
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `,
      args: [userId],
    });

    // แปลง is_read เป็น boolean
    const notifications = result.rows.map((row: any) => ({
      ...row,
      is_read: row.is_read === 1,
    }));

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด", details: String(error) },
      { status: 500 }
    );
  }
}

// สร้างแจ้งเตือนใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, message, type, related_ap_id } = body;

    if (!user_id || !title || !message || !type) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบ type ที่รองรับ
    const validTypes = ["appointment", "queue", "system", "booking", "reminder", "cancel"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "ประเภทแจ้งเตือนไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `
        INSERT INTO notifications (user_id, title, message, type, related_ap_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [user_id, title, message, type, related_ap_id || null],
    });

    return NextResponse.json({
      success: true,
      message: "สร้างแจ้งเตือนสำเร็จ",
    });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด", details: String(error) },
      { status: 500 }
    );
  }
}

// อัปเดตสถานะอ่านแล้ว
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, mark_all } = body;

    // อ่านทั้งหมด
    if (mark_all && user_id) {
      await db.execute({
        sql: `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
        args: [user_id],
      });

      return NextResponse.json({
        success: true,
        message: "อ่านทั้งหมดแล้ว",
      });
    }

    // อ่านทีละรายการ
    if (id) {
      await db.execute({
        sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        args: [id],
      });

      return NextResponse.json({
        success: true,
        message: "อัปเดตสถานะสำเร็จ",
      });
    }

    return NextResponse.json(
      { success: false, error: "กรุณาระบุ id หรือ mark_all" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด", details: String(error) },
      { status: 500 }
    );
  }
}
