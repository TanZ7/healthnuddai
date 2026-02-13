"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import styles from "./profile.module.css";

// Mockup ข้อมูลนัดหมาย
const MOCK_UPCOMING_APPOINTMENT = {
  date: "15 มกราคม 2568",
  time: "10:00 น.",
  doctor: "นพ.สมชาย ใจดี",
  department: "อายุรกรรม",
  room: "205",
  queueCode: "Q-2024010915",
  hoursLeft: 18,
};

const MOCK_HISTORY = [
  {
    id: 1,
    date: "10 ธันวาคม 2567",
    doctor: "นพ.วิชัย เก่งดี",
    department: "ศัลยกรรมกระดูก",
    time: "14:00 น.",
    status: "เสร็จสิ้น",
  },
  {
    id: 2,
    date: "5 พฤศจิกายน 2567",
    doctor: "พญ.สุดา สวยงาม",
    department: "ทันตกรรม",
    time: "10:30 น.",
    status: "เสร็จสิ้น",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, load_user } = useAuthStore();

  useEffect(() => {
    load_user();
  }, [load_user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>กำลังโหลด...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const format_birth_date = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const thaiYear = date.getFullYear() + 543;
    const months = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${thaiYear}`;
  };

  const calculate_age = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const format_id_number = (id: string | undefined) => {
    if (!id) return "-";
    return `${id.slice(0, 1)}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id.slice(12)}`;
  };

  const get_sex_label = (sex: string | undefined) => {
    if (sex === "M") return "ชาย";
    if (sex === "F") return "หญิง";
    if (sex === "O") return "อื่นๆ";
    return "-";
  };

  return (
    <div className={styles.container}>
      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <span className={styles.avatarIcon}>👤</span>
          </div>
          <h1 className={styles.userName}>
            {user.title || ""}{user.fname} {user.lname}
          </h1>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoValue}>{user.email || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoValue}>{user.phone_number || "-"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoValue}>
              {calculate_age(user.birth_date)} ปี ({format_birth_date(user.birth_date)})
            </span>
          </div>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>เพศ</span>
            <span className={styles.infoValue}>{get_sex_label(user.sex)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>เลขบัตรประชาชน</span>
            <span className={styles.infoValue}>{format_id_number(user.identification_number)}</span>
          </div>
        </div>

        <button className={styles.editButton}>แก้ไขโปรไฟล์</button>
      </div>

      {/* Upcoming Appointment */}
      <div className={styles.appointmentSection}>
        <h2 className={styles.sectionTitle}>นัดที่กำลังจะมาถึง</h2>

        <div className={styles.upcomingCard}>
          <div className={styles.countdownBanner}>
            กรุณายืนยันนัดภายใน 24 ชั่วโมง (เหลือเวลา {MOCK_UPCOMING_APPOINTMENT.hoursLeft} ชม.)
          </div>

          <div className={styles.appointmentInfo}>
            <div className={styles.appointmentDate}>
              <h3 className={styles.dateText}>{MOCK_UPCOMING_APPOINTMENT.date}</h3>
              <p className={styles.timeText}>เวลา {MOCK_UPCOMING_APPOINTMENT.time}</p>
              <span className={styles.statusBadge}>รอยืนยัน</span>
            </div>

            <div className={styles.appointmentDetails}>
              <p><span className={styles.detailLabel}>แพทย์:</span> {MOCK_UPCOMING_APPOINTMENT.doctor}</p>
              <p><span className={styles.detailLabel}>แผนก:</span> {MOCK_UPCOMING_APPOINTMENT.department}</p>
              <p><span className={styles.detailLabel}>ห้องตรวจ:</span> {MOCK_UPCOMING_APPOINTMENT.room}</p>
              <p><span className={styles.detailLabel}>รหัสนัด:</span> {MOCK_UPCOMING_APPOINTMENT.queueCode}</p>
            </div>
          </div>

          <div className={styles.appointmentActions}>
            <button className={styles.confirmButton}>ยืนยันนัด</button>
            <button className={styles.rescheduleButton}>เลื่อนนัด</button>
            <button className={styles.cancelButton}>ยกเลิก</button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>ประวัติการนัดหมาย</h2>

        <div className={styles.historyList}>
          {MOCK_HISTORY.map((item) => (
            <div key={item.id} className={styles.historyCard}>
              <div className={styles.historyDate}>{item.date}</div>
              <div className={styles.historyContent}>
                <p>
                  <span className={styles.historyIcon}>👨‍⚕️</span>
                  {item.doctor}
                </p>
                <p>
                  <span className={styles.historyIcon}>🏥</span>
                  {item.department}
                </p>
                <p>
                  <span className={styles.historyIcon}>🕐</span>
                  {item.time}
                </p>
              </div>
              <span className={`${styles.historyStatus} ${styles.statusComplete}`}>
                {item.status}
              </span>
              <a href="#" className={styles.detailLink}>ดูรายละเอียด →</a>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Software Development | สุขภาพนัดได้</p>
        <p>Present by Group 3</p>
      </footer>
    </div>
  );
}
