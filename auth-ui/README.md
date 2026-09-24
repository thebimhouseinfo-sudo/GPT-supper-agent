# GSA Auth UI

Static login/consent frontend for GPT Super Agent.

## Purpose

This page does only two things:

1. sign the user into Supabase Auth with Google;
2. display/approve Supabase OAuth authorization requests from ChatGPT.

It does **not** connect to Google Drive and requests no Google Drive scope.

## Deploy

Deploy this directory as the Vercel project root.

After deployment:

1. add the deployment origin to Supabase Auth Redirect URLs;
2. set Supabase OAuth Server Authorization Path to the deployed root URL;
3. keep Google callback in Google Cloud as:
   `https://fbyqktduoqlpbbtkghkf.supabase.co/auth/v1/callback`.

The Supabase publishable key in `index.html` is intentionally client-safe. Never add a secret/service-role key here.
