New Wave — the AI stack for professional designers. Static site deployed on Vercel.

## Environment

Set these on the Vercel project. They are read only by the serverless functions and are never sent to the browser.

- `RESEND_API_KEY` — full-access key. Creating contacts needs it; a send-only key will not work. `/api/inquiry` uses the same key to send mail, so the key must be allowed to send.
- `RESEND_SEGMENT_ID` — `99b919f2-ab35-4918-9c53-7a3f99019762`
- `INQUIRY_TO_EMAIL` — inbox that receives studio inquiries from `/api/inquiry`. Required. Mail is sent from `studio@newwavestack.com`, which has to be a verified sender on newwavestack.com in Resend. The inquirer is not emailed.

Env vars configured in Vercel on Oct 15, 2026. `INQUIRY_TO_EMAIL` is not set yet.
