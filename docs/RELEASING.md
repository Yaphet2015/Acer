# Releasing

Pushing a tag like `v0.1.1` runs `.github/workflows/release.yml`, which:

1. installs dependencies, type-checks and runs tests;
2. checks that the tag matches the `package.json` version (and the built `manifest.json`);
3. builds and zips the extension with `npm run zip`;
4. uploads the zip to the Chrome Web Store and submits it for review
   (via [`chrome-webstore-upload-cli`](https://github.com/fregante/chrome-webstore-upload-cli) v4, Chrome Web Store API v2);
5. creates a GitHub Release for the tag with the zip attached.

The first version must be published manually in the Chrome Web Store dashboard. The workflow only updates an existing item.

## One-time setup

### 1. Enable the Chrome Web Store API
In the [Google Cloud Console](https://console.cloud.google.com/), create or select a project, then go to **APIs & Services → Library**, search for **Chrome Web Store API** and click **Enable**.

### 2. Configure the OAuth consent screen
Go to **APIs & Services → OAuth consent screen** (Google Auth Platform):
- User type: **External**. Fill in the app name and your email.
- Add yourself as a **Test user**.
- Then **Publish app** (move it to "In production"). Refresh tokens issued while the app is in "Testing" expire after 7 days.

### 3. Create an OAuth client
Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
- Application type: **Web application**.
- Authorized redirect URI: `https://developers.google.com/oauthplayground`.
- Save the **Client ID** and **Client secret**.

### 4. Get a refresh token
1. Open the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Click the gear icon, check **Use your own OAuth credentials**, and paste the Client ID and secret.
3. In "Step 1", enter the scope `https://www.googleapis.com/auth/chromewebstore` and click **Authorize APIs**. Sign in with the Google account that owns the Chrome Web Store item.
4. In "Step 2", click **Exchange authorization code for tokens** and copy the **Refresh token**.

(Alternative: `npx chrome-webstore-upload-keys` walks you through the same steps.)

### 5. Find the extension ID and publisher ID
- **Extension ID**: the 32-character ID shown for the item in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) (also in its store URL).
- **Publisher ID**: in the Developer Dashboard, open **Account**; the publisher ID is shown there (it is also in the dashboard URL).

### 6. Add repository secrets
In GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `CWS_EXTENSION_ID` | Extension ID |
| `CWS_PUBLISHER_ID` | Publisher ID |
| `CWS_CLIENT_ID` | OAuth client ID |
| `CWS_CLIENT_SECRET` | OAuth client secret |
| `CWS_REFRESH_TOKEN` | Refresh token |

## Releasing a new version

```bash
git checkout main && git pull
npm run release:patch   # or release:minor; bumps package.json, commits and creates the tag vX.Y.Z
git push --follow-tags
```

Or by hand: edit `version` in `package.json`, commit, then `git tag vX.Y.Z && git push origin main vX.Y.Z`.

Watch the run in the **Actions** tab. After it succeeds the new version is in review; Chrome Web Store reviews usually take a few hours to a few days, after which it goes live automatically.
