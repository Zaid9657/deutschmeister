import { SPEECH_ART_PATHS } from '../../data/speechArt.js';

/** Original decoration, never product or outcome evidence. */
export default function SpeechArt() {
  return <svg className="dm-speech-art" viewBox="0 0 380 220" fill="none" aria-hidden="true">
    {SPEECH_ART_PATHS.map((path, i) => <path key={i} {...path} />)}
  </svg>;
}
