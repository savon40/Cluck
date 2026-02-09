# Cluck - Project Brief

## App Overview

**Cluck** is a morning and night routine app that helps users break the doom-scrolling cycle and build powerful daily habits through soft blocking, motivational content, and streak tracking.

## Core Problem

Users doom-scroll at night (staying up late) and in the morning (delaying their day), creating a cycle of poor habits and lack of productivity.

## Solution

A dual-routine app (night + morning) that:

- Creates custom habit checklists
- Adds friction to scrolling apps until routines are complete
- Provides motivational audio to start/end the day
- Tracks streaks to build momentum

## Target User

- People struggling with phone addiction and morning/night routines
- Ages 18-45, productivity-focused
- Willing to pay $9.99/month for accountability

## MVP Features (7-14 Day Build - Soft Blocking Approach)

### Night Routine

- Customizable checklist (pray, read, journal, etc.)
- Start time reminder (e.g., "Begin routine at 9:30 PM")
- Soft blocking: Persistent notifications when user opens blocked apps
- Motivational audio clip plays when routine is complete
- Track completion

### Morning Routine

- Custom alarm with motivational audio
- Customizable checklist (gratitude journal, prayer, exercise, cold shower, etc.)
- Soft blocking until routine is complete
- Quick journal entry option
- Completion celebration
- Track streak

### Core Tracking

- Dual streak counter (consecutive days completing BOTH routines)
- Simple calendar view showing completion
- Wake time vs. target time tracking
- "Days since I scrolled before my routine" counter
- "Wall of Shame" stats (how many times opened blocked apps before completing routine)

### Soft Blocking Implementation

- Detect when user opens blocked apps (Instagram, TikTok, X, Reddit)
- Send persistent notifications: "⚠️ You're scrolling before your routine! Streak at risk: 15 days"
- Track violations and show in app
- Every 2 minutes in blocked app = another notification
- No hard blocking (easier to build, less permissions needed)

## Tech Stack

### Framework

- **React Native** (iOS + Android from one codebase)
- **Expo** (for faster development) OR bare React Native

### Backend/Storage

- **Local-first architecture** (minimize costs)
  - AsyncStorage or MMKV for routine data, streaks, settings
  - react-native-fs for audio file storage
- **Firebase** (minimal usage)
  - Firebase Auth (anonymous or email)
  - Firestore (only for optional cloud backup)
  - Cloud Storage (for motivational audio library)

### Key Libraries

```json
{
  "core": [
    "react-native",
    "@react-navigation/native",
    "@react-native-async-storage/async-storage",
    "react-native-mmkv"
  ],
  "notifications": [
    "@react-native-community/push-notification-ios",
    "react-native-push-notification"
  ],
  "audio": ["react-native-sound", "react-native-track-player"],
  "app_detection": [
    "react-native-usage-stats", // Android
    "react-native-device-info"
  ],
  "background": [
    "react-native-background-actions",
    "react-native-background-fetch"
  ],
  "ui": [
    "react-native-calendars",
    "react-native-confetti-cannon",
    "react-native-vector-icons"
  ]
}
```

### Native Modules Needed

- **Android**: UsageStatsManager (detect app opens)
- **iOS**: Limited - use background fetch + notifications

## Data Architecture

### Local Storage Structure

```javascript
{
  // User routines
  "morning_routine": {
    "habits": [
      { "id": "1", "name": "Pray", "completed": false },
      { "id": "2", "name": "Gratitude Journal", "completed": false },
      { "id": "3", "name": "Exercise", "completed": false }
    ],
    "targetTime": "6:00 AM",
    "blockedApps": [
      "com.instagram.android",
      "com.twitter.android",
      "com.reddit.frontpage"
    ]
  },

  "night_routine": {
    "habits": [
      { "id": "1", "name": "Read", "completed": false },
      { "id": "2", "name": "Pray", "completed": false }
    ],
    "targetTime": "9:30 PM",
    "blockedApps": [
      "com.instagram.android",
      "com.twitter.android"
    ]
  },

  // Streak tracking
  "streak_data": {
    "currentStreak": 15,
    "longestStreak": 23,
    "completionHistory": {
      "2026-02-05": {
        "morning": true,
        "night": true,
        "violations": 2 // opened blocked apps 2 times
      }
    }
  },

  // Audio preferences
  "audio_library": [
    {
      "id": "1",
      "name": "David Goggins - Stay Hard",
      "localPath": "/path/to/audio.mp3",
      "duration": 45
    }
  ],

  // Settings
  "settings": {
    "alarmVolume": 0.8,
    "notificationAggressiveness": "medium", // low, medium, high
    "selectedMorningAudio": "1",
    "selectedNightAudio": "2"
  }
}
```

## Monetization

### Free Tier

- 3 habits per routine
- Basic blocking (notifications only)
- 5 pre-loaded motivational clips
- Basic streak tracking

### Premium ($9.99/month)

- Unlimited habits
- Advanced blocking (more aggressive notifications)
- Full audio library (40+ clips)
- Custom audio uploads
- Analytics/insights (best completion times, patterns)
- Multi-device sync
- Accountability partner feature (future)

## Viral TikTok Strategy

- "Day 1 vs Day 30 - My Morning Transformation"
- "The app that won't let me scroll until I do my routine"
- "Best motivational clips to wake up to"
- Before/after streak screenshots
- "Wall of Shame" screenshots showing violations

## Development Phases

### Phase 1 (Days 1-3): Project Setup

- Initialize React Native project
- Set up navigation structure
- Implement local storage
- Create basic UI components

### Phase 2 (Days 4-6): Core Features

- Routine builder (add/edit/delete habits)
- Checklist functionality
- Basic alarm with audio
- Streak counter

### Phase 3 (Days 7-10): Soft Blocking

- Background service setup
- App usage detection (Android first)
- Notification system
- Violation tracking

### Phase 4 (Days 11-14): Polish & Testing

- Audio library integration
- Celebration animations
- Bug fixes
- TestFlight/Play Store beta

## Success Metrics

- User completes both routines 5+ days in first week (retention)
- 20% conversion to premium within 30 days
- Average streak length > 7 days
- Users share on social media (organic growth)

## Key Design Principles

- **Simple & Clean UI** - No clutter, focus on the checklist
- **Immediate Feedback** - Confetti on completion, instant streak updates
- **Shame + Motivation** - Balance guilt (violations) with celebration (streaks)
- **Offline-First** - Everything works without internet

## Potential Challenges

1. **iOS Background Limitations** - Can't reliably detect app opens in background
   - Solution: Focus on Android first, use scheduled notifications on iOS
2. **Notification Fatigue** - Users might disable notifications
   - Solution: Make violations visible in app, create FOMO around streak
3. **User Can Disable App** - Nothing stops user from force-quitting
   - Solution: Track this as "ultimate violation" - breaks streak immediately

## Audio Content Strategy

### Bundled (Free)

- 5 clips from public domain motivational speakers
- Generic morning affirmations
- Simple alarm sounds

### Premium Library

- David Goggins-style intensity clips
- Andrew Huberman routine optimization
- Meditation/mindfulness clips
- User-submitted viral clips (with permission)

## Next Steps for Development

1. Choose: Expo vs Bare React Native
2. Set up project structure
3. Implement local storage layer
4. Build routine creation UI
5. Add background service for app detection
6. Test notification system
7. Integrate audio playback
8. Build streak tracking
9. Design celebration animations
10. Beta test with 10 users

---

## Questions to Answer During Development

- Should alarm be dismissible or require completing 1 habit first?
- How aggressive should notifications be? Every 2 min? Every 5 min?
- Should we show app usage stats (time spent in blocked apps)?
- Should streaks reset if user misses 1 day or give grace period?
- Premium feature: Can users set "rest days" that don't break streak?

## Cost Estimates

- **1,000 users**: ~$5/month (mostly free tier)
- **10,000 users**: ~$50/month
- **100,000 users**: ~$500/month

With 5% premium conversion at 100k users = $49,950/month revenue vs $500 costs = 99% margin

---

## Designs

there is a folder a directory up called sampleHTMLs, which contains HTML files associated with another folder screenshots. These contain the designs that I want the app to look like

---

**This is an MVP-focused build. Ship fast, get feedback, iterate.**
