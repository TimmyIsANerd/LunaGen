import React from 'react';
import { FaMedium, FaTelegram } from 'react-icons/fa';
import { FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <div className="flex justify-center items-end gap-4 border-t-2 border-[#fff] w-full py-6 font-[500] text-[#fff] md:text-[16px] text-[10px] backdrop-opacity-10 backdrop-invert bg-[#000]/50 font-poppins">
      <a href="https://twitter.com/vefi_official?s=20&t=Nyz3yLS_sKZ0asOgOl3NGw" rel="noreferrer" target="_blank">
        <button className="rounded-full bg-[#05325B]/90 px-3 py-3">
          <FiTwitter />
        </button>
      </a>
      <a href="https://t.me/vefi_official" rel="noreferrer" target="_blank">
        <button className="rounded-full bg-[#05325B]/90 px-3 py-3">
          <FaTelegram />
        </button>
      </a>
      <a href="https://medium.com/@vefi.official" rel="noreferrer" target="_blank">
        <button className="rounded-full bg-[#05325B]/90 px-3 py-3">
          <FaMedium />
        </button>
      </a>
      <a href="https://www.youtube.com/channel/UCXMsXe5AvNSPL32Yna8MKdQ" rel="noreferrer" target="_blank">
        <button className="rounded-full bg-[#05325B]/90 px-3 py-3">
          <FiYoutube />
        </button>
      </a>
      <a href="https://instagram.com/vefi.official" rel="noreferrer" target="_blank">
        <button className="rounded-full bg-[#05325B]/90 px-3 py-3">
          <FiInstagram />
        </button>
      </a>
    </div>
  );
}
