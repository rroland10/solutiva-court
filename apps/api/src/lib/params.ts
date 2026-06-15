export function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export function disputeLookup(id: string) {
  return {
    OR: [{ id }, { caseNumber: Number(id) || -1 }],
  };
}
