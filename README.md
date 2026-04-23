# advacement-code

A browser-based tool for Cub Scout pack leaders to generate printable award labels and shopping guides from a Scoutshop purchase order PDF.

Built to solve a real logistics problem: when a pack orders advancement awards in bulk, sorting and distributing them to individual scouts takes time. This tool parses the purchase order, identifies each scout's items, and prints labels sized for standard Avery label sheets.

## How to use

Open the live site at [cn814.github.io/advacement-code](https://cn814.github.io/advacement-code/), or clone the repo and open `index.html` directly in a browser — no server required.

1. Upload your Scoutshop purchase order PDF
2. Enter your pack number and choose your label format (Avery 8160, 5160, 8163, 5163, or 8164)
3. Generate a shopping guide, individual award labels, or both

## Notes

- Runs entirely in the browser using [PDF.js](https://mozilla.github.io/pdf.js/) for parsing and [jsPDF](https://parall.ax/products/jspdf) for generating printable output — no data is sent anywhere
- Built for Cub Scout Pack 361
