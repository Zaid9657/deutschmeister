import * as v from '../../scripts/validate-curriculum.mjs';
import { CURRICULUM_A21 } from '../../src/data/curricula/a21.js';

export function a21RatchetMeasurements(c = CURRICULUM_A21) {
  const spec = v.levelSpec(c.level);
  const twins = v.englishTwins(c, spec);
  return {
    uncoveredWortfeld: v.wortfeldCoverage(c).length,
    untaughtItemTokens: v.itemLexis(c).length,
    untaughtDrawnTokens: v.drawnLexis(c).length,
    missionlessLektionen: v.missionlessLektionen(c).length,
    unexemplifiedNoticeForms: v.noticeFormCoverage(c).length,
    untaughtInProduction: v.producedBeforeTaught(c).length,
    deferredConstructions: v.constructionsBeforeTaught(c, v.loadPoolItems(c.level)).length,
    unbackedExamTeile: v.examTeileBacked(c).length,
    modelChecklistBreaks: v.modelTextsPassOwnChecklist(c).length,
    sharedProductionLines: v.sharedProductionLines(c).length,
    untaughtInModelTexts: v.modelTextLexis(c, spec).length,
    unanswerableLeitpunkte: v.writingTasksAreAnswerable(c, spec).length,
    wortfeldWithoutInput: v.wortfeldInputCoverage(c, spec).length,
    gradedTaskWordsWithoutInput: v.gradedTaskWordsWithoutInput(c, spec).length,
    formSpeakSentences: v.formSpeakInModelTexts(c, spec).length,
    missingEnglishTwins: twins.lektionen.length + twins.pool.length,
  };
}
