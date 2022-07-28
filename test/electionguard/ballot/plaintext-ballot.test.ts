import fc from 'fast-check';
import {
  bigIntContext3072,
  PlaintextBallot,
  PlaintextContest,
} from '../../../src/electionguard';
import {shuffleArray} from '../../../src/electionguard/core/utils';
import {fcFastConfig} from '../core/generators';
import {electionAndBallots} from './generators';

const groupContext = bigIntContext3072();

describe('Plaintext ballots', () => {
  test("Shuffling contests and selections doesn't affect equality", () => {
    fc.assert(
      fc.property(electionAndBallots(groupContext, 1), eb => {
        const [ballot] = eb.ballots;
        const copy = new PlaintextBallot(
          ballot.ballotId,
          ballot.ballotStyleId,
          shuffleArray(
            ballot.contests.map(
              contest =>
                new PlaintextContest(
                  contest.contestId,
                  shuffleArray(contest.selections)
                )
            )
          )
        );
        expect(copy.equals(ballot)).toBe(true);
      })
    );
  });

  test('Normalization works', () => {
    fc.assert(
      fc.property(electionAndBallots(groupContext, 1), eb => {
        const [ballot] = eb.ballots;
        const normalizedBallot = ballot.normalize(eb.manifest);

        normalizedBallot.contests.forEach(contest => {
          const mcontest = eb.manifest.getContest(contest.contestId);
          expect(mcontest).toBeTruthy();

          expect(contest.selections.map(s => s.selectionId)).toStrictEqual(
            mcontest?.selections.map(s => s.selectionId)
          );
        });
      }),
      fcFastConfig
    );

    // idempotent
    fc.assert(
      fc.property(electionAndBallots(groupContext, 1), eb => {
        const [ballot] = eb.ballots;
        expect(
          ballot
            .normalize(eb.manifest)
            .equals(ballot.normalize(eb.manifest).normalize(eb.manifest))
        ).toBe(true);
      }),
      fcFastConfig
    );
  });
});
