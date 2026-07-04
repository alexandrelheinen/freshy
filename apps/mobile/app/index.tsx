import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, useColorScheme, View } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getDefaultThemeTokens, getThemeTokens } from '@freshy/theme/tokens';
import { buildNativeThemeBridgeScript } from '@freshy/ui/theme-bridge';
import { buildNativeSafeAreaScript } from '../src/safe-area-bridge';
import { buildWebViewSafeAreaInsets, resolveTopInset } from '../src/resolve-safe-area-insets';
import { resolveNativeColorScheme } from '../src/theme-bridge';
import { readWebAppUrl } from '../src/web-app-url';
import { useExternalOAuthNavigation } from '../src/use-external-oauth-navigation';

const defaultTheme = getDefaultThemeTokens();
const darkTheme = getThemeTokens('dark');
const LIGHT_CHROME = defaultTheme.colors.background;
const DARK_CHROME = darkTheme.colors.background;

export default function FreshyWebAppScreen() {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const webAppUrl = readWebAppUrl();
  const { onShouldStartLoadWithRequest } = useExternalOAuthNavigation(webViewRef, webAppUrl);
  const insets = useSafeAreaInsets();
  const topInset = resolveTopInset(insets.top, Platform.OS, Constants.statusBarHeight);
  const nativeScheme = resolveNativeColorScheme(useColorScheme());
  const chromeColor = nativeScheme === 'dark' ? DARK_CHROME : LIGHT_CHROME;
  const themeBridgeScript = buildNativeThemeBridgeScript(nativeScheme);
  const webInsets = useMemo(() => buildWebViewSafeAreaInsets(insets), [insets]);
  const safeAreaScript = useMemo(() => buildNativeSafeAreaScript(webInsets), [webInsets]);
  const bootstrapScript = `${themeBridgeScript}${safeAreaScript}`;

  useEffect(() => {
    webViewRef.current?.injectJavaScript(bootstrapScript);
  }, [bootstrapScript]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: chromeColor, paddingTop: topInset }]}
      edges={['bottom']}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: webAppUrl }}
        style={styles.webview}
        geolocationEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        injectedJavaScriptBeforeContentLoaded={bootstrapScript}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadEnd={() => setLoading(false)}
        testID="freshy-webview"
      />
      {loading ? (
        <View
          style={[styles.loadingOverlay, { backgroundColor: chromeColor }]}
          pointerEvents="none"
        >
          <ActivityIndicator
            size="large"
            color={defaultTheme.colors.primary}
            accessibilityLabel="Loading Freshy"
          />
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
