# Cluck - App Store Deployment Guide

## 1. Apple Developer Account

- Sign up at https://developer.apple.com
- Costs **$99/year** (required, no way around it)
- Approval usually takes 24-48 hours

## 2. EAS (Expo Application Services) Setup

Already using Expo with an EAS project ID configured in `app.json`.

```bash
npm install -g eas-cli
eas login
eas build:configure
```

## 3. Build for iOS

```bash
eas build --platform ios --profile production
```

- EAS handles provisioning profiles and certificates automatically
- First time, it walks you through linking your Apple Developer account
- Build runs in the cloud (~15-20 minutes)
- Produces an `.ipa` file

## 4. App Store Connect Setup

Go to https://appstoreconnect.apple.com and create the app listing.

### Required assets

| Asset | Spec |
|-------|------|
| App icon | 1024x1024, no transparency, no rounded corners (Apple rounds them) |
| Screenshots | iPhone 6.7" and 6.5" required (capture from Simulator) |
| Privacy policy | URL required — even a simple one on a free hosting site works |

### Listing details

| Field | Value |
|-------|-------|
| App name | Cluck |
| Bundle ID | `com.savon.cluck` |
| Category | Health & Fitness or Productivity |
| Price | Free |
| Description | Short and long description of what the app does |
| Keywords | routine, habits, morning, alarm, productivity, streak, night, doom-scrolling |

## 5. Submit the Build

```bash
eas submit --platform ios
```

Or build + submit in one step:

```bash
eas build --platform ios --profile production --auto-submit
```

## 6. App Review

- Apple reviews every app — typically **24-48 hours**, sometimes faster
- Common rejection reasons for this app type:
  - **Notification usage** — Need a clear explanation of why notifications are sent
  - **Background audio** — Make sure the alarm/audio usage is justified in the review notes
  - **Privacy policy missing** — Must have one linked
- If rejected, Apple tells you exactly why. Fix it and resubmit.

## 7. Go Live

Once approved, release immediately or schedule a date.

---

## Pre-Submission Checklist

- [ ] Apple Developer Account ($99/yr) enrolled and approved
- [ ] Privacy Policy URL created and hosted
- [ ] App Store screenshots captured (6.7" + 6.5" iPhone sizes)
- [ ] 1024x1024 app icon exported
- [ ] App description and keywords written
- [ ] Thoroughly tested on a real device
- [ ] EAS build completes without errors
- [ ] Review notes prepared (explain notification and background audio usage)

## Realistic Timeline

| Step | Duration |
|------|----------|
| Developer account approval | 1-2 days |
| First EAS build + troubleshooting | 1 day |
| Preparing store listing assets | 1 day |
| Apple review | 1-2 days |
| **Total** | **~4-7 days** |
