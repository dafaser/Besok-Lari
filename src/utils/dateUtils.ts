/**
 * Formats a challenge deadline into user-friendly and grammatically correct English.
 * E.g., '2026-10-07T23:59:59' -> 'Ends on 7 Oct 2026' (or 'Ended on 7 Oct 2026' if past).
 */
export const formatDeadline = (deadline: string): string => {
  if (!deadline) return '';
  try {
    const datePart = deadline.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const month = months[monthIndex] || parts[1];

      const targetTime = new Date(deadline).getTime();
      const isPast = !isNaN(targetTime) && targetTime < Date.now();
      return `${isPast ? 'Ended on' : 'Ends on'} ${day} ${month} ${year}`;
    }
    return `Ends on ${deadline}`;
  } catch {
    return `Ends on ${deadline}`;
  }
};
