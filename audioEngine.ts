/**
 * OmniCut Studio Audio Engine (Legacy Facade & Unified Audio Manager)
 * 
 * Re-exports the unified AudioManager singleton to ensure backwards compatibility
 * across all existing studio components while enforcing global media output routing.
 */

import { AudioManager, audioManager } from './audioManager';

export { AudioManager, audioManager };
export const audioEngine = audioManager;
