import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { buildNativeThemeBridgeScript } from '@freshy/ui/theme-bridge';
import { buildNativeSafeAreaScript } from '../src/safe-area-bridge';
import { resolveNativeColorScheme } from '../src/theme-bridge';
import { readWebAppUrl } from '../src/web-app-url';

const LIGHT_CHROME = '#f7f9fb';
const DARK_CHROME = '#0f1419';

export default function FreshyWebAppScreen() {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const webAppUrl = readWebAppUrl();
  const insets = useSafeAreaInsets();
  const nativeScheme = resolveNativeColorScheme(useColorScheme());
  const chromeColor = nativeScheme === 'dark' ? DARK_CHROME : LIGHT_CHROME;
  const themeBridgeScript = buildNativeThemeBridgeScript(nativeScheme);
  const safeAreaScript = useMemo(() => buildNativeSafeAreaScript(insets), [insets]);
  const bootstrapScript = `${themeBridgeScript}${safeAreaScript}`;

  useEffect(() => {
    webViewRef.current?.injectJavaScript(bootstrapScript);
  }, [bootstrapScript]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: chromeColor }]} edges={['bottom']}>
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webview}
        geolocationEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        injectedJavaScriptBeforeContentLoaded={bootstrapScript}
        onLoadEnd={() => setLoading(false)}
        testID="freshy-webview"
      />
      {loading ? (
        <View
          style={[styles.loadingOverlay, { backgroundColor: chromeColor }]}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="#0c6780" accessibilityLabel="Loading Freshy" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
