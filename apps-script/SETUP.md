# The Google script: setting it up

The site writes answers, sign-ups and tester codes to your results spreadsheet through a small
Google Apps Script, and reads them back the same way. It takes about ten minutes to set up.
Your existing Google Form keeps working alongside it as a backup.

## 1. Paste the code

1. Open the results spreadsheet in Google Sheets.
2. Extensions › Apps Script. A new tab opens with a file called `Code.gs`.
3. Select everything in that file, delete it, and paste the whole of `apps-script/Code.gs` from this repository.
4. Click the save icon (or Ctrl/Cmd+S).

## 2. Set the secret

1. In the Apps Script tab, click the gear icon on the left (Project Settings).
2. Under Script Properties, click Add script property.
3. Property: `APPS_SCRIPT_SECRET`. Value: a long random string. In a terminal, `openssl rand -hex 32` makes one.
4. Save script properties. Keep the value: Vercel needs the same one.

## 3. Deploy it as a web app

1. Top right, Deploy › New deployment.
2. Click the gear next to Select type and choose Web app.
3. Description: `decouple.uk`. Execute as: Me. Who has access: Anyone.
4. Deploy. Google asks you to authorise the script: Review permissions, choose your account, Advanced › Go to (unsafe) if it warns, Allow.
5. Copy the Web app URL. It ends in `/exec`.

After any later change to `Code.gs`: Deploy › Manage deployments › pencil icon › Version: New version › Deploy. The URL stays the same.

## 4. Tell Vercel

In Vercel › the project › Settings › Environment Variables, add for Production and Preview:

- `APPS_SCRIPT_URL` = the web app URL from step 3
- `APPS_SCRIPT_SECRET` = the value from step 2

Then redeploy once so the functions pick them up.

## 5. Check it works

In a terminal, with your URL and secret:

```
curl -sL "https://script.google.com/macros/s/.../exec?action=codes&secret=YOUR_SECRET"
```

It should print `{"ok":true,"codes":[]}` and the spreadsheet now has a `Codes` tab with its header row.
`{"ok":false,"error":"Forbidden"}` means the secret does not match. An HTML page means the deployment
is not set to Anyone, or the URL is the editor's, not the `/exec` one.

## 6. Import the questions once

1. In the spreadsheet, add a tab called exactly `M02 Questions` (the script also creates it with a header row on first use).
2. With that tab open: File › Import › Upload › choose `site/m02/guide/questions-template.csv` from this repository.
3. Import location: Replace current sheet. Separator type: Comma. Import data.
4. Edit questions in the sheet. On the site, Site settings › Publish questions rebuilds the site with the new rows. Rows with `active` blank or FALSE are left out by the guide.

## What the script creates

Tabs, with header rows, the first time each is needed:

- `M02 Guide` and `Prototype testing`: one row per answer. Any other test the site sends gets its own tab, named after it.
- `Signups`: `received_at, email, stage, source, sid`
- `Codes`: `code, label, active, test, expires, created, uses, last_used, track, mode`. Managed from Site settings on the site. You can also edit it by hand: `active` TRUE/FALSE, `expires` as `YYYY-MM-DD` or empty, `track` empty (the guide only), `full`, `mvp` or a list like `p03,m05`, `mode` `un` (on their own) or `mod` (with you). A tab made before export 2026-10-14d gets the last two headers added on its first use.
- `Participants`: `received_at, pid, sid, email, followup, voucher`, from the participant hub's thank-you step. No read ever returns it: only you see it, in the sheet.
- `M02 Questions`: the questions the guide asks.
- `Screener` and one tab per MVP prototype (`MVP 05 · Financial statement` and so on), like any other test.

Results read through the site never include email addresses, and never anything from `Participants`, `Signups` or `Codes`.

## After a change to `Code.gs`

Paste the whole new file over the old one (step 1), save, then Deploy › Manage deployments › the pencil icon › Version: New version › Deploy. The URL stays the same, so Vercel needs nothing.
