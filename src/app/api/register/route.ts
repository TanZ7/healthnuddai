import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, identification_number, fname, lname, phone_number, sex, email, password, role, birth_date } = body;

    if (!title || !identification_number || !fname || !lname || !email || !password || !phone_number || !sex || !role || !birth_date) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า email หรือ nationalId ซ้ำหรือไม่
    const existingUser = await db.execute({
      sql: `SELECT identification_number FROM users WHERE email = ? OR identification_number = ?`,
      args: [email, identification_number],
    });

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "อีเมลหรือเลขบัตรประชาชนนี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `INSERT INTO users (identification_number,title, fname, lname, phone_number, sex, email, password, role, birth_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      args: [identification_number, title, fname, lname, phone_number, sex, email, password, role, birth_date],
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
