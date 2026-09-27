export type DateTimeFieldProps = {
  /** Shown above the pickers; also their accessibility label. */
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  /** IANA zone the time is edited in (the pop-up's own), whatever the device's. */
  timeZone: string;
  minimumDate?: Date;
};
