import { useLocalSearchParams } from "expo-router";
import { VerifyEmailForm } from "../../modules/auth/ui/VerifyEmailForm";

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return <VerifyEmailForm email={email ?? ""} />;
}
