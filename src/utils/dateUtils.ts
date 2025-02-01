export function timeSpentToDate(timestamp: any) {
    if (!timestamp || !timestamp.toDate) return null;
    const date = timestamp.toDate();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }