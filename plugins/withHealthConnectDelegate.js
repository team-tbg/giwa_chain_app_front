/**
 * Expo config plugin — react-native-health-connect 필수 네이티브 설정 주입.
 *  1) MainActivity.onCreate에 setPermissionDelegate(this) (권한 런처 등록 — 없으면 requestPermission 크래시)
 *  2) AndroidManifest에 android.permission.health.READ_STEPS 선언
 *     (Expo app.json android.permissions는 health.* 권한을 안 넣어줘서 여기서 강제)
 * (Android 14 rationale intent-filter는 react-native-health-connect 자체 플러그인이 추가함)
 */
const { withMainActivity, withAndroidManifest } = require('@expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';
const HEALTH_PERMISSIONS = ['android.permission.health.READ_STEPS'];

function withDelegate(config) {
  return withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';
    if (!src.includes(IMPORT_LINE)) {
      src = src.replace(/^(package .+?$)/m, `$1\n\n${IMPORT_LINE}`);
    }
    if (!src.includes(DELEGATE_CALL)) {
      const call = isKotlin ? `    ${DELEGATE_CALL}` : `    ${DELEGATE_CALL};`;
      src = src.replace(/(super\.onCreate\([^)]*\);?)/, `$1\n${call}`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

function withHealthPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of HEALTH_PERMISSIONS) {
      const exists = manifest['uses-permission'].some((p) => p?.$?.['android:name'] === name);
      if (!exists) {
        manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }
    return cfg;
  });
}

module.exports = function withHealthConnectDelegate(config) {
  config = withDelegate(config);
  config = withHealthPermissions(config);
  return config;
};
