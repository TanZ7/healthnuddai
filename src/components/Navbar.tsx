"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import styles from "./Navbar.module.css";

// หน้าที่ไม่ต้องแสดง Navbar
const HIDDEN_NAVBAR_PATHS = ["/login", "/register"];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, load_user } = useAuthStore();
  const [isMenuOpen, set_is_menu_open] = useState(false);

  useEffect(() => {
    load_user();
  }, [load_user]);

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

  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        LOGO
      </Link>

      <div className={styles.navLinks}>
        {NAV_ITEMS.map((item) => (
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
            <span className={styles.userName}>
              {user.fname} {user.lname}
            </span>
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
        {NAV_ITEMS.map((item) => (
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
          {user ? (
            <>
              <span className={styles.userName}>
                {user.fname} {user.lname}
              </span>
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
