# First Nation Fresh Foods — Website v2

Open `index.html` in any browser. No server needed.

---

## What changed from v1

| Your note | What was done |
|---|---|
| Follow Demo 1, not the draft | Rebuilt on Demo 1's layout language — 3D cube slider hero, 3D coverflow range carousel, tilt capability cards, scrolling certification ticker, animated stat band — re-skinned to the approved brand palette |
| Remove the 01, 02 numbers in menus | Removed. Dropdowns are plain labels |
| Hero slider missing | Three-slide cube slider is back on the home page, with progress bars and prev/next |
| Fonts unprofessional, sizes differ | One type scale defined once in CSS (`--t-h1` … `--t-mono`) and used on every page. Sora for headings, Inter for body, JetBrains Mono for spec labels — same as Demo 1 |
| Pages look bigger/smaller, not justified | One spacing rhythm (`--pad-sec`) and one fixed hero height on every inner page |
| Vision and mission as in the document | Both pages now carry the statements verbatim |
| Products from the order form | 211 products loaded from the Sunlong order form, in its own 11 categories |
| Quality looked like a course module | Replaced with a certificate gallery — image, title, issuing body, status. No "request certificate" button |
| Facilities/equipment videos | Both pages have video sections; add videos in the admin |
| Markets — where did the info come from | See "Markets" below. Now fully editable |
| Make it scalable, edit in page | Content admin plus in-page text editing — see below |

---

## Editing the site

### 1. The admin panel — `admin.html`

Linked from the footer of every page.

**Products** — add, edit or delete any of the 211 lines. Each product takes a name, a category, a specification line and an optional image. Without an image the card renders as a clean text card; with one, the photo appears. Changes show on the catalogue and on the category page immediately.

**Categories** — add a category, edit the name or description, upload a tile image, or delete one. A new category automatically gets its own page at `category.html?c=<id>` and appears in the Products grid and the filter tabs.

**Certificates & Policies** — upload a scan or photo, give it a title, the issuing body and a status (e.g. *Current*, *In final approval*). It appears straight away on the Quality, Certifications or Policies page.

**Videos** — paste a YouTube or Vimeo link, or the path to an MP4 you've put in `assets/`. Choose whether it shows on the Facilities page or the Equipment page.

**Home slider** — edit the wording, buttons and background image of all three slides.

**Markets** — edit, remove or add the sectors shown on the Markets page and home page.

**Publish** — download the updated `content.js` and replace `data/content.js` on the server. That one step is what makes changes permanent for everyone.

### 2. In-page text editing

Add `?edit=1` to any page — for example `index.html?edit=1`. Editable blocks get a dashed outline; click and type. **Save changes** stores them; **Undo all** reverts.

### 3. How this maps to WordPress

This is deliberately the same shape as the CMS stage:

| Here | In WordPress |
|---|---|
| `data/content.js` | The database |
| Admin → Products | Products custom post type |
| Admin → Categories | Product category taxonomy |
| Admin → Certificates | Certificates custom post type |
| Download & replace content.js | Nothing — saving writes straight to the database |
| `?edit=1` | The block editor |

Nothing built here is thrown away in the port.

---

## Structure

```
index.html … 19 pages + admin.html
data/content.js        all content: products, categories, certificates, videos, slider, markets
assets/css/site.css    one palette, one type scale, one spacing rhythm
assets/js/site.js      slider, coverflow, catalogue, quote list, editing
assets/brand/          logo, certification marks, dot-art wave, pillar icons, product labels
assets/img/            photography
```

Pages: Home · About (Overview, Vision, Mission, Commitment, Company Profile, Organisation, Terms of Trade) · Products (Catalogue, 11 category pages via `category.html`, Own Label) · Facilities (Overview, Equipment) · Quality (Overview, Certifications, Policies) · Markets · Contact · Marketing Media · Admin

---

## Product catalogue

211 lines taken from the Sunlong order form, grouped as the order form groups them:

| Division | Lines | Division | Lines |
|---|---|---|---|
| Vegetables | 74 | Prepared Salads | 12 |
| Hand-Processed & Cut | 36 | Salad Leaves & Washed Greens | 12 |
| Fruit | 32 | Baby & Gourmet | 11 |
| Fresh Herbs | 16 | Antipasto & Semi-Dried | 6 |
| Frozen Fruit | 5 | Pantry & Specialty | 4 |
| Asian Vegetables | 3 | | |

Plus the three own-label lines from the printed labels: Asian Slaw, Bush Tomato Relish, Lemon Myrtle Dressing.

Every line has **+ Add to Quote**. The list persists across pages and submits as a full specification to `orders@firstnationfreshfoods.com.au`.

---

## Things to confirm with the client

1. **Vision and Mission name.** Both documents say *"First Nation Fresh **Produce**"*, while the printed artwork says *"First Nation Fresh **Foods** Pty Ltd"*. The pages reproduce the documents verbatim as instructed, so the site currently shows both names. Ask which is correct.
2. **Mission statement is cut off.** The supplied document ends mid-sentence at *"Exploring environm…"*. Nine complete points are shown; the tenth needs the full text.
3. **Markets We Serve.** This content was **drafted by us**, not supplied by the client. It is inferred from Pete's emails — the WA Government CUA buyer register he was pursuing with Kristien, the healthcare and aged-care specifications, and remote-site supply. **It needs the client's sign-off**, and is editable in the admin for exactly that reason.
4. **Product specifications.** Each line shows a generic specification by division. Real pack sizes and cut specs should replace them — edit in the admin.
5. **Certificates.** The four marks shown are the logos from the letterhead. The actual certificate scans need uploading, and the SQF status updated after the audit.
6. **Product photography.** No product-level photos exist yet. Cards work without them; add images per product in the admin as they are shot.
7. **Domain and spelling** — `firstnationfreshfoods.com.au` vs `firstnationfreshfoods.com.au`, and *First Nation* vs *First Nations*.
8. **Form endpoint.** Quote and enquiry forms currently compose an email. Point them at a server endpoint before launch.
