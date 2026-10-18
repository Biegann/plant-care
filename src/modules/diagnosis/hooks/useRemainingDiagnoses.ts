import { useQuery } from "@tanstack/react-query";
import { getRemainingDiagnoses } from "../api/diagnosisApi";

export const remainingDiagnosesKey = ["diagnosis-remaining"] as const;

// Ile diagnoz AI zostało dziś zalogowanemu użytkownikowi
export function useRemainingDiagnoses() {
  return useQuery({
    queryKey: remainingDiagnosesKey,
    queryFn: async () => {
      const result = await getRemainingDiagnoses();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    // dzień może się zmienić, a licznik zmienia się też na innym telefonie
    staleTime: 0,
  });
}
