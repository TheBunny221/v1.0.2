import React, { useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { cn } from "../../lib/utils";
import { Eye, EyeOff, Upload, X } from "lucide-react";

// Base form field props
interface BaseFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Text input field
interface TextInputProps<T extends FieldValues> extends BaseFormFieldProps<T> {
  type?: "text" | "email" | "tel" | "url" | "search";
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  type = "text",
  autoComplete,
  maxLength,
  minLength,
  pattern,
  leftIcon,
  rightIcon,
}: TextInputProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              {leftIcon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {leftIcon}
                </div>
              )}
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                maxLength={maxLength}
                minLength={minLength}
                pattern={pattern}
                className={cn(
                  leftIcon && "pl-10",
                  rightIcon && "pr-10",
                  fieldState.error && "border-red-500 focus:border-red-500",
                )}
                aria-invalid={fieldState.error ? "true" : "false"}
                aria-describedby={
                  fieldState.error
                    ? `${name}-error`
                    : description
                      ? `${name}-description`
                      : undefined
                }
              />
              {rightIcon && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {rightIcon}
                </div>
              )}
            </div>
          </FormControl>
          {description && (
            <FormDescription id={`${name}-description`}>
              {description}
            </FormDescription>
          )}
          <FormMessage id={`${name}-error`} />
        </FormItem>
      )}
    />
  );
}

// Password input field with toggle visibility
interface PasswordInputProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  autoComplete?: string;
  showStrengthIndicator?: boolean;
}

export function PasswordInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  autoComplete = "current-password",
  showStrengthIndicator = false,
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                className={cn(
                  "pr-10",
                  fieldState.error && "border-red-500 focus:border-red-500",
                )}
                aria-invalid={fieldState.error ? "true" : "false"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormControl>
          {showStrengthIndicator && field.value && (
            <PasswordStrengthIndicator password={field.value} />
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Password strength indicator
function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  return (
    <div className="mt-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-2 w-full rounded",
              level <= strength ? strengthColors[strength - 1] : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <p className="text-sm text-gray-600 mt-1">
        Strength: {strengthLabels[strength - 1] || "Very Weak"}
      </p>
    </div>
  );
}

// Textarea field
interface TextareaFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  rows = 3,
  maxLength,
  showCharCount = false,
  resize = "vertical",
}: TextareaFieldProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                className={cn(
                  fieldState.error && "border-red-500 focus:border-red-500",
                  resize === "none" && "resize-none",
                  resize === "vertical" && "resize-y",
                  resize === "horizontal" && "resize-x",
                )}
                style={{ resize }}
                aria-invalid={fieldState.error ? "true" : "false"}
              />
              {showCharCount && maxLength && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {field.value?.length || 0}/{maxLength}
                </div>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Select field
interface SelectFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  options: { value: string; label: string; disabled?: boolean }[];
  emptyText?: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  options,
  emptyText = "No options available",
}: SelectFieldProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={!!disabled}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  fieldState.error && "border-red-500 focus:border-red-500",
                )}
                aria-invalid={fieldState.error ? "true" : "false"}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.length === 0 ? (
                <SelectItem value="no-options" disabled>
                  {emptyText}
                </SelectItem>
              ) : (
                options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={!!option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Checkbox field
interface CheckboxFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  children: React.ReactNode;
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  description,
  disabled,
  className,
  children,
}: CheckboxFieldProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-start space-x-3 space-y-0",
            className,
          )}
        >
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="cursor-pointer">{children}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
        </FormItem>
      )}
    />
  );
}

// Radio group field
interface RadioGroupFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  options: {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }[];
  orientation?: "horizontal" | "vertical";
}

export function RadioGroupField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  orientation = "vertical",
}: RadioGroupFieldProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={cn(
                orientation === "horizontal"
                  ? "flex flex-row space-x-4"
                  : "flex flex-col space-y-2",
              )}
              disabled={disabled}
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center space-x-3 space-y-0"
                >
                  <FormControl>
                    <RadioGroupItem
                      value={option.value}
                      disabled={option.disabled || disabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer font-normal">
                      {option.label}
                    </FormLabel>
                    {option.description && (
                      <FormDescription>{option.description}</FormDescription>
                    )}
                  </div>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Switch field
interface SwitchFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  children: React.ReactNode;
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  description,
  disabled,
  className,
  children,
}: SwitchFieldProps<T>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between rounded-lg border p-4",
            className,
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base cursor-pointer">
              {children}
            </FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

// File upload field
interface FileUploadFieldProps<T extends FieldValues>
  extends BaseFormFieldProps<T> {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFileSelect?: (files: FileList | null) => void;
}

export function FileUploadField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  accept,
  multiple = false,
  maxSize,
  onFileSelect,
}: FileUploadFieldProps<T>) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field: { onChange, value, ...field }, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel
              className={cn(
                required &&
                  "after:content-['*'] after:ml-0.5 after:text-red-500",
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="space-y-2">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  fieldState.error
                    ? "border-red-500 hover:border-red-600"
                    : "border-gray-300 hover:border-gray-400",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => !disabled && inputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                {accept && (
                  <p className="text-xs text-gray-500">
                    Accepted formats: {accept}
                  </p>
                )}
                {maxSize && (
                  <p className="text-xs text-gray-500">
                    Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
                  </p>
                )}
              </div>

              <input
                {...field}
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  onChange(multiple ? files : files?.[0] || null);
                  onFileSelect?.(files);
                }}
              />

              {value && (
                <div className="space-y-2">
                  {multiple && Array.isArray(value) ? (
                    value.map((file: File, index: number) => (
                      <FilePreview
                        key={index}
                        file={file}
                        onRemove={() => {
                          const newFiles = value.filter(
                            (_: any, i: number) => i !== index,
                          );
                          onChange(newFiles.length > 0 ? newFiles : null);
                        }}
                      />
                    ))
                  ) : (value as any) instanceof File ? (
                    <FilePreview file={value} onRemove={() => onChange(null)} />
                  ) : null}
                </div>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// File preview component
function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <div className="flex items-center space-x-2">
        <div className="text-sm">
          <p className="font-medium">{file.name}</p>
          <p className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
