/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  safelist: [
    "bt-text-heading-1",
    "bt-text-heading-2",
    "bt-text-heading-3",
    "bt-text-heading-4",
    "bt-text-heading-5",
    "bt-text-heading-6",
    "bt-text-body-l",
    "bt-text-body-m",
    "bt-text-body-s",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "grid-cols-5",
    "grid-cols-6",
    "grid-cols-7",
    "grid-cols-8",
    "grid-cols-9",
    "grid-cols-10",
    "grid-cols-11",
    "grid-cols-12",
    "col-span-1",
    "col-span-2",
    "col-span-3",
    "col-span-4",
    "col-span-5",
    "col-span-6",
    "col-span-7",
    "col-span-8",
    "col-span-9",
    "col-span-10",
    "col-span-11",
    "col-span-12",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ["SupremeLL", "sans-serif"],
      },
      fontWeight: {
        "bt-thin": "100",
        "bt-extralight": "200",
        "bt-light": "300",
        "bt-regular": "400",
        "bt-medium": "500",
        "bt-semibold": "600",
        "bt-bold": "700",
        "bt-extrabold": "800",
      },
      screens: {
        xs: "20rem",
        sm: "40rem",
        md: "48rem",
        lg: "64rem",
        xl: "80rem",
        "2xl": "96rem",
        "3xl": "112rem",
      },
      gridTemplateColumns: {
        "bt-2": "minmax(0, 39.5rem) minmax(0, 27.5rem)",
      },
      spacing: {
        "bt-spacing-4": "0.25rem",
        "bt-spacing-8": "0.5rem",
        "bt-spacing-12": "0.75rem",
        "bt-spacing-16": "1rem",
        "bt-spacing-24": "1.5rem",
        "bt-spacing-32": "2rem",
        "bt-spacing-40": "2.5rem",
        "bt-spacing-44": "2.75rem",
        "bt-spacing-64": "4rem",
      },
      boxShadow: {
        "bt-elevation-0":
          "0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.12)",
        "bt-elevation-100": "0 1px 2px rgba(17,24,39,0.08)",
        "bt-elevation-200": "0 2px 4px rgba(17,24,39,0.12)",
        "bt-elevation-300": "0 4px 8px rgba(17,24,39,0.14)",
        "bt-elevation-400": "0 8px 16px rgba(17,24,39,0.18)",
        "bt-elevation-500": "0 12px 24px rgba(17,24,39,0.22)",
      },
      borderRadius: {
        xs: "0.125rem",
        s: "0.25rem",
        m: "0.5rem",
        l: "0.75rem",
        full: "9999px",
      },
      colors: {
        /* =========================
           BRAND – ACERO / SEGURIDAD
        ========================== */
        "bt-primary-50": "#F3F6F9",
        "bt-primary-100": "#E5EBF1",
        "bt-primary-200": "#CBD5E1",
        "bt-primary-300": "#94A3B8",
        "bt-primary-400": "#64748B",
        "bt-primary-500": "#334155", // acero principal
        "bt-primary-600": "#1E293B",
        "bt-primary-700": "#0F172A",
        "bt-primary-800": "#020617",
        "bt-primary-900": "#020617",

        /* =========================
           ACCENT – BRONCE / LLAVES
        ========================== */
        "bt-accent-50": "#FFF8EB",
        "bt-accent-100": "#FDEFD3",
        "bt-accent-200": "#F9D8A4",
        "bt-accent-300": "#F4BF6A",
        "bt-accent-400": "#E6A84A",
        "bt-accent-500": "#C8922E", // latón
        "bt-accent-600": "#A8791F",
        "bt-accent-700": "#7A5616",
        "bt-accent-800": "#533A0F",

        /* =========================
           GREYS – METAL / UI
        ========================== */
        "bt-grey-50": "#FAFAFA",
        "bt-grey-100": "#F4F4F5",
        "bt-grey-200": "#E4E4E7",
        "bt-grey-300": "#D4D4D8",
        "bt-grey-400": "#A1A1AA",
        "bt-grey-500": "#71717A",
        "bt-grey-600": "#52525B",
        "bt-grey-700": "#3F3F46",
        "bt-grey-800": "#27272A",
        "bt-grey-900": "#18181B",

        /* =========================
           STATES
        ========================== */
        "bt-hover": "rgba(51,65,85,0.12)",
        "bt-pressed": "rgba(51,65,85,0.18)",
        "bt-disabled": "#E5E7EB",
        "bt-focus": "#64748B",

        "bt-white": "#FFFFFF",

        /* SUCCESS */
        "bt-success-100": "#ECFDF5",
        "bt-success-300": "#6EE7B7",
        "bt-success-500": "#10B981",
        "bt-success-700": "#047857",

        /* WARNING */
        "bt-warning-100": "#FFF7ED",
        "bt-warning-300": "#FDBA74",
        "bt-warning-500": "#F59E0B",
        "bt-warning-700": "#B45309",

        /* ERROR */
        "bt-error-100": "#FEE2E2",
        "bt-error-300": "#FCA5A5",
        "bt-error-500": "#EF4444",
        "bt-error-700": "#B91C1C",

        /* INFO */
        "bt-info-100": "#EFF6FF",
        "bt-info-300": "#93C5FD",
        "bt-info-500": "#3B82F6",
        "bt-info-700": "#1D4ED8",
      },
    },
  },
  plugins: [],
};
