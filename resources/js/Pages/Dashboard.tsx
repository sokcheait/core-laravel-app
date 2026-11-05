import { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

/* ---------- Types (data comes from DashboardController) ---------- */
type Stat = { label: string; value: string | number; animate?: boolean };
type RoleRow = { id: number | string; name: string; users: number; perms: number };
type UserRow = { id: number | string; name: string; email: string; role: string | null; time: string; avatar_url?: string | null };
type Props = {
    stats: Stat[];
    roles: RoleRow[];
    userCount: number;
    permissionCount: number;
    users: UserRow[];
};

/* ---------- Shared class names (primary-* comes from your @theme) ---------- */
const card =
    'rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_32px_-16px_rgba(16,24,40,0.18)] ring-1 ring-gray-950/5 dark:bg-gray-900 dark:shadow-none dark:ring-white/10';
const muted = 'text-sm text-gray-500 dark:text-gray-400';

/* ---------- Small components ---------- */
const ICON_PATHS = {
    users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 8v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Zm-3 9 2 2 4-4',
    key: 'M15 7a4 4 0 1 1-3.9 4.9L4 19v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7Zm1 1h.01',
    calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    idcard: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 4c.4-1.5 1.5-2.2 3-2.2s2.6.7 3 2.2M14 10h4m-4 4h3',
    chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
    userPlus: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6m3-3h-6',
    clock: 'M12 7v5l3 2m-3 7a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
    pause: 'M9 5v14M15 5v14',
    play: 'M8 5v14l11-7L8 5Z',
    search: 'M21 21l-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
    inbox: 'M3 13l3-8h12l3 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Zm0 0h5l1 2h6l1-2h5',
} as const;
type IconName = keyof typeof ICON_PATHS;

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}

/* Pick an icon from the stat label; falls back by position */
const FALLBACK: IconName[] = ['users', 'shield', 'key', 'calendar', 'idcard'];
function iconFor(label: string, i: number): IconName {
    const l = label.toLowerCase();
    if (l.includes('permission')) return 'key';
    if (l.includes('role')) return 'shield';
    if (l.includes('member') || l.includes('since') || l.includes('date')) return 'calendar';
    if (l.includes('id')) return 'idcard';
    if (l.includes('user')) return 'users';
    return FALLBACK[i % FALLBACK.length];
}

function IconChip({ name }: { name: IconName }) {
    return (
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/60 text-primary-600 ring-1 ring-primary-100 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary-600 group-hover:text-white group-hover:ring-primary-600 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/20 dark:group-hover:bg-primary-500 dark:group-hover:text-white">
            <Icon name={name} />
        </span>
    );
}

function Empty({ icon, children }: { icon: IconName; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <Icon name={icon} className="size-6" />
            </span>
            <p className={muted}>{children}</p>
        </div>
    );
}

function Avatar({ name, url, large = false }: { name: string; url?: string | null; large?: boolean }) {
    const [failed, setFailed] = useState(false); // expired or broken URL -> fall back to initials
    const initials = name.split(' ').map((s) => s[0]).join('').slice(0, 2);

    if (url && !failed) {
        return (
            <img
                src={url}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
                className={`theme-pop shrink-0 rounded-full object-cover ${
                    large ? 'size-14 ring-2 ring-white/40' : 'size-10 ring-1 ring-gray-200 dark:ring-gray-700'
                }`}
            />
        );
    }

    return (
        <span
            className={`theme-pop grid place-items-center rounded-full font-semibold uppercase ${
                large
                    ? 'size-14 bg-white/20 text-lg text-white ring-2 ring-white/40'
                    : 'size-10 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
            }`}
        >
            {initials}
        </span>
    );
}

function Bar({ pct }: { pct: number }) {
    return (
        <span className="h-2 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner dark:bg-gray-800">
            <i
                className="block h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
            />
        </span>
    );
}

/* Every digit gets the same width, so running numbers never wobble.
   With `roll`, a digit that changes slides in from below (live ticking). */
function Digits({ text, roll = false }: { text: string | number; roll?: boolean }) {
    return (
        <>
            {String(text).split('').map((c, i) =>
                /\d/.test(c) ? (
                    <span key={i} className="relative inline-block w-[0.62em] overflow-hidden text-center">
                        <span key={roll ? c : 'static'} className={`inline-block ${roll ? 'digit-in' : ''}`}>{c}</span>
                    </span>
                ) : (
                    <span key={i}>{c}</span>
                )
            )}
        </>
    );
}

function CountUp({ value }: { value: number }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const tick = (t: number) => {
            const k = Math.min((t - start) / 800, 1);
            setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
            if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <Digits text={n} />;
}

function SectionTitle({ icon, children, flush = false }: { icon: IconName; children: React.ReactNode; flush?: boolean }) {
    return (
        <h3 className={`${flush ? '' : 'mb-4'} flex items-center gap-3 font-semibold`}>
            <span className="grid size-8 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <Icon name={icon} className="size-4" />
            </span>
            {children}
        </h3>
    );
}

/* ---------- Header clock (compact, glass style for the banner) ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
const RING = 2 * Math.PI * 53; // seconds progress ring circumference

function HeaderClock() {
    const [now, setNow] = useState(() => new Date());
    const [h24, setH24] = useState(false);
    const [running, setRunning] = useState(true);
    const hourRef = useRef<HTMLSpanElement>(null);
    const minRef = useRef<HTMLSpanElement>(null);
    const secRef = useRef<HTMLSpanElement>(null);
    const ringRef = useRef<SVGCircleElement>(null);

    // Smooth analog hands: the hands move a little on every animation frame (no React re-render),
    // so they sweep continuously like a real clock. With reduced motion they step once per second.
    useEffect(() => {
        if (!running) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0;
        const frame = () => {
            const d = new Date();
            const sec = d.getSeconds() + (reduce ? 0 : d.getMilliseconds() / 1000);
            const min = d.getMinutes() + sec / 60;
            const hr = (d.getHours() % 12) + min / 60;
            const put = (el: HTMLElement | SVGElement | null, deg: number) => {
                if (el) el.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
            };
            put(hourRef.current, hr * 30);
            put(minRef.current, min * 6);
            put(secRef.current, sec * 6);
            ringRef.current?.setAttribute('stroke-dashoffset', String(RING * (1 - sec / 60)));
            raf = requestAnimationFrame(frame);
        };
        frame();
        return () => cancelAnimationFrame(raf);
    }, [running]);

    useEffect(() => {
        if (!running) return;
        let id = 0;
        // Re-aim at the next real second boundary every time, so the display never drifts,
        // repeats a second or skips one (a plain setInterval slowly slides off the true second).
        const tick = () => {
            const d = new Date();
            setNow(d);
            id = window.setTimeout(tick, 1000 - d.getMilliseconds() + 5);
        };
        tick(); // also jumps to the real time on resume
        const resync = () => {
            if (document.visibilityState !== 'visible') return;
            setNow(new Date());
        };
        document.addEventListener('visibilitychange', resync);
        return () => {
            window.clearTimeout(id);
            document.removeEventListener('visibilitychange', resync);
        };
    }, [running]);

    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const hh = h24 ? h : h % 12 || 12;
    const isDay = h >= 6 && h < 18;
    const dayNum = now.getDate();
    const monthShort = now.toLocaleDateString(undefined, { month: 'short' });
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const fullDate = now.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const dayOfYear = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    // ISO week number
    const wk = (() => {
        const t = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
        return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
    })();
    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone ?? '').split('/').pop()?.replace(/_/g, ' ');

    // Transform is set by the animation loop above, so React must not set it here
    const hand = (ref: React.RefObject<HTMLSpanElement | null>, w: number, len: number, cls: string, tail = false) => (
        <span
            ref={ref}
            aria-hidden
            className={`absolute left-1/2 top-1/2 rounded-full will-change-transform ${cls}`}
            style={{ width: w, height: `${len}%`, transformOrigin: '50% 100%', transform: 'translate(-50%, -100%)' }}
        >
            {tail && <span className="absolute left-0 top-full h-2.5 w-full rounded-full bg-inherit" />}
        </span>
    );

    return (
        <div
            className={`theme-rise group/clock flex w-full max-w-full flex-col gap-3 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 p-4 ring-1 ring-white/20 backdrop-blur-sm transition-shadow duration-500 sm:w-auto ${
                running ? 'shadow-[0_0_36px_rgba(94,234,212,0.22)]' : 'shadow-none'
            }`}
            style={{ animationDelay: '250ms' }}
        >
            <div className="flex items-center gap-3 sm:gap-4">
            {/* Analog face with seconds progress ring */}
            <div role="img" aria-label={`Analog clock, ${pad(hh)}:${pad(m)}`} className="relative size-24 shrink-0 sm:size-28">
                <svg viewBox="0 0 112 112" className="absolute inset-0 size-full -rotate-90" aria-hidden>
                    <circle cx="56" cy="56" r="53" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <circle
                        ref={ringRef}
                        cx="56" cy="56" r="53" fill="none" strokeWidth="2.5" strokeLinecap="round"
                        className={running ? 'stroke-primary-200' : 'stroke-white/40'}
                        strokeDasharray={RING}
                        strokeDashoffset={RING} /* updated every frame by the animation loop */
                    />
                </svg>
                <div className="absolute inset-[7px] rounded-full bg-white/10 shadow-inner ring-1 ring-white/20">
                    {Array.from({ length: 12 }, (_, i) => (
                        <span key={i} aria-hidden className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 30}deg)` }}>
                            <span className={`mt-1.5 rounded-full bg-white ${i % 3 === 0 ? 'h-2 w-0.5 opacity-90' : 'h-1 w-px opacity-50'}`} />
                        </span>
                    ))}
                    {Array.from({ length: 12 }, (_, i) => {
                        const rad = (i * 30 * Math.PI) / 180;
                        const quarter = i % 3 === 0;
                        return (
                            <span
                                key={`n${i}`}
                                aria-hidden
                                className={`absolute -translate-x-1/2 -translate-y-1/2 select-none text-[9px] leading-none tabular-nums sm:text-[10px] ${
                                    quarter ? 'font-bold text-white' : 'font-medium text-white/65'
                                }`}
                                style={{ left: `${50 + Math.sin(rad) * 33}%`, top: `${50 - Math.cos(rad) * 33}%` }}
                            >
                                {i === 0 ? 12 : i}
                            </span>
                        );
                    })}
                    {hand(hourRef, 3, 25, 'bg-white')}
                    {hand(minRef, 2, 36, 'bg-white/90')}
                    {hand(secRef, 1, 42, running ? 'bg-primary-200 shadow-[0_0_6px_rgba(153,246,228,0.9)]' : 'bg-white/50', true)}
                    <span aria-hidden className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-200 ring-2 ring-primary-800" />
                </div>
            </div>

            {/* Digital time */}
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <button
                        type="button"
                        onClick={() => setH24((v) => !v)}
                        title={h24 ? 'Switch to 12-hour' : 'Switch to 24-hour'}
                        className="block whitespace-nowrap rounded text-left transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                        <span className={`whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight transition-opacity sm:text-3xl ${running ? '' : 'opacity-70'}`}>
                            <Digits text={pad(hh)} />
                            <span className={`mx-0.5 inline-block ${running ? 'motion-safe:animate-pulse' : 'opacity-50'}`}>:</span>
                            <Digits text={pad(m)} roll />
                        </span>
                    </button>
                        <span
                            className={`inline-flex items-baseline gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 align-middle text-xl font-semibold tabular-nums ring-1 transition-all duration-300 ${
                                running
                                    ? 'bg-white/15 text-white shadow-[0_0_16px_rgba(153,246,228,0.35)] ring-primary-200/50'
                                    : 'bg-white/5 text-white/60 ring-white/20'
                            }`}
                        >
                            <Digits text={pad(s)} roll />
                            <span className="text-[10px] font-medium uppercase tracking-wide text-primary-100">sec</span>
                        </span>
                        {!h24 && <span className="text-sm font-medium text-primary-100">{h < 12 ? 'AM' : 'PM'}</span>}
                    <span key={isDay ? 'day' : 'night'} className={`theme-pop ${isDay ? 'text-amber-200' : 'text-primary-100'}`} title={isDay ? 'Daytime' : 'Night'}>
                        <Icon name={isDay ? 'sun' : 'moon'} className="size-5" />
                    </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-primary-100">
                    <button
                        type="button"
                        aria-pressed={running}
                        onClick={() => setRunning((v) => !v)}
                        title={running ? 'Click to pause' : 'Click to resume live time'}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ring-1 transition duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                            running ? 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/40' : 'bg-amber-400/20 text-amber-100 ring-amber-300/40'
                        }`}
                    >
                        {running ? (
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full rounded-full bg-emerald-300 opacity-70 motion-safe:animate-ping" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                            </span>
                        ) : (
                            <Icon name="play" className="size-3" />
                        )}
                        {running ? 'LIVE' : 'PAUSED'}
                    </button>
                    {tz && (
                        <span className="inline-flex items-center gap-1.5 opacity-90">
                            <Icon name="clock" className="size-3.5" />
                            {tz}
                        </span>
                    )}
                </div>
            </div>
            </div>

            {/* Date under the clock */}
            <div className="flex items-center gap-3 border-t border-white/15 pt-3">
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15 text-center leading-none ring-1 ring-white/25">
                    <span>
                        <span className="block bg-primary-200/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-900">{monthShort}</span>
                        <span key={dayNum} className="theme-pop block pb-0.5 pt-1 text-lg font-bold tabular-nums">{dayNum}</span>
                    </span>
                </span>
                <div className="min-w-0">
                    <p className="truncate font-medium">{weekday}</p>
                    <p className="truncate text-xs text-primary-100">
                        {fullDate}
                        <span className="mx-1.5 opacity-50">·</span>Week {wk}
                        <span className="mx-1.5 opacity-50">·</span>Day {dayOfYear}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ---------- Users table (premium) ---------- */
const LIMIT = 2; // how many users the table shows

/* Each role gets a stable tint, picked from its name. Full class strings so Tailwind keeps them. */
const ROLE_TINTS = [
    'bg-primary-50 text-primary-700 ring-primary-200/70 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/25',
    'bg-violet-50 text-violet-700 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/25',
    'bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25',
    'bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25',
    'bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25',
];
const roleTint = (name: string) => ROLE_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % ROLE_TINTS.length];

function UsersTable({ users, total }: { users: UserRow[]; total: number }) {
    const [q, setQ] = useState('');
    const list = useMemo(() => {
        const t = q.trim().toLowerCase();
        return users.filter((u) => !t || u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t));
    }, [users, q]);
    const shown = list.slice(0, LIMIT);

    const th = 'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400';

    return (
        <section
            className={`theme-rise overflow-hidden ${card}`}
            style={{ animationDelay: '120ms' }}
        >
            {/* Header: title, count, search */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <SectionTitle icon="users" flush>Users</SectionTitle>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {total}
                    </span>
                </div>
                <label className="relative block w-full sm:w-72">
                    <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name or email"
                        aria-label="Search users"
                        className="w-full rounded-xl border border-transparent bg-gray-100/80 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 hover:bg-gray-100 focus:border-primary-500/60 focus:bg-white focus:ring-4 focus:ring-primary-500/15 dark:bg-gray-800/70 dark:hover:bg-gray-800 dark:focus:bg-gray-900"
                    />
                </label>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-120 border-collapse text-left">
                    <thead>
                        <tr className="bg-gradient-to-b from-gray-50 to-gray-50/40 dark:from-gray-800/60 dark:to-gray-800/20">
                            <th scope="col" className={th}>User</th>
                            <th scope="col" className={th}>Role</th>
                            <th scope="col" className={`${th} text-right`}>Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                        {shown.map((u, i) => (
                            <tr
                                key={u.id}
                                className="theme-rise group/row transition-colors duration-200 hover:bg-primary-50/50 dark:hover:bg-primary-500/[0.06]"
                                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                            >
                                <td className="relative px-6 py-4">
                                    {/* accent bar that grows in on hover */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-y-3 left-0 w-0.5 origin-center scale-y-0 rounded-full bg-primary-500 transition-transform duration-200 group-hover/row:scale-y-100"
                                    />
                                    <div className="flex items-center gap-3.5">
                                        <span className="rounded-full p-0.5 ring-1 ring-gray-200 transition group-hover/row:ring-primary-400 dark:ring-gray-700 dark:group-hover/row:ring-primary-500/60">
                                            <Avatar name={u.name} url={u.avatar_url} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
                                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {u.role ? (
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${roleTint(u.role)}`}>
                                            <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
                                            {u.role}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 dark:text-gray-500">No role</span>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                    <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-gray-500 dark:text-gray-400">
                                        <Icon name="clock" className="size-3.5 opacity-60" />
                                        {u.time}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {list.length === 0 && (
                <div className="border-t border-gray-100 px-6 dark:border-gray-800">
                    <Empty icon={q ? 'search' : 'inbox'}>
                        {q ? `No users match “${q}”. Try a different name or email.` : 'No users yet.'}
                    </Empty>
                </div>
            )}

            {/* Footer: count + share of all users shown */}
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5 dark:border-gray-800 dark:bg-gray-800/30">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{shown.length}</span> of{' '}
                    <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{total}</span> users
                </p>
                <div className="flex items-center gap-4">
                    {q && (
                        <button
                            type="button"
                            onClick={() => setQ('')}
                            className="rounded text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Clear search
                        </button>
                    )}
                    <span className="hidden w-28 sm:block" aria-hidden>
                        <Bar pct={total ? (shown.length / total) * 100 : 0} />
                    </span>
                </div>
            </div>
        </section>
    );
}

/* ---------- Role breakdown card (shared by both bar charts) ---------- */
function RoleCard({
    icon, title, delay, empty, children,
}: { icon: IconName; title: string; delay: number; empty: React.ReactNode; children: React.ReactNode }) {
    const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
    return (
        <section className={`theme-rise overflow-hidden ${card}`} style={{ animationDelay: `${delay}ms` }}>
            <div className="border-b border-gray-100 px-6 py-2 dark:border-gray-800">
                <SectionTitle icon={icon} flush>{title}</SectionTitle>
            </div>
            <div className="divide-y divide-gray-100 px-6 py-2 dark:divide-gray-800/70">
                {hasRows ? children : null}
            </div>
            {!hasRows && <div className="px-6 pb-4">{empty}</div>}
        </section>
    );
}

/* ---------- Dashboard ---------- */
export default function Dashboard({ stats, roles, userCount, permissionCount, users }: Props) {
    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
        >
            <div className="space-y-6">
                {/* 1. Clock on the left, users table on the right (stacked on small screens) */}
                <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
                    <div className="theme-rise relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-primary-900 p-4 text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.55)] ring-1 ring-white/10 lg:sticky lg:top-6">
                        {/* soft light in the corner */}
                        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />
                        <div className="relative">
                            <HeaderClock />
                        </div>
                    </div>
                    {/* 2. Stats */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        {stats.map((s, i) => (
                            <div
                                key={s.label}
                                className={`theme-rise group relative flex items-center gap-4 overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,0.06),0_20px_40px_-18px_rgba(16,24,40,0.28)] ${card}`}
                                style={{ animationDelay: `${i * 90}ms` }}
                            >
                                {/* thin accent line along the top edge */}
                                <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-linear-to-r from-transparent via-primary-400/70 to-transparent" />
                                <Icon
                                    name={iconFor(s.label, i)}
                                    className="pointer-events-none absolute -bottom-4 -right-3 size-24 text-primary-500/[0.07] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                                />
                                <IconChip name={iconFor(s.label, i)} />
                                <div className="relative min-w-0">
                                    <p className={muted}>{s.label}</p>
                                    <p className="mt-0.5 truncate text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
                                        {typeof s.value === 'number' && s.animate !== false ? <CountUp value={s.value} /> : s.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Role bars */}
                <div className="grid gap-6 md:grid-cols-2">
                    <RoleCard
                        icon="chart"
                        title="Users by role"
                        delay={200}
                        empty={<Empty icon="shield">No roles yet. Create a role to see how users are spread across it.</Empty>}
                    >
                        {roles.map((r) => {
                            const pct = userCount ? (r.users / userCount) * 100 : 0;
                            return (
                                <div key={r.id} className="grid grid-cols-[110px_1fr_64px] items-center gap-4 py-3.5">
                                    <span className="truncate font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                                    <Bar pct={pct} />
                                    <span className="text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">{r.users}</span>
                                        <span className="ml-1.5 text-xs">{Math.round(pct)}%</span>
                                    </span>
                                </div>
                            );
                        })}
                    </RoleCard>

                    <RoleCard
                        icon="lock"
                        title="Permissions per role"
                        delay={280}
                        empty={<Empty icon="lock">No roles yet. Permissions appear here once a role has them.</Empty>}
                    >
                        {roles.map((r) => (
                            <div key={r.id} className="grid grid-cols-[110px_1fr_64px] items-center gap-4 py-3.5">
                                <span className="truncate font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                                <Bar pct={permissionCount ? (r.perms / permissionCount) * 100 : 0} />
                                <span className="text-right text-sm tabular-nums text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{r.perms}</span>
                                    <span className="text-xs">/{permissionCount}</span>
                                </span>
                            </div>
                        ))}
                    </RoleCard>
                </div>

                <UsersTable users={users} total={userCount} />
            </div>
        </AppLayout>
    );
}