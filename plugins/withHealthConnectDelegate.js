/**
 * Expo config plugin — react-native-health-connect 권한 런처를 MainActivity에 등록.
 * 라이브러리가 requestPermission(ActivityResultLauncher)을 onCreate에서 register 해야 하는데
 * 기본 플러그인이 안 넣어줘서, MainActivity.onCreate에 setPermissionDelegate(this)를 주입한다.
 */
const { withMainActivity } = require('@expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

module.exports = function withHealthConnectDelegate(config) {
  return withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    const isKotlin = cfg.modResults.language === 'kt';

    // 1) import 추가 (package 선언 다음)
    if (!src.includes(IMPORT_LINE)) {
      src = src.replace(/^(package .+?$)/m, `$1\n\n${IMPORT_LINE}`);
    }

    // 2) super.onCreate(...) 직후 delegate 등록 (Kotlin/Java 모두 대응)
    if (!src.includes(DELEGATE_CALL)) {
      const call = isKotlin ? `    ${DELEGATE_CALL}` : `    ${DELEGATE_CALL};`;
      src = src.replace(/(super\.onCreate\([^)]*\);?)/, `$1\n${call}`);
    }

    cfg.modResults.contents = src;
    return cfg;
  });
};
