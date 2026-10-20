import i18next from "i18next";
import * as WebBrowser from "expo-web-browser";

export const SITE_URL = "https://plantcareapp.pl";

// Strona ma polską wersję pod /privacy/ i angielską pod /en/privacy/
export function privacyPolicyUrl(language: string | undefined): string {
  return language?.startsWith("pl")
    ? `${SITE_URL}/privacy/`
    : `${SITE_URL}/en/privacy/`;
}

export async function openPrivacyPolicy(): Promise<void> {
  await WebBrowser.openBrowserAsync(privacyPolicyUrl(i18next.language));
}
