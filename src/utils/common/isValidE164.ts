export function isValidE164(phoneNumber: string): boolean {
  // E.164 format regex:
  // ^ - start of string
  // \+ - must start with plus sign
  // [1-9] - country code must start with non-zero digit
  // \d{1,14} - followed by 1-14 digits
  // $ - end of string
  // Total length (including +) must be between 3 and 16 characters
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!phoneNumber) {
    return false;
  }

  // Check if string matches regex pattern
  if (!e164Regex.test(phoneNumber)) {
    return false;
  }

  // Verify total length is between 3 and 16 characters (including the + prefix)
  if (phoneNumber.length < 3 || phoneNumber.length > 16) {
    return false;
  }

  return true;
}
