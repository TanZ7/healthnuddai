"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, set_email] = useState("");
  const [password, set_password] = useState("");
  const [message, set_message] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const handle_submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setMessageType("error");
      set_message("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // เก็บข้อมูล user ผ่าน auth store
        login(data.user);
        setMessageType("success");
        set_message("เข้าสู่ระบบสำเร็จ!");
        // redirect ไปหน้าหลักหลัง 1 วินาที
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        setMessageType("error");
        set_message(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setMessageType("error");
      set_message("ไม่สามารถเชื่อมต่อได้");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>เข้าสู่ระบบ</h1>
          <form onSubmit={handle_submit}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>
                  อีเมล <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => set_email(e.target.value)}
                  className={styles.input}
                  placeholder="กรุณากรอกอีเมลของคุณ"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  รหัสผ่าน <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => set_password(e.target.value)}
                  className={styles.input}
                  placeholder="กรุณากรอกรหัสผ่าน"
                  required
                />
              </div>
              <button type="submit" className={styles.submitButton}>
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
          {message && (
            <div
              className={`${styles.message} ${
                messageType === "error" ? styles.messageError : styles.messageSuccess
              }`}
            >
              {message}
            </div>
          )}
          <p className={styles.footer}>
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className={styles.link}>
              สมัครสมาชิก
            </Link>
          </p>
        </div>
        <div className={styles.heroCard}>
          <span className={styles.heroText}>สุขภาพนัดได้</span>
        </div>
      </div>
    </div>
  );
}
