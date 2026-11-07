# Bhumi Varahi Impex website

Static website for www.bhumivarahiimpex.com, hosted on GitHub Pages.

## Files
- `index.html` – the website
- `css/styles.css` – compiled styles (built from `src/input.css` with Tailwind)
- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` – browser and phone icons
- `og-image.png` – preview image shown when the link is shared on WhatsApp / LinkedIn
- `robots.txt`, `sitemap.xml` – help Google find the site
- `CNAME` – tells GitHub Pages to use www.bhumivarahiimpex.com (do not delete)
- `404.html` – "page not found" page

## Turn on the quote (RFQ) form
1. Go to https://web3forms.com, enter the email that should receive quotes, and copy the access key they email you.
2. In `index.html`, find `YOUR_WEB3FORMS_ACCESS_KEY` and replace it with your key.
Until then, the form opens the visitor's email app addressed to info@bhumivarahiimpex.com.

## Changing styles
If you add new Tailwind classes to the HTML, rebuild the CSS:
```
npx tailwindcss@3.4.17 -i src/input.css -o css/styles.css --minify
```
