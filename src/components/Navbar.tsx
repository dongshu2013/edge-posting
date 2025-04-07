"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { AuthButton } from "@/components/AuthButton";
import { useUserStore } from "@/store/userStore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import { moods } from "@/config/moods";
import { Menu } from "@headlessui/react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const { isAuthenticated } = useAuth();
  const { userInfo, setUserInfo } = useUserStore();

  useEffect(() => {
    function handleClickOutside() {
      if (showMoodDropdown) {
        setShowMoodDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoodDropdown]);

  const handleMoodUpdate = async (mood: string) => {
    try {
      const res = await fetchApi(`/api/user/${userInfo?.uid}/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
        auth: true,
      });
      setUserInfo(res.user);
      setShowMoodDropdown(false);
    } catch (error) {
      console.error("Failed to update mood:", error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo.svg"
                  alt="BUZZ Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-gray-900">BUZZ</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/" ||
                  pathname === "/buzz" ||
                  (pathname.startsWith("/buzz/") &&
                    !pathname.startsWith("/buzz/my"))
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                All Buzzes
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/buzz/my/replies"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === "/buzz/my/replies"
                        ? "border-indigo-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    My Replies
                  </Link>
                  <Link
                    href="/buzz/my"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === "/buzz/my"
                        ? "border-indigo-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    My Buzzes
                  </Link>
                </>
              )}

              <Link
                href="/kol"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === "/kol"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                KOLs
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:ml-6 space-x-4">
            {isAuthenticated && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1 group border rounded-md px-3 py-1.5 hover:bg-gray-50">
                  <div className="flex items-center space-x-1">
                    {userInfo?.mood ? (
                      <>
                        {moods.find((m) => m.id === userInfo.mood)?.icon && (
                          <div className="w-4 h-4">
                            {React.createElement(
                              moods.find((m) => m.id === userInfo.mood)!.icon,
                              { className: "text-gray-600" }
                            )}
                          </div>
                        )}
                        <span className="font-medium group-hover:text-gray-900">
                          {moods.find((m) => m.id === userInfo.mood)?.label ||
                            "Select Mood"}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium group-hover:text-gray-900">
                        Select Mood
                      </span>
                    )}
                    <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Menu.Button>

                <Menu.Items className="absolute left-0 origin-top-right mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[100] max-h-[300px] overflow-y-auto sm:left-0 sm:right-auto sm:transform-none">
                  <div className="py-1">
                    {moods.map((mood) => (
                      <Menu.Item key={mood.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleMoodUpdate(mood.id)}
                            className={`w-full px-4 py-2 text-sm text-gray-700 flex items-center space-x-2 ${
                              active ? "bg-gray-100" : ""
                            }`}
                          >
                            <div className="w-4 h-4">
                              {React.createElement(mood.icon, {
                                className: "text-gray-600",
                              })}
                            </div>
                            <span>{mood.label}</span>
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            )}
            {isAuthenticated && (
              <Link
                href="/buzz/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Buzz
              </Link>
            )}
            <AuthButton />
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } sm:hidden bg-white border-t border-gray-200`}
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === "/" ||
              pathname === "/buzz" ||
              (pathname.startsWith("/buzz/") &&
                !pathname.startsWith("/buzz/my"))
                ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            All Buzzes
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/buzz/my/replies"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === "/buzz/my/replies"
                    ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                My Replies
              </Link>

              <Link
                href="/buzz/my"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === "/buzz/my"
                    ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                My Buzzes
              </Link>
            </>
          )}

          <Link
            href="/kol"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === "/kol"
                ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            KOLs
          </Link>
        </div>

        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            {isAuthenticated && (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1 group border rounded-md px-3 py-1.5 hover:bg-gray-50">
                  <div className="flex items-center space-x-1">
                    {userInfo?.mood ? (
                      <>
                        {moods.find((m) => m.id === userInfo.mood)?.icon && (
                          <div className="w-4 h-4">
                            {React.createElement(
                              moods.find((m) => m.id === userInfo.mood)!.icon,
                              { className: "text-gray-600" }
                            )}
                          </div>
                        )}
                        <span className="font-medium group-hover:text-gray-900">
                          {moods.find((m) => m.id === userInfo.mood)?.label ||
                            "Select Mood"}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium group-hover:text-gray-900">
                        Select Mood
                      </span>
                    )}
                    <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </Menu.Button>

                <Menu.Items className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[100] max-h-[300px] overflow-y-auto origin-top-right">
                  <div className="py-1">
                    {moods.map((mood) => (
                      <Menu.Item key={mood.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleMoodUpdate(mood.id)}
                            className={`w-full px-4 py-2 text-sm text-gray-700 flex items-center space-x-2 ${
                              active ? "bg-gray-100" : ""
                            }`}
                          >
                            <div className="w-4 h-4">
                              {React.createElement(mood.icon, {
                                className: "text-gray-600",
                              })}
                            </div>
                            <span>{mood.label}</span>
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
