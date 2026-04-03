import {
  HeartIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { NavLink, Outlet } from "react-router-dom";

import type { ComponentType, SVGProps } from "react";

import { WalletConnectButton } from "./WalletConnectButton";

type TabIcon = ComponentType<SVGProps<SVGSVGElement>>;

const nav: {
  to: string;
  label: string;
  end: boolean;
  Icon: TabIcon;
}[] = [
  { to: "/", label: "탐색", end: true, Icon: MagnifyingGlassIcon },
  { to: "/matches", label: "매칭", end: false, Icon: HeartIcon },
  { to: "/profile", label: "나", end: false, Icon: UserCircleIcon },
];

export function AppLayout() {
  return (
    <div className="app-viewport">
      <div className="phone">
        <div className="shell">
          <header className="topbar">
            <div className="topbar__row">
              <span className="topbar__logo">monad+</span>
              <div className="topbar__actions">
                <WalletConnectButton />
              </div>
            </div>
          </header>

          <main className="main">
            <Outlet />
          </main>
        </div>

        <nav className="tabbar" aria-label="주요 메뉴">
          {nav.map((item) => {
            const TabIcon = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  ["tabbar__link", isActive ? "tabbar__link--active" : ""].join(
                    " ",
                  )
                }
              >
                <TabIcon
                  className="tabbar__icon"
                  width={22}
                  height={22}
                  aria-hidden
                />
                <span className="tabbar__label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
