# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Backend

The app reads and writes a real Supabase project — there's no mock data or
offline demo mode. Before running it, follow [`supabase/README.md`](supabase/README.md)
to apply the schema and set `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (copy `.env.example`).

## This app does not run in Expo Go

Background geofencing (`expo-task-manager`) and the camera (`expo-camera`,
for QR check-in and challenge photos) are native modules Expo Go doesn't
ship — opening the project in the plain Expo Go app will crash with
`Cannot find native module 'ExpoCamera'` (or similar) the moment any screen
imports one. You need a **development build** instead:

```bash
# Local build (needs Xcode for iOS / Android Studio for Android installed):
npx expo run:ios       # or: npx expo run:android

# Cloud build (no local native toolchain required — needs an Expo account):
npm install -g eas-cli
eas login
eas build --profile development --platform ios      # or android, or "all"
# For an iOS *simulator* build specifically (no paid Apple Developer account needed):
eas build --profile development-simulator --platform ios
```

Install the resulting build once, then go back to your normal
`npx expo start` — just open it from the dev-client app you installed
instead of Expo Go. Any time a new native dependency is added (as
happened here), the dev client needs rebuilding again; a plain JS/Metro
reload can't add native code to an already-installed app.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
