"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./dashboard.module.css";

interface Appointment {
  ap_id: number;
  date: string;
  time: string;
  status: string;
  department_name: string;
  dno: number;
  title: string;
  fname: string;
  lname: string;
  identification_number?: string;
}

const DEPT_ICONS: { [key: number]: string } = {
  1: "💚",
  2: "🔬",
  3: "👶",
  4: "🎨",
  5: "🦴",
  6: "📋",
};

export default function Dashboard() {
  const { user, isLoading, load_user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const reminderSentRef = useRef(false);

  // ส่ง reminder สำหรับนัดวันพรุ่งนี้
  const checkAndSendReminders = useCallback(async (
    userInfo: { identification_number: string; fname: string; lname: string },
    appointmentsList: Appointment[]
  ) => {
    if (reminderSentRef.current) return; // ป้องกันการส่งซ้ำ
    
    try {
      // หาวันพรุ่งนี้
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // กรองนัดหมายพรุ่งนี้ที่เป็นของ user และยังไม่ถูกยกเลิก
      const tomorrowAppointments = appointmentsList.filter((ap) => {
        const apDate = ap.date?.split("T")[0];
        const validStatus = !ap.status || ap.status === "pending" || ap.status === "done";
        const isMyAppointment = ap.fname === userInfo.fname && ap.lname === userInfo.lname;
        return apDate === tomorrowStr && validStatus && isMyAppointment;
      });

      if (tomorrowAppointments.length === 0) return;

      // ดึง notifications ที่มีอยู่แล้ว
      const notifRes = await fetch(`/api/notifications?user_id=${userInfo.identification_number}`);
      const notifData = await notifRes.json();
      const existingReminders = notifData.success ? notifData.data : [];

      // สร้าง reminder สำหรับนัดที่ยังไม่มี
      for (const ap of tomorrowAppointments) {
        const hasReminder = existingReminders.some(
          (n: any) => n.type === "reminder" && n.related_ap_id === ap.ap_id
        );

        if (!hasReminder) {
          const timeText = ap.time === "morning" || ap.time?.includes("08") 
            ? "ช่วงเช้า (08:00-09:00 น.)" 
            : "ช่วงบ่าย (12:00-13:00 น.)";
          
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userInfo.identification_number,
              title: "⏰ เตือนนัดหมายพรุ่งนี้",
              message: `คุณมีนัดหมาย${ap.department_name || "พบแพทย์"} ${timeText} อย่าลืมมาตามนัดนะคะ`,
              type: "reminder",
              related_ap_id: ap.ap_id,
            }),
          });
        }
      }

      reminderSentRef.current = true;
    } catch (error) {
      console.error("Reminder check error:", error);
    }
  }, []);

  const is_expired = (appointmentDate: string, appointmentTime: string) => {
    if (!appointmentDate || !appointmentTime) return false;
    
    const now = new Date();
    const apDateStr = appointmentDate.split('T')[0];
    const [apYear, apMonth, apDay] = apDateStr.split('-').map(Number);
    const apDate = new Date(apYear, apMonth - 1, apDay);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ถ้าวันนัดอยู่ในอดีต
    if (apDate < today) return true;

    // ถ้าวันนัดอยู่ในอนาคต
    if (apDate > today) return false;

    // ถ้าเป็นวันเดียวกัน → เช็คเวลา
    const currentTimeInMinutes = (now.getHours() * 60) + now.getMinutes();
    const morningEnd = 9 * 60;   // 09:00
    const afternoonEnd = 13 * 60; // 13:00

    // รองรับ format "morning"/"afternoon" และ "HH:MM"
    const isMorning = appointmentTime.toLowerCase() === 'morning' || 
                      (appointmentTime.includes(':') && parseInt(appointmentTime.split(':')[0]) < 12);
    
    if (isMorning && currentTimeInMinutes > morningEnd) return true;
    if (!isMorning && currentTimeInMinutes > afternoonEnd) return true;
    
    return false;
  };

  const fetch_appointments = useCallback(async () => {
    try {
      const res = await fetch(`/api/booking?all=true`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, []);

  useEffect(() => {
    load_user();
    fetch_appointments();
  }, [load_user, fetch_appointments]);

  // เช็คและส่ง reminder เมื่อโหลดข้อมูลเสร็จ (เฉพาะ user ทั่วไป)
  useEffect(() => {
    if (user && user.role !== "doctor" && user.identification_number && appointments.length > 0) {
      checkAndSendReminders(
        { 
          identification_number: user.identification_number, 
          fname: user.fname, 
          lname: user.lname 
        }, 
        appointments
      );
    }
  }, [user, appointments, checkAndSendReminders]);

  // นัดหมายที่กำลังจะมาถึง (ทุกคน - สำหรับ doctor)
  const allUpcomingAppointments = appointments.filter(ap => 
    (!ap.status || ap.status === "pending") && !is_expired(ap.date, ap.time)
  ).sort((a, b) => {
    const dateA = new Date(a.date.split('T')[0] + 'T' + a.time);
    const dateB = new Date(b.date.split('T')[0] + 'T' + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  // นัดหมายที่กำลังจะมาถึง (เฉพาะของ user ที่ล็อกอิน)
  const myUpcomingAppointments = appointments.filter(ap => 
    (!ap.status || ap.status === "pending") && 
    !is_expired(ap.date, ap.time) &&
    user && ap.fname === user.fname && ap.lname === user.lname
  ).sort((a, b) => {
    const dateA = new Date(a.date.split('T')[0] + 'T' + a.time);
    const dateB = new Date(b.date.split('T')[0] + 'T' + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  // เลือกตาม role
  const upcomingAppointments = user?.role === "doctor" ? allUpcomingAppointments : myUpcomingAppointments;

  const format_date = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = months[date.getMonth()];
    return { day, month };
  };

  const get_today_str = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = get_today_str();

  // นัดหมายที่ยืนยันแล้ววันนี้ (เฉพาะของ user ที่ล็อกอิน)
  const myConfirmedToday = appointments.filter(ap => 
    ap.status === "done" && 
    ap.date?.split('T')[0] === todayStr &&
    user && ap.fname === user.fname && ap.lname === user.lname
  );

  // นัดหมายที่ยืนยันแล้ววันนี้ (ทุกคน)
  const allConfirmedToday = appointments.filter(ap => 
    ap.status === "done" && 
    ap.date?.split('T')[0] === todayStr
  );

  const get_queue_code = (ap: Appointment) => {
    const deptCode = String.fromCharCode(64 + (ap.dno || 1));
    return `${deptCode}${String(ap.ap_id).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <p className={styles.menuTitle}>เมนู</p>
          <nav className={styles.menuList}>
            <Link href="/" className={`${styles.menuItem} ${styles.menuItemActive}`}>
              <span className={styles.menuIcon}>🏠</span>
              หน้าหลัก
            </Link>
            <Link href="/profile" className={styles.menuItem}>
              <span className={styles.menuIcon}>📅</span>
              นัดหมายของฉัน
            </Link>
            <Link href="/booking" className={styles.menuItem}>
              <span className={styles.menuIcon}>➕</span>
              จองคิวใหม่
            </Link>
            <Link href="/profile" className={styles.menuItem}>
              <span className={styles.menuIcon}>👤</span>
              ข้อมูลของฉัน
            </Link>
          </nav>

          {/* คิวของฉันวันนี้ */}
          {user && (
            <div className={styles.myQueueSection}>
              <p className={styles.menuTitle}>🎫 คิวของฉัน</p>
              {myConfirmedToday.length > 0 ? (
                <div className={styles.myQueueList}>
                  {myConfirmedToday.map((ap) => (
                    <div key={ap.ap_id} className={styles.myQueueItem}>
                      <span className={styles.myQueueCode}>{get_queue_code(ap)}</span>
                      <span className={styles.myQueueDept}>{DEPT_ICONS[ap.dno] || "🏥"} {ap.department_name || "แผนกทั่วไป"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noQueue}>ยังไม่มีคิววันนี้</p>
              )}
            </div>
          )}
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>
              {user ? `สวัสดี, ${user.fname}!` : "ยินดีต้อนรับ!"}
            </h1>
            <p className={styles.welcomeSubtitle}>
              {user
                ? "ยินดีต้อนรับกลับมา วันนี้คุณต้องการนัดหมายอะไรไหม?"
                : "เข้าสู่ระบบเพื่อจัดการนัดหมายของคุณ"
              }
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{upcomingAppointments.length}</div>
              <div className={styles.statLabel}>คิวที่รอดำเนินการ</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {user?.role === "doctor" ? allConfirmedToday.length : myConfirmedToday.length}
              </div>
              <div className={styles.statLabel}>ยืนยันแล้ววันนี้</div>
            </div>
          </div>

          <div className={styles.appointmentsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>คิวนัดหมายที่กำลังจะมาถึง</h2>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className={styles.appointmentList}>
                {upcomingAppointments.map((ap) => {
                  const { day, month } = format_date(ap.date);
                  return (
                    <div key={ap.ap_id} className={styles.appointmentItem}>
                      <div className={styles.appointmentDate}>
                        <div className={styles.appointmentDay}>{day}</div>
                        <div className={styles.appointmentMonth}>{month}</div>
                      </div>
                      <div className={styles.appointmentDetails}>
                        <div className={styles.appointmentTitle}>
                          {ap.title}{ap.fname} {ap.lname}
                        </div>
                        <div className={styles.appointmentTime}>
                          {DEPT_ICONS[ap.dno] || "🏥"} {ap.department_name || "แผนกทั่วไป"} | เวลา {ap.time} น.
                        </div>
                      </div>
                      <span className={`${styles.appointmentStatus} ${styles.statusPending}`}>
                        รอยืนยัน
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <p>ยังไม่มีคิวนัดหมาย</p>
                <Link href="/booking" className={styles.bookButton}>
                  จองคิวเลย
                </Link>
              </div>
            )}
          </div>

          {/* ========== คิวที่ยืนยันแล้ว ========== */}
          <div className={styles.appointmentsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>คิวที่ยืนยันแล้ววันนี้</h2>
            </div>
            {(() => {
              const confirmedList = user?.role === "doctor" ? allConfirmedToday : myConfirmedToday;
              return confirmedList.length > 0 ? (
                <div className={styles.appointmentList}>
                  {confirmedList.map((ap) => {
                    const { day, month } = format_date(ap.date);
                    return (
                      <div key={ap.ap_id} className={styles.appointmentItem}>
                        <div className={`${styles.appointmentDate} ${styles.dateConfirmed}`}>
                          <div className={styles.appointmentDay}>{day}</div>
                          <div className={styles.appointmentMonth}>{month}</div>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <div className={styles.appointmentTitle}>
                            {ap.title}{ap.fname} {ap.lname}
                          </div>
                          <div className={styles.appointmentTime}>
                            {DEPT_ICONS[ap.dno] || "🏥"} {ap.department_name || "แผนกทั่วไป"} | เวลา {ap.time} น.
                          </div>
                        </div>
                        <div className={styles.queueBadge}>
                          <span className={styles.queueLabel}>คิว</span>
                          <span className={styles.queueNumber}>{get_queue_code(ap)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>ยังไม่มีคิวที่ยืนยันวันนี้</p>
                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
