import { useState } from 'react';
import PlayButton from './PlayButton.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

export default function ExamStimulus({ item, onReadInstead = () => {} }) {
  const [shown, setShown] = useState(false);
  const [lang] = useLessonLang();
  return (
    <div className="mt-4 space-y-3">
      {item.text && <p className="whitespace-pre-line rounded-clay bg-paper-sunk p-4 text-ink" lang="de">{item.text}</p>}
      {item.audioText && <>
        <PlayButton lektionId={item.lektionId} audioKey={item.lineKey} text={item.audioText} rate={0.9} onFallback={() => { setShown(true); onReadInstead(item.id); }} />
        {shown && <>
          <p className="whitespace-pre-line text-ink" lang="de">{item.audioText}</p>
          <p className="text-sm text-graphite">{t('checkpoint.readInstead', lang)}</p>
        </>}
      </>}
      {item.pictures && <div className="grid grid-cols-3 gap-3">
        {item.pictures.map((picture) => <figure key={picture.option}>
          <img src={picture.src} alt={picture.alt} className="h-28 w-full object-contain" />
          <figcaption className="mt-1 text-center font-bold">{picture.option}</figcaption>
        </figure>)}
      </div>}
    </div>
  );
}
