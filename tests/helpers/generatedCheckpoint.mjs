// A1.1's checkpoints serve written banks (a11.lesen.js, a11.hoeren.js, a11.assessment.js). The generator that
// draws a paper from the scenes and the practice pool is still the builder of a level without banks (and of
// the test fixtures), so its guards run on a stand-in: the same checkpoint with its banks taken away.
export const generatedCheckpoint = (cp) => ({ ...cp, lesen: undefined, hoeren: undefined, assessmentPapers: undefined });
export const generatedCurriculum = (curriculum) => ({ ...curriculum, checkpoints: curriculum.checkpoints.map(generatedCheckpoint) });
