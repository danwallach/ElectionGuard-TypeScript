import fs from 'fs/promises';
import path from 'path';
import {getCodecsForContext as getBallotCodecsForContext} from '../../src/electionguard/ballot/json';
import {
  getCodecsForContext as getCoreCodecsForContext,
  eitherRightOrFail,
} from '../../src/electionguard/core/json';
import {
  bigIntContext4096,
  bigIntContextFromConstants,
} from '../../src/electionguard/core/group-bigint';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Either';
import {GroupContext} from '../../src/electionguard/core/group-common';

describe('compat', () => {
  test('can decode elections generated by electionguard-python', async () => {
    const content = await fs.readFile(
      path.join(
        'test',
        'compat',
        'fixtures',
        '9DE17EF86BDDC04779B6BED6C5FEC75C8736B383F19D023DD4BB7D2CC7F64165.json'
      ),
      'utf-8'
    );
    const artifacts = JSON.parse(content);

    const possiblyManifest = getBallotCodecsForContext(
      bigIntContext4096()
    ).manifestCodec.decode(artifacts.manifest);

    let manifest;
    pipe(
      possiblyManifest,
      fold(
        err => {
          throw new Error(JSON.stringify(err, null, 4));
        },
        w => {
          manifest = w;
          expect(manifest).toBeTruthy();
          console.log(manifest.cryptoHashElement);
        }
      )
    );

    const possiblyElectionContext = getCoreCodecsForContext(
      bigIntContext4096()
    ).electionContextCodec.decode(artifacts.context);

    let electionContext;
    pipe(
      possiblyElectionContext,
      fold(
        err => {
          throw new Error(JSON.stringify(err, null, 4));
        },
        w => {
          electionContext = w;
          expect(electionContext).toBeTruthy();
        }
      )
    );
  });

  test('can decode the sample data', async () => {
    const dir = path.join(
      'test',
      'compat',
      'sample',
      'hamilton-general',
      'election_record'
    );
    let content = await fs.readFile(path.join(dir, 'constants.json'), 'utf-8');
    const constantsJson = JSON.parse(content);
    const possiblyConstants = getCoreCodecsForContext(
      bigIntContext4096()
    ).electionConstantsCodec.decode(constantsJson);
    const constants = eitherRightOrFail(possiblyConstants);
    const groupContext = bigIntContextFromConstants(constants);
    if (groupContext === undefined) {
      throw new Error('oop');
    }
    // bigIntContextFromConstants

    content = await fs.readFile(path.join(dir, 'manifest.json'), 'utf-8');
    const manifestJson = JSON.parse(content);

    const possiblyManifest = getBallotCodecsForContext(
      groupContext as GroupContext
    ).manifestCodec.decode(manifestJson);

    const manifest = eitherRightOrFail(possiblyManifest);
    console.log(manifest.cryptoHashElement.cryptoHashString);

    content = await fs.readFile(path.join(dir, 'context.json'), 'utf-8');
    const contextJson = JSON.parse(content);

    const possiblyContext = getCoreCodecsForContext(
      groupContext as GroupContext
    ).electionContextCodec.decode(contextJson);

    const context = eitherRightOrFail(possiblyContext);

    content = await fs.readFile(
      path.join(
        dir,
        '..',
        'election_private_data',
        'plaintext_ballots',
        'plaintext_ballot_ballot-ddf5a59a-73f3-11ec-aaed-acde48001122.json'
      ),
      'utf-8'
    );
    const plaintextBallotJson = JSON.parse(content);

    const possiblyPlaintextBallot = getBallotCodecsForContext(
      groupContext
    ).plaintextBallotCodec.decode(plaintextBallotJson);

    const plaintextBallot = eitherRightOrFail(possiblyPlaintextBallot);

    content = await fs.readFile(
      path.join(
        dir,
        '..',
        'election_private_data',
        'ciphertext_ballots',
        'ciphertext_ballot_ballot-ddf5a59a-73f3-11ec-aaed-acde48001122.json'
      ),
      'utf-8'
    );
    const ciphertextBallotJson = JSON.parse(content);

    const possiblyCiphertextBallot = getBallotCodecsForContext(
      groupContext
    ).ciphertextBallotCodec.decode(ciphertextBallotJson);

    const ciphertextBallot = eitherRightOrFail(possiblyCiphertextBallot);
  });
});
