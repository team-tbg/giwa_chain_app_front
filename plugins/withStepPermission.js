/**
 * Expo config plugin — 만보 센서용 ACTIVITY_RECOGNITION 권한을 AndroidManifest에 선언.
 * (Expo app.json android.permissions가 이 권한을 매니페스트에 안 넣어주는 경우가 있어 강제)
 * expo-sensors Pedometer(TYPE_STEP_COUNTER)는 Android 10+에서 이 권한이 있어야 표준 팝업/카운트 동작.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const PERMISSIONS = ['android.permission.ACTIVITY_RECOGNITION'];

module.exports = function withStepPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of PERMISSIONS) {
      const exists = manifest['uses-permission'].some((p) => p?.$?.['android:name'] === name);
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    return cfg;
  });
};
