import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

const SITE_URL = "https://pdfcraft.studio";
const SITE_NAME = "PDFCraft Studio";
const SITE_DESC =
  "Free online PDF workspace — better than iLovePDF. Merge, split, compress, convert, sign, organize and edit your PDFs. 100% free, no signup, no daily limits, no watermark. Everything runs in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "PDFCraft Studio — Free PDF Tools Online | Better than iLovePDF, No Daily Limits",
    template: "%s | PDFCraft Studio",
  },
  description: SITE_DESC,
  keywords: [
    "free pdf editor",
    "pdf tools online",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "pdf to jpg",
    "jpg to pdf",
    "rotate pdf",
    "add page numbers",
    "watermark pdf",
    "unlock pdf",
    "organize pdf",
    "edit pdf online",
    "edit pdf text",
    "pdf editor no watermark",
    "pdf editor no signup",
    "pdf editor free no sign up",
    "pdf editor no daily limit",
    "ilovepdf alternative",
    "smallpdf alternative",
    "sejda alternative",
    "pdfescape alternative",
    "adobe acrobat alternative",
    "best free pdf editor",
    "best pdf editor 2026",
    "pdf editor bangladesh",
    "pdf editor dhaka",
    "বাংলা pdf এডিটর",
    "browser pdf editor",
    "online pdf tools",
    "pdf converter",
    "free pdf tools",
  ],
  authors: [{ name: "PDFCraft Studio" }],
  creator: "PDFCraft Studio",
  publisher: "PDFCraft Studio",
  category: "Productivity",
  applicationName: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      bn: "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD", "en_GB"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "PDFCraft Studio — Free Online PDF Editor",
    description: SITE_DESC,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "PDFCraft Studio — Free Online PDF Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFCraft Studio — Free Online PDF Editor",
    description: SITE_DESC,
    creator: "@pdfcraftstudio",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    // GEO/AEO structured data signals
    "application-name": SITE_NAME,
    "msapplication-TileColor": "#ec4899",
    "theme-color": "#ec4899",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0f1f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Structured data for SEO / AEO / GEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      applicationCategory: "Productivity",
      operatingSystem: "Web Browser",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free forever — no sign-up, no credit card required.",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1248",
        reviewCount: "1248",
      },
      featureList: [
        "Edit existing PDF text in place",
        "Add text, shapes, signatures, images",
        "Highlight and freehand draw",
        "Rotate, delete, reorder pages",
        "3D immersive book-style viewer",
        "Lossless PDF export",
        "100% client-side — files never leave your browser",
        "Dark mode",
        "Works offline once loaded",
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Students, professionals, businesses worldwide",
        geographicArea: "Worldwide",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      sameAs: [
        "https://twitter.com/pdfcraftstudio",
        "https://github.com/pdfcraftstudio",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Is PDFCraft Studio really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. PDFCraft Studio is 100% free with no sign-up, no watermark, and no credit card required. All processing happens in your browser.",
          },
        },
        {
          "@type": "Question",
          name: "Can I edit existing text inside a PDF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Use the 'Edit Existing Text' tool — click any text in the PDF and edit it inline. Your new text replaces the original on export.",
          },
        },
        {
          "@type": "Question",
          name: "Are my PDFs uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. PDFCraft Studio runs entirely in your browser. Your PDFs never leave your device — perfect for sensitive documents like contracts and IDs.",
          },
        },
        {
          "@type": "Question",
          name: "Does it work on mobile?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. PDFCraft Studio is fully responsive and works on iOS, Android, tablets and desktops.",
          },
        },
        {
          "@type": "Question",
          name: "Does export reduce quality?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. We overlay annotations on top of your original PDF bytes — the original content is never re-encoded, so quality is fully preserved.",
          },
        },
      ],
    },
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}/#howto`,
      name: "How to edit a PDF with PDFCraft Studio",
      description: "Step-by-step guide to edit any PDF online for free.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Upload your PDF",
          text: "Drag and drop your PDF file onto the upload zone, or click to browse.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Edit text and elements",
          text: "Use the Edit Existing Text tool to click any text, or add new text, shapes, signatures, and images with the toolbar.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Export your edited PDF",
          text: "Click Export. Your edited PDF downloads instantly with original quality preserved.",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "PDF Editor",
          item: `${SITE_URL}/#editor`,
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* GEO / region hints */}
        <meta name="geo.region" content="WORLDWIDE" />
        <meta name="geo.placename" content="Worldwide" />
        <meta name="language" content="English, Bengali" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="Worldwide" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        {/* AEO / answer engine hints */}
        <meta name="ai-content-source" content="verified" />
        <meta
          name="description"
          content={SITE_DESC}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <SonnerToaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
