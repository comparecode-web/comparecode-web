import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { DEFAULT_QR_WEBSITE_URL, type QrContent } from "../services/qrPayload";

interface QrContentFieldsProps {
  content: QrContent;
  onChange: (content: QrContent) => void;
  passwordVisible: boolean;
  onPasswordVisibleChange: (visible: boolean) => void;
}

function TextField({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "url";
}) {
  return (
    <FormField label={label}>{field => <Input {...field} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} />}</FormField>
  );
}

export function QrContentFields({ content, onChange, passwordVisible, onPasswordVisibleChange }: QrContentFieldsProps) {
  switch (content.type) {
    case "url":
      return <TextField label="Website URL" type="url" value={content.url} onChange={(url) => onChange({ ...content, url })} placeholder={DEFAULT_QR_WEBSITE_URL} />;
    case "text":
      return (
        <FormField label="Text">{field => <Textarea {...field} className="min-h-36" value={content.text} onChange={(event) => onChange({ ...content, text: event.target.value })} placeholder="Enter text to share" spellCheck={false} />}</FormField>
      );
    case "wifi":
      return (
        <div className="grid gap-4">
          <TextField label="Network name (SSID)" value={content.ssid} onChange={(ssid) => onChange({ ...content, ssid })} placeholder="My network" />
          <SelectDropdown label="Security" value={content.security} onChange={(security) => onChange({ ...content, security: security === "nopass" ? "nopass" : "WPA" })} options={[{ value: "WPA", label: "Password protected" }, { value: "nopass", label: "Open network" }]} />
          {content.security === "WPA" && (
            <div className="grid gap-2">
              <TextField label="Password" type={passwordVisible ? "text" : "password"} value={content.password} onChange={(password) => onChange({ ...content, password })} placeholder="Wi-Fi password" />
              <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={() => onPasswordVisibleChange(!passwordVisible)}>{passwordVisible ? "Hide password" : "Show password"}</Button>
            </div>
          )}
          <Switch label="Hidden network" checked={content.hidden} onChange={(event) => onChange({ ...content, hidden: event.target.checked })} />
          <p className="text-xs leading-5 text-text-secondary">Off: for networks shown in Wi-Fi lists. On: tells supported scanners to connect to a network that does not broadcast its name.</p>
          <p className="text-xs leading-5 text-text-secondary">Anyone who scans or receives this QR code can read the network password.</p>
        </div>
      );
  }
}
