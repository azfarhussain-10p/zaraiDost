# 🚀 Quick Start Guide - Zarai Dost

Get your Zarai Dost app running in **5 minutes**!

## ⚡ Fastest Way to Run (Physical Device)

### Step 1: Install Expo Go (2 minutes)

On your **phone**, download Expo Go:

- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Start the Server (1 minute)

On your **computer**:

```bash
cd apps/mobile
npm start
```

**Wait 20-30 seconds** for the QR code to appear in your terminal.

### Step 3: Connect & Run (1 minute)

1. **Ensure your phone and computer are on the same WiFi**
2. **Open Expo Go app** on your phone
3. **Scan the QR code** from your terminal
4. **Wait for app to load** (first load takes 30-60 seconds)
5. **Done!** 🎉

---

## 🖥️ Running on Emulator

### Android Emulator

**Requirements:** Android Studio with AVD setup

```bash
cd apps/mobile
npm run android
```

### iOS Simulator (Mac only)

**Requirements:** Xcode installed

```bash
cd apps/mobile
npm run ios
```

---

## 🌐 Running on Web (Limited Features)

```bash
cd apps/mobile
npm run web
```

**Note:** Web version is for **UI testing only**. Use iOS/Android for full features.

---

## 🐛 Troubleshooting

### "Something went wrong" on Expo Go

**Fix:**
1. In Expo Go: Profile → **Clear cache**
2. On computer:
   ```bash
   cd apps/mobile
   npm start -- --clear
   ```
3. Try scanning QR code again
4. If still failing, press **"Reload"** in error screen 2-3 times

### QR Code not showing

**Fix:**
```bash
# In your terminal, press 'r' to refresh and show QR code
```

Or connect manually:
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. In Expo Go: **"Enter URL manually"**
3. Enter: `exp://YOUR_IP:8081`
   - Example: `exp://192.168.1.100:8081`

### Port 8081 already in use

**Windows:**
```bash
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:8081 | xargs kill -9
```

### Dependency errors

**Fix:**
```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npm install
npx expo install --fix
npm start -- --clear
```

---

## 📋 Common Commands

```bash
# Start development server
npm start

# Start with clean cache
npm start -- --clear

# Start in LAN mode (if tunnel fails)
npm start -- --lan

# Run on Android
npm run android

# Run on iOS (Mac only)
npm run ios

# Run on web
npm run web

# Run tests
npm test
```

---

## 🎯 What to Test

Once your app loads:

### On Native (iOS/Android):
1. **+Add Field** button - Creates a field with data persistence
2. **+Add Crop** button - Creates a crop (after creating field)
3. **Pull to refresh** - Reloads dashboard data
4. **Navigation** - Test navigation between screens

### On Web:
1. **UI rendering** - Check all components display correctly
2. **Button clicks** - Check console for activity logs
3. **Navigation** - Test navigation works

**Remember:** Web shows empty data (mock database). Check browser console to see button activity:
```
[FarmDashboard] 🌾 Creating sample field...
[DB Mock] runAsync called
[FarmDashboard] ✅ Sample field created successfully!
```

---

## 📱 Device Requirements

### Minimum:
- **iOS:** iOS 13+
- **Android:** Android 8.0 (API 26)+
- **RAM:** 2GB+
- **Storage:** 100MB free space

### Recommended:
- **iOS:** iOS 14+
- **Android:** Android 10+ (API 29+)
- **RAM:** 4GB+
- **Network:** WiFi for first load

---

## 🎓 Next Steps

After getting it running:

1. **Read the docs:**
   - [Mobile App README](apps/mobile/README.md)
   - [Architecture](docs/architecture/)
   - [Development Stories](docs/stories/)

2. **Explore the code:**
   - Start with `App.js`
   - Check `src/screens/offline/FarmDashboard.js`
   - Review database setup in `src/database/`

3. **Make changes:**
   - Edit any file
   - Save
   - App hot-reloads automatically!

---

## ✅ Success Checklist

- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi
- [ ] `npm start` running in terminal
- [ ] QR code visible in terminal
- [ ] Scanned QR code with Expo Go
- [ ] App loaded successfully
- [ ] Tested buttons and navigation

---

## 🆘 Still Having Issues?

1. **Check the full README:** [apps/mobile/README.md](apps/mobile/README.md)
2. **Review CHANGELOG:** [CHANGELOG.md](CHANGELOG.md)
3. **Check console logs:** Look for red errors in terminal
4. **Try clearing everything:**
   ```bash
   cd apps/mobile
   rm -rf node_modules .expo
   npm install
   npm start -- --clear
   ```

---

**Happy coding!** 🚀🌾

If you see your app running on your phone with the Zarai Dost dashboard, you're all set! 🎉

