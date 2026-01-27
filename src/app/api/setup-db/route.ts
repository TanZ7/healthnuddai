import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ลบตารางเก่า (ถ้ามี)
    await db.execute(`DROP TABLE IF EXISTS users`);

    // สร้างตาราง users ใหม่
    await db.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_th TEXT,
        first_name_th TEXT NOT NULL,
        last_name_th TEXT NOT NULL,
        title_en TEXT,
        first_name_en TEXT,
        last_name_en TEXT,
        national_id TEXT UNIQUE,
        phone TEXT,
        province TEXT,
        birth_date TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({ 
      success: true, 
      message: "ลบตารางเก่าและสร้างตาราง users ใหม่สำเร็จ!" 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด", details: String(error) },
      { status: 500 }
    );
  }
}
