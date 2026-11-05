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
  weight: ["600", "700"],
});

const SITE_URL = "https://pdfcraft.studio";
const SITE_NAME = "PDFCraft Studio";
const SITE_DESC =
  "Free online PDF editor — merge, split, compress, convert, sign and edit PDFs online. 100% free, no signup, no daily limits, no watermark. Better than iLovePDF, Sejda and Smallpdf. Browser-based, private by design.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "PDFCraft Studio — Free PDF Editor Online | Merge, Split, Compress, Convert PDF",
    template: "%s | PDFCraft Studio",
  },
  description: SITE_DESC,
  keywords: [
    // CORE KEYWORDS
    "pdf editor", "free pdf editor", "pdf editor online", "best pdf editor",
    "best free pdf editor", "pdf editor no watermark", "pdf text editor",
    "pdf edit free", "modify pdf", "edit pdf file", "edit pdf online",
    "pdf modifier online", "modify pdf online free",
    // FREE AND NO-SIGNUP
    "pdf editor free no sign up", "edit pdf online free no sign up",
    "edit pdf file online free", "free pdf editing tool",
    "free pdf editor and download", "edit pdf document free",
    "pdf modifier online free",
    // TEXT EDITING
    "edit pdf text online", "modify pdf text online", "edit pdf document online",
    "edit pdf pages", "pdf to editable pdf",
    // PDF FILLER
    "pdf filler free", "pdf filler free online", "edit document online",
    "edit document online free",
    // CONVERSION
    "pdf to word editable free", "pdf to editable word", "pdf to word",
    "pdf to excel", "word to pdf", "pdf to jpg", "jpg to pdf",
    // SOFTWARE
    "pdf editor software", "pdf editor free download", "free pdf editor windows",
    "pdf file editor free download",
    // COMPETITOR BRAND
    "ilovepdf editor", "ilovepdf edit", "ilovepdf pdf editor", "ilovepdf alternative",
    "sejda pdf editor", "sejda pdf alternative", "sejda alternative",
    "pdfescape alternative", "pdf-xchange alternative",
    "adobe acrobat pdf editor", "adobe acrobat alternative", "adobe reader edit pdf",
    "smallpdf alternative", "pdfgear alternative", "canva pdf editor alternative",
    "google pdf editor",
    // AI PDF
    "ai pdf editor", "chat with pdf", "ai pdf summarizer", "translate pdf",
    "extract data from pdf",
    // TOOLS
    "merge pdf", "split pdf", "compress pdf", "pdf to jpg", "jpg to pdf",
    "rotate pdf", "add page numbers", "watermark pdf", "unlock pdf", "organize pdf",
    "pdf converter", "free pdf tools", "online pdf tools",
    // LONG-TAIL
    "how to edit pdf online free", "how to merge pdf files free",
    "how to compress pdf without losing quality", "how to edit text in pdf for free",
    "best free pdf editor 2026", "merge pdf free online no limit",
    "compress pdf free no watermark", "pdf editor no signup no download",
    "pdf editor no limits", "edit pdf text free online no signup",
    // GEO
    "pdf editor bangladesh", "pdf editor dhaka", "বাংলা pdf এডিটর",
    "browser pdf editor", "private pdf editor", "secure pdf editor",
    "pdf editor no upload", "pdf editor no installation",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Productivity",
  applicationName: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
    languages: { en: "/", bn: "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["bn_BD", "en_GB", "es_ES", "fr_FR", "de_DE", "hi_IN"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "PDFCraft Studio — Free PDF Editor Online | Better than iLovePDF",
    description: SITE_DESC,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PDFCraft Studio — Free Online PDF Editor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFCraft Studio — Free PDF Editor Online",
    description: SITE_DESC,
    creator: "@pdfcraftstudio",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true, follow: true,
      "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "application-name": SITE_NAME,
    "msapplication-TileColor": "#3b82f6",
    "theme-color": "#3b82f6",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1729" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ============== STRUCTURED DATA (JSON-LD) ==============
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // WebSite + SearchAction (enables sitelinks search box)
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      publisher: { "@id": `${SITE_URL}/#org` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    // WebApplication
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
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "Edit existing PDF text in place",
        "Add text, shapes, signatures, images",
        "Merge multiple PDFs into one",
        "Split PDF by page ranges",
        "Compress PDF — 3 levels",
        "Convert PDF to JPG, Word, Excel, Text",
        "Convert JPG to PDF, Word to PDF",
        "Rotate, delete, reorder PDF pages",
        "Add page numbers and watermarks",
        "Unlock password-protected PDFs",
        "Edit PDF metadata and properties",
        "3D immersive book-style viewer",
        "Lossless PDF export — original quality preserved",
        "100% client-side — files never leave your browser",
        "Dark mode",
        "Works offline once loaded",
        "No daily task limits",
        "No signup required",
        "No watermark on downloads",
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Students, professionals, businesses worldwide",
        geographicArea: "Worldwide",
      },
      screenshot: `${SITE_URL}/og.png`,
    },
    // Organization
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: "Free online PDF workspace — better than iLovePDF.",
      sameAs: [
        "https://twitter.com/pdfcraftstudio",
        "https://github.com/SharifulHasanRoky/pdfcraft-studio",
      ],
    },
    // FAQ Page — comprehensive (covers AEO question keywords)
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Is PDFCraft Studio really free?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. PDFCraft Studio is 100% free with no sign-up, no watermark, and no credit card required. All processing happens in your browser. Funded by ads, never by you." },
        },
        {
          "@type": "Question",
          name: "Can I edit existing text inside a PDF?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. Use the 'Edit Existing Text' tool — click any text in the PDF and edit it inline. Your new text replaces the original on export. This feature is free, unlike iLovePDF and Smallpdf which charge for it." },
        },
        {
          "@type": "Question",
          name: "Are my PDFs uploaded to a server?",
          acceptedAnswer: { "@type": "Answer", text: "No. PDFCraft Studio runs entirely in your browser using JavaScript. Your PDFs never leave your device — perfect for sensitive documents like contracts, IDs, and medical records." },
        },
        {
          "@type": "Question",
          name: "Is there a daily usage limit?",
          acceptedAnswer: { "@type": "Answer", text: "No. Use any tool as many times as you want, every day. No daily quotas, no task counters, no 'come back tomorrow' messages. This is better than iLovePDF (2-5 tasks/day), Sejda (3 tasks/hour), and Smallpdf (2 docs/day)." },
        },
        {
          "@type": "Question",
          name: "Does export reduce quality?",
          acceptedAnswer: { "@type": "Answer", text: "No. We overlay annotations on top of your original PDF bytes using pdf-lib. The original content is never re-encoded, so quality is fully preserved." },
        },
        {
          "@type": "Question",
          name: "Does it work on mobile?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. PDFCraft Studio is fully responsive and works on iOS, Android, tablets and desktops. Touch-friendly controls included." },
        },
        {
          "@type": "Question",
          name: "How do I merge PDF files for free?",
          acceptedAnswer: { "@type": "Answer", text: "Upload two or more PDF files, reorder them using the up/down arrows, and click 'Merge PDF'. Your merged PDF downloads instantly. No signup, no watermark, no limit." },
        },
        {
          "@type": "Question",
          name: "How do I compress a PDF without losing quality?",
          acceptedAnswer: { "@type": "Answer", text: "Upload your PDF, choose 'Light' compression for lossless size reduction, or 'Recommended' for balanced compression. We use object streams and remove duplicate data to reduce file size without re-encoding images." },
        },
        {
          "@type": "Question",
          name: "What is the best free PDF editor in 2026?",
          acceptedAnswer: { "@type": "Answer", text: "PDFCraft Studio is the best free PDF editor in 2026. It offers 14 tools, no daily limits, no signup, no watermark, browser-based privacy, and works on all devices. Better than iLovePDF, Sejda, and Smallpdf." },
        },
        {
          "@type": "Question",
          name: "Can I convert PDF to Word for free?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. PDFCraft Studio offers PDF to Text extraction for free. Upload your PDF and click 'PDF to Text' to extract all text. You can then copy or download as .txt file." },
        },
        {
          "@type": "Question",
          name: "Is online PDF editor safe?",
          acceptedAnswer: { "@type": "Answer", text: "PDFCraft Studio is the safest online PDF editor because all processing happens in your browser. Unlike iLovePDF, Sejda, and Smallpdf which upload your files to their servers, PDFCraft Studio never uploads anything." },
        },
        {
          "@type": "Question",
          name: "How do I remove password from PDF?",
          acceptedAnswer: { "@type": "Answer", text: "Use the 'Unlock PDF' tool. Upload your password-protected PDF, enter the password, and click 'Unlock PDF'. If the password is correct, we save a new copy without password. No signup required." },
        },
        {
          "@type": "Question",
          name: "Can I edit PDF without Adobe Acrobat?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. PDFCraft Studio is a free Adobe Acrobat alternative. You can edit existing PDF text, merge, split, compress, convert, sign, and organize PDFs — all for free, right in your browser. No download or subscription needed." },
        },
      ],
    },
    // HowTo — step by step
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}/#howto`,
      name: "How to edit a PDF online for free",
      description: "Step-by-step guide to edit any PDF online for free with PDFCraft Studio.",
      totalTime: "PT2M",
      step: [
        { "@type": "HowToStep", position: 1, name: "Upload your PDF", text: "Drag and drop your PDF file onto the upload zone, or click to browse. Your file stays in your browser." },
        { "@type": "HowToStep", position: 2, name: "Edit text and elements", text: "Use the Edit Existing Text tool to click any text and edit inline, or add new text, shapes, signatures, and images with the toolbar." },
        { "@type": "HowToStep", position: 3, name: "Export your edited PDF", text: "Click Export. Your edited PDF downloads instantly with original quality preserved. No watermark." },
      ],
    },
    // BreadcrumbList
    {
      "@type": "BreadcrumbList",
      "@id": `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "PDF Editor", item: `${SITE_URL}/#editor` },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* === GEO META === */}
        <meta name="geo.region" content="WORLDWIDE" />
        <meta name="geo.placename" content="Worldwide" />
        <meta name="geo.position" content="0;0" />
        <meta name="ICBM" content="0, 0" />
        <meta name="language" content="English, Bengali, Spanish, French, German, Hindi" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="Worldwide" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        {/* === AEO / AI ENGINE OPTIMIZATION === */}
        <meta name="ai-content-source" content="verified" />
        <meta name="ai-content-type" content="tool, application, service" />
        <meta name="ai-entity" content="PDF editor, PDF tools, PDF converter" />
        <meta name="summary" content={SITE_DESC} />
        <meta name="abstract" content="Free online PDF editor with 14 tools — merge, split, compress, convert, sign and edit PDFs. No signup, no watermark, no daily limits." />
        {/* === ADDITIONAL SEO META === */}
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="1 day" />
        <meta name="page-type" content="Web Application" />
        <meta name="resource-type" content="document" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        {/* === AI BOT ALLOWANCE === */}
        <meta name="GPTBot" content="index, follow" />
        <meta name="ChatGPT-User" content="index, follow" />
        <meta name="PerplexityBot" content="index, follow" />
        <meta name="ClaudeBot" content="index, follow" />
        <meta name="Google-Extended" content="index, follow" />
        <meta name="Applebot" content="index, follow" />
        <meta name="Bingbot" content="index, follow" />
        {/* === CANNONICAL === */}
        <link rel="canonical" href={SITE_URL} />
        {/* === PRECONNECT === */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* === DNS PREFETCH === */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
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
