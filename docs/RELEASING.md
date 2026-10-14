# Releasing

Pushing a tag like `v0.1.1` runs `.github/workflows/release.yml`, which:

1. installs dependencies, type-checks and runs tests;
2. checks that the tag matches the `package.json` version (and the built `manifest.json`);
3. builds and zips the extension with `npm run zip`;
4. uploads the zip to the Chrome Web Store and submits it for review
   (`scripts/cws-publish.mjs`, Chrome Web Store API v2, authenticated with a Google Cloud service account);
5. creates a GitHub Release for the tag with the zip attached.

The first version must be published manually in the Chrome Web Store dashboard. The workflow only updates an existing item.

## One-time setup

The workflow authenticates with a **service account** ([docs](https://developer.chrome.com/docs/webstore/service-accounts)), so there is no refresh token that can expire.

### 1. Enable the Chrome Web Store API
In the [Google Cloud Console](https://console.cloud.google.com/), create or select a project, search for **Chrome Web Store API** and click **Enable**.

### 2. Create a service account and a JSON key
- **IAM & Admin → Service accounts → Create service account**. Any name; no roles or permissions are needed.
- Open it → **Keys → Add key → Create new key → JSON**. A `.json` file downloads. Keep it secret.

### 3. Link the service account in the Developer Dashboard
In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), open **Account**, find the service account section and add the service account email (`…@….iam.gserviceaccount.com`). Only one service account can be linked per publisher.

### 4. Find the extension ID and publisher ID
- **Extension ID**: the 32-character ID of the item in the Developer Dashboard (also in its store URL).
- **Publisher ID**: in the Developer Dashboard under **Publisher → Settings / Account** (also in the dashboard URL).

### 5. Add repository secrets
In GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `CWS_SERVICE_ACCOUNT_KEY` | The whole contents of the JSON key file |
| `CWS_EXTENSION_ID` | Extension ID |
| `CWS_PUBLISHER_ID` | Publisher ID |

Once a release succeeds with the service account, the old `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET` and `CWS_REFRESH_TOKEN` secrets can be deleted. While `CWS_SERVICE_ACCOUNT_KEY` is unset, the script falls back to them.

### How it works
`scripts/cws-publish.mjs` signs a JWT with the key, exchanges it at `https://oauth2.googleapis.com/token` for an access token with scope `https://www.googleapis.com/auth/chromewebstore`, then calls:
- `POST https://chromewebstore.googleapis.com/upload/v2/publishers/PUBLISHER_ID/items/EXTENSION_ID:upload` (and `…:fetchStatus` while the upload is processing);
- `POST https://chromewebstore.googleapis.com/v2/publishers/PUBLISHER_ID/items/EXTENSION_ID:publish`.

If the upload works but submitting is refused (e.g. the item "does not meet requirements" because a listing or privacy field is missing), the step prints a warning and still succeeds; the new package is waiting as a draft in the dashboard, so fix what it lists and submit there.

## Releasing a new version

```bash
git checkout main && git pull
npm run release:patch   # or release:minor; bumps package.json, commits and creates the tag vX.Y.Z
git push --follow-tags
```

Or by hand: edit `version` in `package.json`, commit, then `git tag vX.Y.Z && git push origin main vX.Y.Z`.

Watch the run in the **Actions** tab. After it succeeds the new version is in review; Chrome Web Store reviews usually take a few hours to a few days, after which it goes live automatically.
