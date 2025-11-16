import Link from "next/link";
import { MdOutlineShoppingCart, MdPlaylistAddCheck } from "react-icons/md";
import { RxAvatar } from "react-icons/rx";
import StarIcon from "@/assets/icons/telegram-star-512.png";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full px-4 bg-(--header) h-[120px] flex flex-col justify-around">
      <div className="flex justify-between w-full items-center">
        <Link href="/" className="flex items-center gap-2 justify-center">
          <Image src={StarIcon} alt="StarShop" width={24} height={24} />
          <h1 className="text-xl font-semibold">StarShop</h1>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/admin">
            <MdOutlineShoppingCart className="w-6 h-6" />
          </Link>
          <Link href="/orders">
            <MdPlaylistAddCheck className="w-6 h-6" />
          </Link>
          <Link href="/profile">
            <RxAvatar className="w-8 h-8" />
          </Link>
        </div>
      </div>
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Найти игру или сервис"
          className="w-full bg-(--search) rounded-xl pl-10 pr-4 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:text-(--indigo-dye) focus:transition focus:duration-300"
        />
      </div>
    </header>
  );
}
