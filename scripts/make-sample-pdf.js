// Generate a sample PDF for testing
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");

async function main() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]); // A4
  p1.drawText("Welcome to PDFCraft Studio", {
    x: 80,
    y: 760,
    size: 28,
    font,
    color: rgb(0.33, 0.18, 0.86),
  });
  p1.drawText("This is page 1 of our sample PDF.", {
    x: 80,
    y: 720,
    size: 14,
    font,
  });
  p1.drawText("Try adding text, shapes, signatures and more!", {
    x: 80,
    y: 690,
    size: 14,
    font,
  });
  p1.drawRectangle({
    x: 80,
    y: 500,
    width: 200,
    height: 100,
    borderColor: rgb(0.93, 0.26, 0.26),
    borderWidth: 2,
  });
  p1.drawText("Sample Box", {
    x: 110,
    y: 540,
    size: 16,
    font,
    color: rgb(0.93, 0.26, 0.26),
  });

  // Page 2
  const p2 = pdfDoc.addPage([595, 842]);
  p2.drawText("Page 2 - Lorem Ipsum", {
    x: 80,
    y: 760,
    size: 24,
    font,
  });
  const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  const words = lorem.split(" ");
  let line = "";
  let y = 720;
  const maxWidth = 440;
  for (const w of words) {
    const test = line + w + " ";
    if (font.widthOfTextAtSize(test, 14) > maxWidth) {
      p2.drawText(line, { x: 80, y, size: 14, font });
      line = w + " ";
      y -= 20;
    } else {
      line = test;
    }
  }
  if (line) p2.drawText(line, { x: 80, y, size: 14, font });

  // Page 3
  const p3 = pdfDoc.addPage([595, 842]);
  p3.drawText("Page 3 - Sign Here", {
    x: 80,
    y: 760,
    size: 24,
    font,
  });
  p3.drawLine({
    start: { x: 80, y: 600 },
    end: { x: 350, y: 600 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  p3.drawText("Signature: __________________", {
    x: 80,
    y: 620,
    size: 14,
    font,
  });
  p3.drawText("Date: _______________", {
    x: 80,
    y: 580,
    size: 14,
    font,
  });

  const bytes = await pdfDoc.save();
  fs.writeFileSync("/home/z/my-project/sample.pdf", bytes);
  console.log("Created sample.pdf");
}

main().catch(console.error);
