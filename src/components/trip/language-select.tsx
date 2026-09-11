import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";

export function LanguageSelect() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      <Languages className="size-4 text-muted-foreground" aria-hidden="true" />
      <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
        <SelectTrigger
          aria-label={t("lang.label")}
          className="h-9 w-[7.5rem] rounded-full border-border bg-card text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
