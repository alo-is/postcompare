// src/lib/postal-changes.ts — derived figures for the 2027 postal-change bulletin
import type { PostalAnnouncement, PostalChangesData } from './types';

/** Consumer announcements only (business previews stay as research data). */
export function consumerAnnouncements(data: PostalChangesData): PostalAnnouncement[] {
  return data.announcements.filter(({ scope }) => scope === 'consumer');
}

/**
 * Countries with at least one confirmed consumer announcement.
 * One country can have several sources (France: La Poste and the Arcep opinion),
 * so the teaser counts countries, not announcements.
 */
export function confirmedConsumerCountries(data: PostalChangesData): string[] {
  const codes = consumerAnnouncements(data)
    .filter(({ status }) => status === 'confirmed')
    .map(({ country }) => country);
  return [...new Set(codes)];
}
