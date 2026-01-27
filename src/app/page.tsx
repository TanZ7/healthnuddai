"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const { user, isLoading, load_user } = useAuthStore();

  useEffect(() => {
    load_user();
  }, [load_user]);

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
            <Link href="/appointments" className={styles.menuItem}>
              <span className={styles.menuIcon}>📅</span>
              นัดหมายของฉัน
            </Link>
            <Link href="/book" className={styles.menuItem}>
              <span className={styles.menuIcon}>➕</span>
              จองคิวใหม่
            </Link>
            <Link href="/profile" className={styles.menuItem}>
              <span className={styles.menuIcon}>👤</span>
              โปรไฟล์
            </Link>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>
              {user ? `สวัสดี, ${user.firstName}!` : "ยินดีต้อนรับ!"}
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
              <div className={styles.statNumber}>0</div>
              <div className={styles.statLabel}>นัดหมายที่รอดำเนินการ</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>0</div>
              <div className={styles.statLabel}>นัดหมายที่ยืนยันแล้ว</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>0</div>
              <div className={styles.statLabel}>นัดหมายที่เสร็จสิ้น</div>
            </div>
          </div>

          <div className={styles.appointmentsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>นัดหมายที่กำลังจะถึง</h2>
              <Link href="/appointments" className={styles.viewAllLink}>
                ดูทั้งหมด
              </Link>
            </div>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <p>ยังไม่มีนัดหมาย</p>
              <Link href="/book" className={styles.bookButton}>
                จองคิวเลย
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}