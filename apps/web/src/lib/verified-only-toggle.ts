export type VerifiedOnlyToggleCopy = {
  pressed: boolean;
  ariaLabel: string;
  stateLabel: 'On' | 'Off';
};

/** Accessible copy for the header/menu verified-only toggle. */
export function verifiedOnlyToggleCopy(verifiedOnly: boolean): VerifiedOnlyToggleCopy {
  if (verifiedOnly) {
    return {
      pressed: true,
      ariaLabel: 'Showing verified places only',
      stateLabel: 'On',
    };
  }
  return {
    pressed: false,
    ariaLabel: 'Showing all places including unverified',
    stateLabel: 'Off',
  };
}
