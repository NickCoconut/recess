import { CheckToggle } from "../common/CheckToggle";

interface ShareToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ShareToggle({ checked, onChange }: ShareToggleProps) {
  return (
    <CheckToggle
      checked={checked}
      onChange={onChange}
      label="Share to today's feed"
      tooltip={
        checked
          ? "Your sentence joins today's public feed."
          : "Only you will see this."
      }
      tooltipWidthClass={checked ? "w-53" : "w-46"}
    />
  );
}
