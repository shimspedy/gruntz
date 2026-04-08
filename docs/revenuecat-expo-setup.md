## RevenueCat Expo Setup

This repo uses RevenueCat in the Expo / React Native app through:

- `react-native-purchases`
- `react-native-purchases-ui`

### Current app config

- iOS public SDK key env: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- Android public SDK key env: `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- entitlement id env: `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- offering id env: `EXPO_PUBLIC_REVENUECAT_OFFERING_ID`

### Current local values

- iOS SDK key: `test_ITWffDbIocGmbdhYwgLfRODdHzx`
- entitlement id: `pro`
- offering id: `default`

### RevenueCat dashboard setup

Create these objects in RevenueCat:

1. Entitlement
   - identifier: `pro`
   - display name: `gruntz Pro`
2. Offering
   - identifier: `default`
3. Package
   - package type: `monthly`
4. Product
   - store product id: `monthly`

Attach the `monthly` product to the `monthly` package inside the `default` offering, and map that package to the `pro` entitlement.

### App behavior

- New onboarded users get `15` days of app-level free access.
- After that, the app gates premium training content.
- Locked actions route to the in-app membership screen.
- The membership screen launches RevenueCat hosted paywalls.
- Active subscribers can open RevenueCat Customer Center from the same screen or from Profile.

### Important note

The current iOS key is a RevenueCat test key. Before App Store release, replace it with your real iOS public SDK key from RevenueCat.
