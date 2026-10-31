"use client";

import { memo, useEffect, useRef, useState } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTextUIStore } from "@/features/compare/text/store/useTextUIStore";
import { IGNORE_RULE_LIMITS, IgnoreRule } from "@/types/settings";
import { activeIgnorePatterns } from "@/features/compare/text/services/diff/comparisonNormalizer";

const PATTERN_COMMIT_DELAY_MS = 300;

function updateRules(update: (rules: IgnoreRule[]) => IgnoreRule[]) {
  const { settings, updateSettings } = useSettingsStore.getState();
  updateSettings({ ignoreRules: update(settings.ignoreRules) });
}

const IgnoreRuleRow = memo(({ rule, index }: { rule: IgnoreRule; index: number }) => {
  const [draft, setDraft] = useState(rule.pattern);
  const committed = useRef(rule.pattern);
  const latestDraft = useRef(rule.pattern);

  useEffect(() => {
    const commit = () => {
      if (latestDraft.current === committed.current) return;
      committed.current = latestDraft.current;
      const pattern = latestDraft.current;
      updateRules((rules) => rules.map((item) => item.id === rule.id ? { ...item, pattern } : item));
    };
    if (draft === committed.current) return;
    const timer = window.setTimeout(commit, PATTERN_COMMIT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, rule.id]);

  useEffect(() => () => {
    if (latestDraft.current === committed.current) return;
    const pattern = latestDraft.current;
    updateRules((rules) => rules.map((item) => item.id === rule.id ? { ...item, pattern } : item));
  }, [rule.id]);

  return (
    <div className="flex items-center gap-2">
      <Switch size="sm" checked={rule.isEnabled} aria-label={`Use rule ${index + 1}`}
        onChange={(event) => updateRules((rules) => rules.map((item) => item.id === rule.id ? { ...item, isEnabled: event.target.checked } : item))} />
      <Input size="sm" value={draft} maxLength={IGNORE_RULE_LIMITS.maxPatternLength} placeholder="Text to ignore"
        aria-label={`Ignore rule ${index + 1}`} spellCheck={false} onChange={(event) => {
          latestDraft.current = event.target.value;
          setDraft(event.target.value);
        }} />
      <IconButton size="sm" aria-label={`Remove rule ${index + 1}`} title="Remove rule"
        onClick={() => updateRules((rules) => rules.filter((item) => item.id !== rule.id))}>
        <MdClose />
      </IconButton>
    </div>
  );
});

IgnoreRuleRow.displayName = "IgnoreRuleRow";

export function IgnoreRulesEditor() {
  const rules = useSettingsStore((state) => state.settings.ignoreRules);
  const literalRules = rules.filter((rule) => rule.kind === "literal");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-primary">Ignore rules</span>
      {literalRules.length === 0 && (
        <p className="text-xs text-text-secondary">Text that matches a rule is ignored on both sides, for example timestamps or build numbers.</p>
      )}
      {literalRules.map((rule, index) => <IgnoreRuleRow key={rule.id} rule={rule} index={index} />)}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" leftIcon={<MdAdd />} disabled={rules.length >= IGNORE_RULE_LIMITS.maxRules}
          onClick={() => updateRules((current) => [...current, { id: crypto.randomUUID(), pattern: "", kind: "literal", isEnabled: true }])}>
          Add rule
        </Button>
        {rules.length > 0 && <Button size="sm" variant="ghost" onClick={() => updateRules(() => [])}>Clear rules</Button>}
      </div>
    </div>
  );
}

export function IgnoreRulesIndicator() {
  const rules = useSettingsStore((state) => state.settings.ignoreRules);
  const count = activeIgnorePatterns(rules).length;
  if (!count) return null;
  const openOptions = () => {
    const ui = useTextUIStore.getState();
    ui.setOptionsPanelTab("options");
    ui.setIsOptionsPanelOpen(true);
  };
  return <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={openOptions}>{count === 1 ? "1 ignore rule" : `${count} ignore rules`}</Button>;
}
