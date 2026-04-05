/**
 * Client-side validator utilities
 */

/**
 * Checks if email matches the college domain.
 * The domain is set from the environment or defaults to cgc.edu.in
 */
const COLLEGE_DOMAIN = import.meta.env.VITE_COLLEGE_DOMAIN || 'cgc.edu.in';

export function isValidCollegeEmail(email) {
  return typeof email === 'string' && email.trim().endsWith(`@${COLLEGE_DOMAIN}`);
}

export function isValidOTP(otp) {
  return /^\d{6}$/.test(otp);
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function isValidRollNo(rollNo) {
  // Basic check: non-empty alphanumeric string
  return typeof rollNo === 'string' && rollNo.trim().length >= 4;
}

/**
 * Returns a relative time string like "2 hours ago"
 */
export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60)    return 'just now';
  if (diffMins < 60)    return `${diffMins}m ago`;
  if (diffHours < 24)   return `${diffHours}h ago`;
  if (diffDays < 7)     return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Get initials from a display name (for avatar fallback)
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
