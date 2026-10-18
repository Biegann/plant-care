import { useLocalSearchParams } from "expo-router";
import { DiagnosisView } from "../../../modules/diagnosis/ui/DiagnosisView";

export default function DiagnosisScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  return <DiagnosisView plantId={plantId} />;
}
