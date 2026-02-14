"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./register.module.css";

const title_OPTIONS = ["นาย", "นาง", "นางสาว"] as const;
const sex_OPTIONS = ["M", "F", "O"] as const;

export default function RegisterPage() {
  const [form, set_form] = useState({
    title: "",
    fname: "",
    lname: "",
    identification_number: "",
    phone_number: "",
    birth_date: "",
    email: "",
    sex: "",
    role: "patient",
    password: "",
    confirmPassword: "",
  });
  const [message, set_message] = useState<string | null>(null);
  const [messageType, set_message_type] = useState<"error" | "success">("error");

  const handle_change = (
    event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    set_form((current) => ({ ...current, [name]: value }));
  };

  const handle_submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      set_message("รหัสผ่านไม่ตรงกัน");
      set_message_type("error");
      return;
    }

    const required =
      form.title && form.fname && form.lname && form.identification_number &&
      form.phone_number && form.birth_date && form.email && form.password;

    if (!required) {
      set_message("กรุณากรอกข้อมูลให้ครบถ้วน");
      set_message_type("error");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        set_message("สมัครสมาชิกสำเร็จ!");
        set_message_type("success");
        set_form({
          title: "", fname: "", lname: "", identification_number: "",
          phone_number: "", birth_date: "", email: "", sex: "",
          password: "", confirmPassword: "", role: "patient"
        });
      } else {
        set_message(data.error || "เกิดข้อผิดพลาด");
        set_message_type("error");
      }
    } catch {
      set_message("ไม่สามารถเชื่อมต่อได้");
      set_message_type("error");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>สมัครสมาชิก</h1>

          <form className={styles.formGrid} onSubmit={handle_submit}>
            {/* Input fields start */}
            <div className={styles.field}>
              <label className={styles.label}>
                ชื่อ<span className={styles.required}>*</span>
              </label>
              <div className={styles.radioGroup}>
                {title_OPTIONS.map((option) => (
                  <label key={option} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="title"
                      value={option}
                      checked={form.title === option}
                      onChange={handle_change}
                      className={styles.radioInput}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="fname" className={styles.label}>ชื่อ<span className={styles.required}>*</span></label>
                <input id="fname" name="fname" type="text" value={form.fname} onChange={handle_change} className={styles.input} placeholder="ระบุชื่อ" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="lname" className={styles.label}>นามสกุล<span className={styles.required}>*</span></label>
                <input id="lname" name="lname" type="text" value={form.lname} onChange={handle_change} className={styles.input} placeholder="ระบุนามสกุล" required />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="identification_number" className={styles.label}>เลขบัตรประชาชน<span className={styles.required}>*</span></label>
                <input id="identification_number" name="identification_number" type="text" inputMode="numeric" maxLength={13} value={form.identification_number} onChange={handle_change} className={styles.input} placeholder="ระบุเลขบัตรประชาชน" required />
              </div>
              <div className={styles.field}>
                <label htmlFor="phone_number" className={styles.label}>เบอร์โทรศัพท์<span className={styles.required}>*</span></label>
                <input id="phone_number" name="phone_number" type="tel" inputMode="tel" value={form.phone_number} onChange={handle_change} className={styles.input} placeholder="ระบุเบอร์โทรศัพท์" required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="birth_date" className={styles.label}>วัน/เดือน/ ปีเกิด<span className={styles.required}>*</span></label>
              <input id="birth_date" name="birth_date" type="date" value={form.birth_date} onChange={handle_change} className={styles.input} required />
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>อีเมล<span className={styles.required}>*</span></label>
              <input id="email" name="email" type="email" value={form.email} onChange={handle_change} className={styles.input} placeholder="ระบุอีเมล" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>รหัสผ่าน<span className={styles.required}>*</span></label>
              <input id="password" name="password" type="password" value={form.password} onChange={handle_change} className={styles.input} placeholder="ระบุรหัสผ่าน" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>ยืนยันรหัสผ่าน<span className={styles.required}>*</span></label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle_change} className={styles.input} placeholder="ระบุรหัสผ่าน" required />
            </div>

            <div className={styles.radioGroup}>
              {sex_OPTIONS.map((option) => (
                <label key={option} className={styles.radioLabel}>
                  <input type="radio" name="sex" value={option} checked={form.sex === option} onChange={handle_change} className={styles.radioInput} required />
                  {option}
                </label>
              ))}
            </div>

            {message && (
              <div className={`${styles.message} ${messageType === "error" ? styles.messageError : styles.messageSuccess}`}>
                {message}
              </div>
            )}

            <button type="submit" className={styles.submitButton}>
              ยืนยันการสร้างบัญชี
            </button>

            <div className={styles.footer}>
              หรือ <Link href="/login" className={styles.link}>เข้าสู่ระบบ</Link>
            </div>
          </form>
        </div>
      </div>

      <div className={styles.heroCard}>
        {/* TODO: เพิ่มรูปโลโก้ทีหลัง */}
        <h2 className={styles.heroText}>สุขภาพนัดได้</h2>
      </div>
    </main>
  );
}
