"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./Navbar.module.css";

// หน้าที่ไม่ต้องแสดง Navbar
const HIDDEN_NAVBAR_PATHS = ["/login", "/register"];

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

// แปลงเวลาเป็นข้อความ "...ที่แล้ว"
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH");
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, load_user } = useAuthStore();
  const [isMenuOpen, set_is_menu_open] = useState(false);
  const [notifyOpen, set_notify_open] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ดึงข้อมูลแจ้งเตือนจาก API
  const fetchNotifications = useCallback(async () => {
    if (!user?.identification_number) return;

    try {
      const res = await fetch(`/api/notifications?user_id=${user.identification_number}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.slice(0, 5)); // แสดงแค่ 5 รายการล่าสุด
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user?.identification_number]);

  useEffect(() => {
    load_user();
  }, [load_user]);

  useEffect(() => {
    if (user?.identification_number) {
      fetchNotifications();
      // รีเฟรชทุก 30 วินาที
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.identification_number, fetchNotifications]);

  // ไม่แสดง Navbar ในหน้า login และ register
  if (HIDDEN_NAVBAR_PATHS.includes(pathname)) {
    return null;
  }

  const handle_logout = () => {
    logout();
    router.push("/");
  };

  const NAV_ITEMS = [
    { href: "/", label: "หน้าหลัก" },
    { href: "/booking", label: "จองนัด" },
    { href: "/queue", label: "คิวเรียลไทม์" },
    { href: "/doctors", label: "แพทย์และแผนก" },
    { href: "/guide", label: "คู่มือ/วิธีใช้" },
  ];


  const displayNavItems = NAV_ITEMS.map((item) => {
    if (item.label === "คิวเรียลไทม์" && (user?.role === "doctor" || user?.role === "staff")) {
      return { ...item, href: "/managequeue" }; 
    }
    return item; 
  });

  // นับจำนวนที่ยังไม่อ่าน
  const unreadCount = notifications.filter((n) => !n.is_read).length;

const NotifyBell = () => (
  <div className={styles.notifyWrapper}>
    <button
      onClick={() => set_notify_open(!notifyOpen)}
      className={styles.notifyButton}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className={styles.notifyBadge}>{unreadCount}</span>
      )}
    </button>
    {notifyOpen && (
      <>
        <div onClick={() => set_notify_open(false)} className={styles.notifyBackdrop} />
        <div className={styles.notifyDropdown}>
          <div className={styles.notifyHeader}>การแจ้งเตือน</div>
          <ul className={styles.notifyList}>
            {notifications.length === 0 ? (
              <li className={styles.notifyEmpty}>ไม่มีการแจ้งเตือน</li>
            ) : (
              notifications.map((n) => (
                <li key={n.id} className={`${styles.notifyItem} ${n.is_read ? styles.notifyItemRead : styles.notifyItemUnread}`}>
                  <span className={`${styles.notifyDot} ${n.is_read ? styles.notifyDotRead : styles.notifyDotUnread}`} />
                  <div>
                    <div className={`${styles.notifyTitle} ${n.is_read ? styles.notifyTitleRead : styles.notifyTitleUnread}`}>{n.title}</div>
                    <div className={styles.notifyMessage}>{n.message}</div>
                    <div className={styles.notifyTime}>{formatTimeAgo(n.created_at)}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className={styles.notifyFooter}>
            <Link href="/notifications" className={styles.notifyFooterLink} onClick={() => set_notify_open(false)}>ดูทั้งหมด</Link>
          </div>
        </div>
      </>
    )}
  </div>
);
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        สุขภาพนัดได้
      </Link>
      <div className={styles.navLinks}>
        {displayNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className={styles.authButtons}>
        {user ? (
          <>
            <NotifyBell /> 
            <Link href="/profile" className={styles.userName}> 
              {user.fname} {user.lname}
            </Link>
            <button onClick={handle_logout} className={styles.logoutButton}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link href="/login" className={styles.loginButton}>
            เข้าสู่ระบบ
          </Link>
        )}
      </div>

      <button
        className={styles.menuButton}
        onClick={() => set_is_menu_open(!isMenuOpen)}
      >
        <div className={styles.menuIcon}>
          <span className={styles.menuIconLine}></span>
          <span className={styles.menuIconLine}></span>
          <span className={styles.menuIconLine}></span>
        </div>
      </button>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}>
        {displayNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
            onClick={() => set_is_menu_open(false)}
          >
            {item.label}
          </Link>
        ))}
        <div className={styles.authButtons}>
          <NotifyBell /> 
          {user ? (
            <>
              <Link href="/profile" className={styles.userName}>
                {user.fname} {user.lname}
              </Link>
              <button onClick={handle_logout} className={styles.logoutButton}>
                ออกจากระบบ
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.loginButton}>
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
