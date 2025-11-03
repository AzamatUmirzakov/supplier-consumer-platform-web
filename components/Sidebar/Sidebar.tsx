"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Sidebar = () => {
  const pages = [
    { name: 'Dashboard', path: '/' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Finances', path: '/finances' },
    { name: 'Orders', path: '/orders' },
    { name: 'Complaints', path: '/complaints' },
  ];

  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-1/6 h-screen bg-black text-white p-4 flex flex-col justify-between">
      <ul className="space-y-2">
        {pages.map((page) => (
          <li key={page.name}>
            <Link className={isActive(page.path) ? "border-b-2 border-white" : "border-b-2 border-black"} href={page.path}>{page.name}</Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center space-x-4">
        <Image
          src="/avatar.png"
          alt="Avatar"
          className="rounded-full w-15 h-15"
          width={100}
          height={100}
        />
        <p className="text-center">John Doe</p>
      </div>
    </div>
  );
};

export default Sidebar;