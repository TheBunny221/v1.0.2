import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

export const useTranslations = () => {
  const translations = useAppSelector(selectTranslations);

  return translations;
};

export default useTranslations;
