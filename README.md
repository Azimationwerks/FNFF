# First Nation Fresh Foods — website

Version 2.5 · 18 November 2026 · built by Azimation Werks

---

## What this is

A complete, self-contained website. Open `index.html` in any browser and it runs —
no server, no database, no build step. Everything the client can change lives in
one file, `data/content.js`, and is edited through `admin.html`.

**21 pages · 11 product divisions · 211 product lines, every one photographed · 0 console errors**

The catalogue draws **48 cards at a time** and loads the next batch as you reach
it. Rendering all 211 at once meant 17 MB of imagery queued behind the browser's
image limit, which is why cards further down sometimes stayed blank.

---

## Running it

| Where | How |
|---|---|
| On your own machine | Open `index.html` |
| On GoDaddy (or any host) | Upload the whole folder to `public_html` |
| Content admin | Open `admin.html` |
| Edit text on a page | Add `?edit=1` to any page address |

The admin is deliberately **not linked in the footer**. Reach it by typing
`/admin.html` after the domain, or bookmark it. Before the site is promoted,
password-protect it — `.htaccess` in this folder has the block ready to
uncomment, and the Operations Guide walks through it step by step.

---

## The menu

```
Home
About Us          → Company Profile · Our Vision · Our Mission
                    Organisation Chart · Terms of Trade
Products          → Full Catalogue · Vegetables · Fruit · Hand-Processed Cuts
                    Salad Leaves · Prepared Salads · Our Own Label
Facilities        → Facilities Overview · Processing Equipment
Quality & Safety  → Quality Overview · Certifications · Policies
                    Health & Safety Program · Modern Slavery Program
Markets We Serve
Contact
```

Marketing Media sits in the top bar and the footer. The top bar carries the
telephone number and sales email only.

`about.html` and `commitment.html` still exist as redirects to Company Profile,
so any link already shared keeps working.

---

## Everything the client can change, without a developer

Open `admin.html`. Twelve tabs:

| Tab | What it does |
|---|---|
| **Products** | Add, edit or delete any of the 211 lines, with an optional image |
| **Categories** | Add, **edit** or remove a division — name, description, tile, carousel image and page header. A new division gets its own page, menu tile and filter |
| **Certificates & Policies** | Add, **edit** or remove — title, issuer, status, scan and PDF |
| **Videos** | Add, **edit** or remove — title, description, page, link and still image |
| **Home Slider** | Rewrite the three slides and change their background images |
| **Markets** | Edit, add or remove market sectors |
| **Page Images** | The header photograph on every page, with a table of the right size for every image on the site |
| **Page Text** | Every heading, intro and card on the site — 209 blocks — plus the scrolling strip and the Acknowledgement of Country |
| **Menu & Pages** | Rename, reorder, add or remove menu items and sub-items. Create whole new pages |
| **Programs** | Health & Safety and Modern Slavery — text, points, images and documents |
| **SEO** | Page title and meta description for every page, with character counters |
| **Appearance** | Every brand colour, card colours, and the panels behind text on photographs |
| **Settings** | Address, phone, email addresses, Terms of Trade document, organisation chart |
| **Publish** | Download the updated `content.js` to put on the server |

### How saving works

A change applies **immediately in the browser you made it in**, so the live
layout can be reviewed before anyone else sees it. To make it permanent for
everyone: *Publish → Download content.js* and replace `data/content.js` on the
server. On WordPress or Shopify later, that step disappears — saving writes
straight to the database.

### Adding a page

1. **Menu & Pages → Create a page.** Give it a title and an address.
2. Write the content. Plain text works; so does HTML (`<h2>`, `<p>`, `<ul>`).
3. Copy the link shown beside it — `page.html?p=your-slug`.
4. **Main menu → Add menu item**, paste that link, save.

### Image sizes

| Where | Size | Shape |
|---|---|---|
| Home slider | 1920 × 860 | 2.2 : 1 |
| Page header | 1440 × 640 | 2.25 : 1 |
| Product division tile | 900 × 675 | 4 : 3 |
| Product photograph | 640 × 480 | 4 : 3 |
| Certificate or policy | 850 wide | any |
| Program gallery | 900 × 675 | 4 : 3 |
| Organisation chart | 1400 wide | any |
| Own-label product | 600 × 800 | 3 : 4 upright |

Landscape everywhere except own-label packs, and keep each file under about
400 KB. On the slider and page headers the text panel covers the left half, so
put the subject on the right. The same table is in the admin on the Page Images
tab, and sizes are printed beside every upload field.

### Adding an image — two ways

Beside every file picker there is a box for a **filename**. They behave very
differently:

| | Choosing a file | Typing a filename |
|---|---|---|
| Where it ends up | As text inside `content.js` | A normal file in `assets/img/` |
| How many | A handful | Any number |
| Page weight | Grows `content.js` | None |
| Best for | One quick swap | Normal work, and bulk |

A browser allows about **5 MB of unpublished changes**, and an embedded image is
roughly a third larger as text — so two phone photos can fill it. Past that,
saves fail. The Publish tab shows a usage bar, and the admin now says so plainly
instead of appearing to save and losing the change.

**The recommended way:** upload to `assets/img/` with File Manager or FTP, then
type `products/carrot.jpg` in the box. A full URL works too. That is how all 211
product photographs were loaded.

---

## Sending enquiries straight from the site

The enquiry form and the quote specification are posted to `send.php`, which
sends the email **from the server**. Nothing opens Gmail or Outlook.

### Setting it up on GoDaddy

GoDaddy Linux hosting runs PHP, so `send.php` works as uploaded. Three steps:

1. In cPanel, create the mailboxes on the domain —
   `orders@`, `sales@`, `admin@` and `noreply@`.
2. Open `send.php` and fill in `SMTP_USER` and `SMTP_PASS` near the top with the
   `noreply@` mailbox and its password.
3. Check the domain's SPF record exists: `v=spf1 include:secureserver.net ~all`
   (GoDaddy normally adds this when email is set up — check rather than add a second).

**Why SMTP and not PHP `mail()`.** `mail()` sends with no authentication, and
Gmail, Outlook and corporate filters now quietly bin that — enquiries disappear
without anyone knowing. Sending authenticated through the domain's own mailbox
is what makes the message actually arrive. If SMTP is left blank the script
falls back to `mail()` so the site still works, but configure it before go-live.

Every submission is also written to `enquiries.log` as a backstop.

---

## Design notes for this version

**Shadows removed everywhere.** They were dulling the produce photography, which
is the whole point of the site. Depth is now carried by hairline borders.

**Text panels over photographs.** With the dark overlay gone, the home slider
headline and every page title sit on their own panel so they stay readable while
the photograph behind stays sharp. The panel colour and how solid it is are both
adjustable in **Appearance**.

**The top wave is flipped.** It now mirrors the one above the footer, so a
section reads as one continuous band rather than two unrelated edges.

**Text panels are half width.** The hero and every page title sit on a panel
roughly half the screen, so the photograph behind is actually seen rather than
covered. Body copy is justified wherever a real paragraph runs.

**Product cards all share one shape.** Lines without a photograph show a brand
tile marked *Photograph to follow*, so the grid stays even and nobody mistakes a
gap for a fault. Nine lines carry real photographs cropped from the client's own
6 November photo set.

---

## File layout

```
index.html … contact.html      the 21 pages
page.html                      renders any page created in the admin
admin.html                     the content admin
.htaccess                      server settings — admin password, HTTPS, caching
send.php                       form delivery (configure before go-live)
data/content.js                ALL content — products, menu, SEO, colours, settings
data/textindex.js              generated list of every editable text block
assets/css/site.css            one stylesheet, all design tokens at the top
assets/js/site.js              all behaviour
assets/brand/                  logo, certification marks, dot-art wave, pillar icons
                               wave-cut.png — the wave with the area above the
                               crest cut away, so the footer strip blends
assets/img/                    photography
```

Nothing is minified or obfuscated. Every file is readable and editable.

---

## Known gaps — waiting on the client

These are content, not development. The full list is in
*FNFF_Information_Required_From_Client.docx*.

- **Markets We Serve** was drafted by Azimation, not supplied — needs sign-off
- **Certificates** shown are the letterhead marks; the real ones are issued to
  Sunlong and are needed in the FNFF name
- **Product photography** — the images received have camera filenames and cannot
  be matched to the 211 lines
- **Facility figures** need confirming for Malaga rather than Canning Vale
- **Mission statement** is now complete (14 points, received 17 Nov)
