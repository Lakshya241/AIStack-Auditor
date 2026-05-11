import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type {
  UseFormHandleSubmit,
  UseFormReturn,
  UseFieldArrayReturn,
  Control,
  UseFormRegister,
  UseFormWatch,
  FormState,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auditRequestSchema } from "../lib/schemas/auditSchema";
import { useLocalStorage } from "./useLocalStorage";
import type { ToolName, PlanName } from "../types/tool";

export type AuditFormValues = z.infer<typeof auditRequestSchema>;

const STORAGE_KEY = "audit-form-state";

const EMPTY_ROW: AuditFormValues["tools"][number] = {
  tool: "" as ToolName,
  plan: "" as PlanName,
  seats: 1,
  monthlySpend: 0,
  useCase: "",
};

const DEFAULT_VALUES: AuditFormValues = {
  tools: [EMPTY_ROW],
};

export interface UseAuditFormReturn {
  fields: UseFieldArrayReturn<AuditFormValues, "tools">["fields"];
  append: UseFieldArrayReturn<AuditFormValues, "tools">["append"];
  remove: UseFieldArrayReturn<AuditFormValues, "tools">["remove"];
  handleSubmit: UseFormHandleSubmit<AuditFormValues>;
  formState: FormState<AuditFormValues>;
  control: Control<AuditFormValues>;
  register: UseFormRegister<AuditFormValues>;
  watch: UseFormWatch<AuditFormValues>;
}

export function useAuditForm(): UseAuditFormReturn {
  const [storedValue, setStoredValue] = useLocalStorage<unknown>(
    STORAGE_KEY,
    null
  );

  // Determine initial values: restore from localStorage if valid, else use default
  const getInitialValues = (): AuditFormValues => {
    if (storedValue === null) {
      return DEFAULT_VALUES;
    }
    const parsed = auditRequestSchema.safeParse(storedValue);
    if (parsed.success) {
      return parsed.data;
    }
    return DEFAULT_VALUES;
  };

  const {
    control,
    register,
    handleSubmit,
    formState,
    watch,
    reset,
  }: UseFormReturn<AuditFormValues> = useForm<AuditFormValues>({
    resolver: zodResolver(auditRequestSchema),
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray<AuditFormValues, "tools">({
    control,
    name: "tools",
  });

  // On mount: re-validate stored value and reset if corrupt
  useEffect(() => {
    if (storedValue === null) {
      return;
    }
    const parsed = auditRequestSchema.safeParse(storedValue);
    if (!parsed.success) {
      // Discard corrupt data and reset to one empty row
      setStoredValue(null);
      reset(DEFAULT_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch form changes and persist to localStorage
  useEffect(() => {
    const subscription = watch((values) => {
      setStoredValue(values);
    });
    return () => subscription.unsubscribe();
  }, [watch, setStoredValue]);

  return {
    fields,
    append,
    remove,
    handleSubmit,
    formState,
    control,
    register,
    watch,
  };
}
