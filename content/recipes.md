# Agent Recipes — Outlines 01–04
*Status: Outline. Not tested on a client brief. No "tested" claims.*  
*Drafted Oct 15, 2026 for newwavestack.com. Prices are product list prices, not outcome guarantees.*

NwWv Agent Recipes turn a **Use** verdict into a workflow a designer can run — or hand to **Backstop by New Wave** ("or we'll run it for you").

---

## 01 — On-brand social post agent
**Price:** $29–99 · **Status:** Outline

### Problem
A locked brand kit exists. The calendar still eats the week. Captions drift off-voice; image prompts ignore the palette; scheduling is a second job. The designer needs volume without surrendering taste.

### Stack
| Piece | Role |
|---|---|
| **n8n** (Cloud Starter or self-hosted) | Orchestration, schedule, approval wait |
| **Claude API** (Anthropic) | Captions + image prompts from brand voice |
| **Ideogram API** *or* **Recraft API** | Visuals (Ideogram when type-in-image matters; Recraft when a brand style ID exists) |
| **Buffer API** (or native scheduler) | Queue approved posts |
| **Google Sheet / Notion** | Content calendar + status |
| **Slack or email** | Human approval gate |

### Step-by-step workflow
1. Store the brand kit in one folder: voice doc, palette hex, fonts, logo SVG, 5 approved reference posts.
2. Weekly Schedule trigger in n8n reads upcoming calendar rows from the Sheet.
3. Claude node writes caption + image prompt per row, with the voice doc and references as system context; JSON out.
4. HTTP node calls Ideogram (text in the image) or Recraft (brand style ID) for 2 options per post.
5. Approval gate: options go to Slack or email with approve / reject. A human must approve. n8n waits.
6. On approve, upload to Buffer as a scheduled post and write the status back to the Sheet.

### Not claimed
This outline has not been run on a client calendar. API prices move; recheck n8n, Buffer, Ideogram, and Recraft before selling the file.

### Or we'll run it for you
Backstop by New Wave can run the same loop with creative-director sign-off.

---

## 02 — Ad variant generator
**Price:** $29–99 · **Status:** Outline

### Problem
One hero is approved. The media plan wants four crops and a pile of headline swaps. Regenerating the whole ad in an image model wrecks the type.

### Stack
| Piece | Role |
|---|---|
| **n8n or Zapier** | Orchestration |
| **Claude API** | Headline and CTA variants inside each placement's character limit |
| **Recraft API** (style, remove background, outpaint) or **Adobe Firefly Services** | Extend the hero to 1:1, 4:5, 9:16, and 1.91:1 |
| **sharp or ImageMagick** | Composite real type and the logo from a fixed template |

### Step-by-step workflow
1. Drop one approved hero (image, headline, CTA) in a Drive folder.
2. Claude writes the copy variants. It does not render type.
3. The image API outpaints the hero to each aspect ratio.
4. A code node sets type and logo from the template. No AI-rendered type.
5. A contact sheet goes to the creative director. Approved files export with placement-named filenames.

### Not claimed
Outline only. Firefly Services API is enterprise; confirm access before it is the default. This is the path instead of AdCreative.ai, which is a Skip.

### Or we'll run it for you
Backstop ad-variant plans cover the same handoff.

---

## 03 — Bundles
**Price:** $99–149 · **Status:** Outline

Grouped by creative job, not by model:

- **Social** — Recipe 01 plus a caption-bank prompt sheet
- **Ads** — Recipe 02 plus the sizing template
- **Launch** — Recipes 01 and 02 plus a Framer landing-page prompt pack

Nothing in the bundle has been run end to end. The price is the list price for the outlines, not a performance claim.

---

## 04 — Recipe Club
**Price:** $20/mo · **Status:** Outline

Every recipe, plus a changelog when a model or an API price changes (for example, Runway Unlimited moving to Max on Nov 30, 2026).

Paid members save 30% on every recipe. Recipe Club itself stays $20/mo.

---

## House rule

If a verdict moves from Use to Skip or Watch, the recipe that depends on it is revised or pulled. No recipe ships with a "tested" label until a creative director has run it on a real brief and written down what failed.
