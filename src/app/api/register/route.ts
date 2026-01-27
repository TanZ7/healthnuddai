import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { title, firstName, lastName, nationalId, phone, birthDate, email, password } = body;
    
    if (!title || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า email หรือ nationalId ซ้ำหรือไม่
    const existingUser = await db.execute({
      sql: `SELECT id FROM users WHERE email = ? OR national_id = ?`,
      args: [email, nationalId],
    });

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "อีเมลหรือเลขบัตรประชาชนนี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `INSERT INTO users (title_th, first_name_th, last_name_th, national_id, phone, birth_date, email, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, firstName, lastName, nationalId, phone, birthDate, email, password],
    });

    return NextResponse.json({ success: true, message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด", details: String(error) },
      { status: 500 }
    );
  }
}