import * as D from 'io-ts/Decoder';
import * as E from 'io-ts/Encoder';
import * as C from 'io-ts/Codec';
import {pipe} from 'fp-ts/function';
import {GroupContext} from '../core/group-common';
import * as M from './manifest';
import {
  SubmittedContest,
  SubmittedBallot,
  SubmittedSelection,
} from './submitted-ballot';
import {
  CiphertextContest,
  CiphertextBallot,
  CiphertextSelection,
} from './ciphertext-ballot';
import {
  PlaintextContest,
  PlaintextBallot,
  PlaintextSelection,
  ExtendedData,
} from './plaintext-ballot';
import {getCoreCodecsForContext as getCoreCodecsForContext} from '../core/json';
import {EncryptionState} from './encrypt';

// These JSON importer/exporter things are using the io-ts package:
// https://github.com/gcanti/io-ts/
// Which, in turn, uses a functional programming library:
// https://github.com/gcanti/fp-ts/

// The decoders have a pipeline where each stage of the pipe is returning Either<Error, T>
// and if an error occurs, the pipeline stops and just returns the error. The output
// isn't actually a JSON string. It's just a JavaScript object with the right fields
// in the right places. You could then call JSON.stringify() on it to get a string,
// and JSON.parse() to get back.

// The encoders don't have to worry about errors, since they presume their input is
// well-formed to begin with.

/**
 * This class gives you a series of {@link C.Codec} codecs. This know how to
 * decode (from ElectionGuard types to plain JS objects, suitable for serialization)
 * and encode (from plain JS objects back to the ElectionGuard types). Note that
 * it's important to use the right codec for the right group. If you decode from
 * a 4096-bit group and encode to a 3072-bit group, the results are not going to
 * be correct.
 */
class Codecs {
  readonly manifestLanguageCodec: C.Codec<unknown, unknown, M.ManifestLanguage>;
  readonly manifestInternationalizedTextCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestInternationalizedText
  >;
  readonly manifestSelectionDescriptionCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestSelectionDescription
  >;
  readonly manifestAnnotatedStringCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestAnnotatedString
  >;
  readonly manifestContactInformationCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestContactInformation
  >;
  readonly manifestGeopoliticalUnitCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestGeopoliticalUnit
  >;
  readonly manifestCandidateCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestCandidate
  >;
  readonly manifestPartyCodec: C.Codec<unknown, unknown, M.ManifestParty>;
  readonly manifestBallotStyleCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestBallotStyle
  >;
  readonly manifestCodec: C.Codec<unknown, unknown, M.Manifest>;
  readonly manifestContestDescriptionCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestContestDescription
  >;
  readonly manifestCandidateContestDescriptionCodec: C.Codec<
    unknown,
    unknown,
    M.ManifestCandidateContestDescription
  >;
  readonly submittedContestCodec: C.Codec<unknown, unknown, SubmittedContest>;
  readonly submittedSelectionCodec: C.Codec<
    unknown,
    unknown,
    SubmittedSelection
  >;
  readonly submittedBallotCodec: C.Codec<unknown, unknown, SubmittedBallot>;
  readonly ciphertextSelectionCodec: C.Codec<
    unknown,
    unknown,
    CiphertextSelection
  >;
  readonly ciphertextContestCodec: C.Codec<unknown, unknown, CiphertextContest>;
  readonly ciphertextBallotCodec: C.Codec<unknown, unknown, CiphertextBallot>;
  readonly extendedDataCodec: C.Codec<unknown, unknown, ExtendedData>;
  readonly plaintextSelectionCodec: C.Codec<
    unknown,
    unknown,
    PlaintextSelection
  >;
  readonly plaintextContestCodec: C.Codec<unknown, unknown, PlaintextContest>;
  readonly plaintextBallotCodec: C.Codec<unknown, unknown, PlaintextBallot>;
  readonly encryptionStateCodec: C.Codec<unknown, unknown, EncryptionState>;

  constructor(readonly context: GroupContext) {
    const manifestLanguageDecoder: D.Decoder<unknown, M.ManifestLanguage> =
      pipe(
        D.struct({
          value: D.string,
          language: D.string,
        }),
        D.map(s => new M.ManifestLanguage(context, s.value, s.language))
      );

    const manifestLanguageEncoder: E.Encoder<unknown, M.ManifestLanguage> = {
      encode: input => ({
        value: input.value,
        language: input.language,
      }),
    };

    this.manifestLanguageCodec = C.make(
      manifestLanguageDecoder,
      manifestLanguageEncoder
    );

    const manifestInternationalizedTextDecoder: D.Decoder<
      unknown,
      M.ManifestInternationalizedText
    > = pipe(
      D.struct({
        text: D.array(manifestLanguageDecoder),
      }),
      D.map(s => new M.ManifestInternationalizedText(context, s.text))
    );

    const manifestInternationalizedTextEncoder: E.Encoder<
      unknown,
      M.ManifestInternationalizedText
    > = {
      encode: input => ({
        text: input.text,
      }),
    };

    this.manifestInternationalizedTextCodec = C.make(
      manifestInternationalizedTextDecoder,
      manifestInternationalizedTextEncoder
    );

    const manifestSelectionDescriptionDecoder: D.Decoder<
      unknown,
      M.ManifestSelectionDescription
    > = pipe(
      D.struct({
        object_id: D.string,
        sequence_order: D.number,
        candidate_id: D.string,
      }),
      D.map(
        s =>
          new M.ManifestSelectionDescription(
            context,
            s.object_id,
            s.sequence_order,
            s.candidate_id
          )
      )
    );

    const manifestSelectionDescriptionEncoder: E.Encoder<
      unknown,
      M.ManifestSelectionDescription
    > = {
      encode: input => ({
        object_id: input.selectionId,
        sequence_order: input.sequenceOrder,
        candidate_id: input.candidateId,
      }),
    };

    this.manifestSelectionDescriptionCodec = C.make(
      manifestSelectionDescriptionDecoder,
      manifestSelectionDescriptionEncoder
    );

    const manifestAnnotatedStringDecoder: D.Decoder<
      unknown,
      M.ManifestAnnotatedString
    > = pipe(
      D.struct({
        annotation: D.string,
        value: D.string,
      }),
      D.map(s => new M.ManifestAnnotatedString(context, s.annotation, s.value))
    );

    const manifestAnnotatedStringEncoder: E.Encoder<
      unknown,
      M.ManifestAnnotatedString
    > = {
      encode: input => ({
        annotation: input.annotation,
        value: input.value,
      }),
    };

    this.manifestAnnotatedStringCodec = C.make(
      manifestAnnotatedStringDecoder,
      manifestAnnotatedStringEncoder
    );

    const manifestContactInformationDecoder: D.Decoder<
      unknown,
      M.ManifestContactInformation
    > = pipe(
      D.struct({
        address_line: D.array(D.string),
        email: D.array(manifestAnnotatedStringDecoder),
        phone: D.array(manifestAnnotatedStringDecoder),
        name: D.string,
      }),
      D.map(
        s =>
          new M.ManifestContactInformation(
            context,
            s.address_line,
            s.email,
            s.phone,
            s.name
          )
      )
    );

    const manifestContactInformationEncoder: E.Encoder<
      unknown,
      M.ManifestContactInformation
    > = {
      encode: input => ({
        address_line: input.addressLine,
        email: input.email,
        phone: input.phone,
        name: input.name,
      }),
    };

    this.manifestContactInformationCodec = C.make(
      manifestContactInformationDecoder,
      manifestContactInformationEncoder
    );

    const manifestGeopoliticalUnitDecoder: D.Decoder<
      unknown,
      M.ManifestGeopoliticalUnit
    > = pipe(
      D.struct({
        object_id: D.string,
        name: D.string,
        type: D.number,
        contact_information: manifestContactInformationDecoder,
      }),
      D.map(
        s =>
          new M.ManifestGeopoliticalUnit(
            context,
            s.object_id,
            s.name,
            s.type as M.ManifestReportingUnitType,
            s.contact_information
          )
      )
    );

    const manifestGeopoliticalUnitEncoder: E.Encoder<
      unknown,
      M.ManifestGeopoliticalUnit
    > = {
      encode: input => ({
        object_id: input.objectId,
        name: input.name,
        type: input.type,
        contact_information: input.contactInformation,
      }),
    };

    this.manifestGeopoliticalUnitCodec = C.make(
      manifestGeopoliticalUnitDecoder,
      manifestGeopoliticalUnitEncoder
    );

    const manifestCandidateDecoder: D.Decoder<unknown, M.ManifestCandidate> =
      pipe(
        D.struct({
          object_id: D.string,
          name: manifestInternationalizedTextDecoder,
          party_id: D.string,
          image_uri: D.string,
          is_write_in: D.boolean,
        }),
        D.map(
          s =>
            new M.ManifestCandidate(
              context,
              s.object_id,
              s.name,
              s.party_id,
              s.image_uri,
              s.is_write_in
            )
        )
      );

    const manifestCandidateEncoder: E.Encoder<unknown, M.ManifestCandidate> = {
      encode: input => ({
        object_id: input.candidateId,
        name: input.name,
        party_id: input.partyId,
        image_uri: input.imageUri,
        is_write_in: input.isWriteIn,
      }),
    };

    this.manifestCandidateCodec = C.make(
      manifestCandidateDecoder,
      manifestCandidateEncoder
    );

    const manifestPartyDecoder: D.Decoder<unknown, M.ManifestParty> = pipe(
      D.struct({
        object_id: D.string,
        name: manifestInternationalizedTextDecoder,
        abbreviation: D.string,
        color: D.string,
        logo_uri: D.string,
      }),
      D.map(
        s =>
          new M.ManifestParty(
            context,
            s.object_id,
            s.name,
            s.abbreviation,
            s.color,
            s.logo_uri
          )
      )
    );

    const manifestPartyEncoder: E.Encoder<unknown, M.ManifestParty> = {
      encode: input => ({
        object_id: input.partyId,
        name: input.name,
        abbreviation: input.abbreviation,
        color: input.color,
        logo_uri: input.logoUri,
      }),
    };

    this.manifestPartyCodec = C.make(
      manifestPartyDecoder,
      manifestPartyEncoder
    );

    const manifestBallotStyleDecoder: D.Decoder<
      unknown,
      M.ManifestBallotStyle
    > = pipe(
      D.struct({
        object_id: D.string,
        geopolitical_unit_ids: D.array(D.string),
        party_ids: D.array(D.string),
        image_uri: D.string,
      }),
      D.map(
        s =>
          new M.ManifestBallotStyle(
            context,
            s.object_id,
            s.geopolitical_unit_ids,
            s.party_ids,
            s.image_uri
          )
      )
    );

    const manifestBallotStyleEncoder: E.Encoder<
      unknown,
      M.ManifestBallotStyle
    > = {
      encode: input => ({
        object_id: input.ballotStyleId,
        geopolitical_unit_ids: input.geopoliticalUnitIds,
        party_ids: input.partyIds,
        image_uri: input.imageUri,
      }),
    };

    this.manifestBallotStyleCodec = C.make(
      manifestBallotStyleDecoder,
      manifestBallotStyleEncoder
    );

    const manifestContestDescriptionDecoder: D.Decoder<
      unknown,
      M.ManifestContestDescription
    > = pipe(
      D.struct({
        object_id: D.string,
        sequence_order: D.number,
        electoral_district_id: D.string,
        vote_variation: D.number,
        number_elected: D.number,
        votes_allowed: D.number,
        name: D.string,
        ballot_selections: D.array(manifestSelectionDescriptionDecoder),
        ballot_title: manifestInternationalizedTextDecoder,
        ballot_subtitle: manifestInternationalizedTextDecoder,
      }),
      D.map(
        s =>
          new M.ManifestContestDescription(
            context,
            s.object_id,
            s.sequence_order,
            s.electoral_district_id,
            s.vote_variation as M.ManifestVoteVariationType,
            s.number_elected,
            s.votes_allowed,
            s.name,
            s.ballot_selections,
            s.ballot_title,
            s.ballot_subtitle
          )
      )
    );

    const manifestContestDescriptionEncoder: E.Encoder<
      unknown,
      M.ManifestContestDescription
    > = {
      encode: input => ({
        object_id: input.contestId,
        sequence_order: input.sequenceOrder,
        electoral_district_id: input.geopoliticalUnitId,
        vote_variation: M.ManifestVoteVariationType[input.voteVariation],
        number_elected: input.numberElected,
        votes_allowed: input.votesAllowed,
        name: input.name,
        ballot_selections: input.selections.map(
          manifestSelectionDescriptionEncoder.encode
        ),
        ballot_title:
          input.ballotTitle &&
          manifestInternationalizedTextEncoder.encode(input.ballotTitle),
        ballot_subtitle:
          input.ballotSubtitle &&
          manifestInternationalizedTextEncoder.encode(input.ballotSubtitle),
      }),
    };

    this.manifestContestDescriptionCodec = C.make(
      manifestContestDescriptionDecoder,
      manifestContestDescriptionEncoder
    );

    const manifestCandidateContestDescriptionDecoder: D.Decoder<
      unknown,
      M.ManifestCandidateContestDescription
    > = pipe(
      D.struct({
        object_id: D.string,
        sequence_order: D.number,
        electoral_district_id: D.string,
        vote_variation: D.number,
        number_elected: D.number,
        votes_allowed: D.number,
        name: D.string,
        ballot_selections: D.array(manifestSelectionDescriptionDecoder),
        ballot_title: manifestInternationalizedTextDecoder,
        ballot_subtitle: manifestInternationalizedTextDecoder,
        primary_party_ids: D.array(D.string),
      }),
      D.map(
        s =>
          new M.ManifestCandidateContestDescription(
            context,
            s.object_id,
            s.sequence_order,
            s.electoral_district_id,
            s.vote_variation as M.ManifestVoteVariationType,
            s.number_elected,
            s.votes_allowed,
            s.name,
            s.ballot_selections,
            s.ballot_title,
            s.ballot_subtitle,
            s.primary_party_ids
          )
      )
    );

    const manifestCandidateContestDescriptionEncoder: E.Encoder<
      unknown,
      M.ManifestCandidateContestDescription
    > = {
      encode: input => ({
        ...(manifestContestDescriptionEncoder.encode(input) as Object),
        primary_party_ids: input.primaryPartyIds,
      }),
    };

    this.manifestCandidateContestDescriptionCodec = C.make(
      manifestCandidateContestDescriptionDecoder,
      manifestCandidateContestDescriptionEncoder
    );

    const manifestDecoder: D.Decoder<unknown, M.Manifest> = pipe(
      D.struct({
        election_scope_id: D.string,
        spec_version: D.string,
        type: D.number,
        start_date: D.string,
        end_date: D.string,
        geopolitical_units: D.array(manifestGeopoliticalUnitDecoder),
        parties: D.array(manifestPartyDecoder),
        candidates: D.array(manifestCandidateDecoder),
        contests: D.array(manifestContestDescriptionDecoder),
        ballots: D.array(manifestBallotStyleDecoder),
        name: manifestInternationalizedTextDecoder,
        contact_information: manifestContactInformationDecoder,
      }),
      D.map(
        s =>
          new M.Manifest(
            context,
            s.election_scope_id,
            s.spec_version,
            s.type,
            s.start_date,
            s.end_date,
            s.geopolitical_units,
            s.parties,
            s.candidates,
            s.contests,
            s.ballots,
            s.name,
            s.contact_information
          )
      )
    );

    const manifestEncoder: E.Encoder<unknown, M.Manifest> = {
      encode: input => ({
        election_scope_id: input.electionScopeId,
        spec_version: input.specVersion,
        type: input.electionType,
        start_date: input.startDate,
        end_date: input.endDate,
        geopolitical_units: manifestGeopoliticalUnitEncoder.encode,
        parties: input.parties.map(manifestPartyEncoder.encode),
        candidates: input.candidates.map(manifestCandidateEncoder.encode),
        contests: input.contests.map(manifestContestDescriptionEncoder.encode),
        ballots: input.ballotStyles.map(manifestBallotStyleEncoder.encode),
        name:
          input.name && manifestInternationalizedTextEncoder.encode(input.name),
        contact_information:
          input.contactInformation &&
          manifestContactInformationEncoder.encode(input.contactInformation),
      }),
    };

    this.manifestCodec = C.make(manifestDecoder, manifestEncoder);

    const submittedSelectionDecoder: D.Decoder<unknown, SubmittedSelection> =
      pipe(
        D.struct({
          object_id: D.string,
          sequence_order: D.number,
          description_hash: getCoreCodecsForContext(context).elementModQCodec,
          ciphertext: getCoreCodecsForContext(context).elGamalCiphertextCodec,
          crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
          nonce: D.string,
          is_placeholder_selection: D.boolean,
          proof:
            getCoreCodecsForContext(context)
              .disjunctiveChaumPedersenProofKnownNonceCodec,
          extended_data: D.string,
        }),
        D.map(
          s =>
            new SubmittedSelection(
              s.object_id,
              s.sequence_order,
              s.description_hash,
              s.ciphertext,
              s.crypto_hash,
              s.is_placeholder_selection,
              s.proof
            )
        )
      );

    const submittedSelectionEncoder: E.Encoder<unknown, SubmittedSelection> = {
      encode: input => ({
        object_id: input.selectionId,
        sequence_order: input.sequenceOrder,
        description_hash: getCoreCodecsForContext(
          context
        ).elementModQCodec.encode(input.selectionHash),
        ciphertext: getCoreCodecsForContext(
          context
        ).elGamalCiphertextCodec.encode(input.ciphertext),
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.cryptoHashElement
        ),
        is_placeholder_selection: input.isPlaceholderSelection,
        proof: getCoreCodecsForContext(
          context
        ).disjunctiveChaumPedersenProofKnownNonceCodec.encode(input.proof),
        extended_data:
          input.extendedData &&
          getCoreCodecsForContext(context).hashedElGamalCiphertextCodec.encode(
            input.extendedData
          ),
      }),
    };

    this.submittedSelectionCodec = C.make(
      submittedSelectionDecoder,
      submittedSelectionEncoder
    );

    const submittedContestDecoder: D.Decoder<unknown, SubmittedContest> = pipe(
      D.struct({
        object_id: D.string,
        sequence_order: D.number,
        description_hash: getCoreCodecsForContext(context).elementModQCodec,
        ballot_selections: D.array(submittedSelectionDecoder),
        ciphertext_accumulation:
          getCoreCodecsForContext(context).elGamalCiphertextCodec,
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
        proof:
          getCoreCodecsForContext(context)
            .constantChaumPedersenProofKnownNonceCodec,
      }),
      D.map(
        s =>
          new SubmittedContest(
            s.object_id,
            s.sequence_order,
            s.description_hash,
            s.ballot_selections,
            s.ciphertext_accumulation,
            s.crypto_hash,
            s.proof
          )
      )
    );

    const submittedContestEncoder: E.Encoder<unknown, SubmittedContest> = {
      encode: input => ({
        object_id: input.contestId,
        sequence_order: input.sequenceOrder,
        description_hash: getCoreCodecsForContext(
          context
        ).elementModQCodec.encode(input.contestHash),
        ballot_selections: input.selections.map(
          submittedSelectionEncoder.encode
        ),
        ciphertext_accumulation: getCoreCodecsForContext(
          context
        ).elGamalCiphertextCodec.encode(input.ciphertextAccumulation),
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.cryptoHashElement
        ),
        proof: getCoreCodecsForContext(
          context
        ).constantChaumPedersenProofKnownNonceCodec.encode(input.proof),
      }),
    };

    this.submittedContestCodec = C.make(
      submittedContestDecoder,
      submittedContestEncoder
    );

    const submittedBallotDecoder: D.Decoder<unknown, SubmittedBallot> = pipe(
      D.struct({
        object_id: D.string,
        style_id: D.string,
        manifest_hash: getCoreCodecsForContext(context).elementModQCodec,
        code_hash: getCoreCodecsForContext(context).elementModQCodec,
        contests: D.array(submittedContestDecoder),
        code: getCoreCodecsForContext(context).elementModQCodec,
        timestamp: D.number,
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
        state: D.number,
      }),
      D.map(
        s =>
          new SubmittedBallot(
            s.object_id,
            s.style_id,
            s.manifest_hash,
            s.code_hash,
            s.code,
            s.contests,
            s.timestamp,
            s.crypto_hash,
            s.state
          )
      )
    );

    const submittedBallotEncoder: E.Encoder<unknown, SubmittedBallot> = {
      encode: input => ({
        object_id: input.ballotId,
        style_id: input.ballotStyleId,
        manifest_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.manifestHash
        ),
        code_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.codeSeed
        ),
        contests: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.code
        ),
        code: input.contests.map(submittedContestEncoder.encode),
        timestamp: input.timestamp,
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.cryptoHashElement
        ),
        state: input.state,
      }),
    };

    this.submittedBallotCodec = C.make(
      submittedBallotDecoder,
      submittedBallotEncoder
    );

    const ciphertextSelectionDecoder: D.Decoder<unknown, CiphertextSelection> =
      pipe(
        D.struct({
          object_id: D.string,
          sequence_order: D.number,
          description_hash: getCoreCodecsForContext(context).elementModQCodec,
          ciphertext: getCoreCodecsForContext(context).elGamalCiphertextCodec,
          crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
          nonce: getCoreCodecsForContext(context).elementModQCodec,
          is_placeholder_selection: D.boolean,
          proof:
            getCoreCodecsForContext(context)
              .disjunctiveChaumPedersenProofKnownNonceCodec,
          extended_data:
            getCoreCodecsForContext(context).hashedElGamalCiphertextCodec,
        }),
        D.map(
          s =>
            new CiphertextSelection(
              s.object_id,
              s.sequence_order,
              s.description_hash,
              s.ciphertext,
              s.crypto_hash,
              s.is_placeholder_selection,
              s.proof,
              s.nonce,
              s.extended_data
            )
        )
      );

    const ciphertextSelectionEncoder: E.Encoder<unknown, CiphertextSelection> =
      {
        encode: input => ({
          object_id: input.selectionId,
          sequence_order: input.sequenceOrder,
          description_hash: getCoreCodecsForContext(
            context
          ).elementModQCodec.encode(input.selectionHash),
          ciphertext: getCoreCodecsForContext(
            context
          ).elGamalCiphertextCodec.encode(input.ciphertext),
          crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
            input.cryptoHash
          ),
          is_placeholder_selection: input.isPlaceholderSelection,
          proof: getCoreCodecsForContext(
            context
          ).disjunctiveChaumPedersenProofKnownNonceCodec.encode(input.proof),
          extended_data:
            input.extendedData &&
            getCoreCodecsForContext(
              context
            ).hashedElGamalCiphertextCodec.encode(input.extendedData),
        }),
      };

    this.ciphertextSelectionCodec = C.make(
      ciphertextSelectionDecoder,
      ciphertextSelectionEncoder
    );

    const ciphertextContestDecoder: D.Decoder<unknown, CiphertextContest> =
      pipe(
        D.struct({
          object_id: D.string,
          sequence_order: D.number,
          description_hash: getCoreCodecsForContext(context).elementModQCodec,
          ballot_selections: D.array(ciphertextSelectionDecoder),
          ciphertext_accumulation:
            getCoreCodecsForContext(context).elGamalCiphertextCodec,
          crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
          nonce: getCoreCodecsForContext(context).elementModQCodec,
          proof:
            getCoreCodecsForContext(context)
              .constantChaumPedersenProofKnownNonceCodec,
        }),
        D.map(
          s =>
            new CiphertextContest(
              s.object_id,
              s.sequence_order,
              s.description_hash,
              s.ballot_selections,
              s.ciphertext_accumulation,
              s.crypto_hash,
              s.proof,
              s.nonce
            )
        )
      );

    const ciphertextContestEncoder: E.Encoder<unknown, CiphertextContest> = {
      encode: input => ({
        object_id: input.contestId,
        sequence_order: input.sequenceOrder,
        description_hash: getCoreCodecsForContext(
          context
        ).elementModQCodec.encode(input.contestHash),
        ballot_selections: input.selections.map(
          ciphertextSelectionEncoder.encode
        ),
        ciphertext_accumulation: getCoreCodecsForContext(
          context
        ).elGamalCiphertextCodec.encode(input.ciphertextAccumulation),
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.cryptoHash
        ),
        proof: getCoreCodecsForContext(
          context
        ).constantChaumPedersenProofKnownNonceCodec.encode(input.proof),
      }),
    };

    this.ciphertextContestCodec = C.make(
      ciphertextContestDecoder,
      ciphertextContestEncoder
    );

    const ciphertextBallotDecoder: D.Decoder<unknown, CiphertextBallot> = pipe(
      D.struct({
        object_id: D.string,
        style_id: D.string,
        manifest_hash: getCoreCodecsForContext(context).elementModQCodec,
        code_hash: getCoreCodecsForContext(context).elementModQCodec,
        contests: D.array(ciphertextContestDecoder),
        code: getCoreCodecsForContext(context).elementModQCodec,
        timestamp: D.number,
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec,
        nonce: getCoreCodecsForContext(context).elementModQCodec,
      }),
      D.map(
        s =>
          new CiphertextBallot(
            s.object_id,
            s.style_id,
            s.manifest_hash,
            s.code_hash,
            s.code,
            s.contests,
            s.timestamp,
            s.crypto_hash,
            s.nonce
          )
      )
    );

    const ciphertextBallotEncoder: E.Encoder<unknown, CiphertextBallot> = {
      encode: input => ({
        object_id: input.ballotId,
        style_id: input.ballotStyleId,
        manifest_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.manifestHash
        ),
        code_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.codeSeed
        ),
        contests: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.code
        ),
        code: input.contests.map(ciphertextContestEncoder.encode),
        timestamp: input.timestamp,
        crypto_hash: getCoreCodecsForContext(context).elementModQCodec.encode(
          input.cryptoHash
        ),
      }),
    };

    this.ciphertextBallotCodec = C.make(
      ciphertextBallotDecoder,
      ciphertextBallotEncoder
    );

    const extendedDataDecoder: D.Decoder<unknown, ExtendedData> = pipe(
      D.struct({
        value: D.string,
        length: D.number,
      }),
      D.map(s => new ExtendedData(s.value, s.length))
    );

    const extendedDataEncoder: E.Encoder<unknown, ExtendedData> = {
      encode: input => ({
        value: input.value,
        length: input.length,
      }),
    };

    this.extendedDataCodec = C.make(extendedDataDecoder, extendedDataEncoder);

    const plaintextSelectionDecoder: D.Decoder<unknown, PlaintextSelection> =
      pipe(
        D.struct({
          object_id: D.string,
          sequence_order: D.number,
          vote: D.number,
          is_placeholder_selection: D.boolean,
          extended_data: extendedDataDecoder,
        }),
        D.map(
          s =>
            new PlaintextSelection(
              s.object_id,
              s.sequence_order,
              s.vote,
              s.is_placeholder_selection,
              s.extended_data
            )
        )
      );

    const plaintextSelectionEncoder: E.Encoder<unknown, PlaintextSelection> = {
      encode: input => ({
        object_id: input.selectionId,
        sequence_order: input.sequenceOrder,
        vote: input.vote,
        is_placeholder_selection: input.isPlaceholderSelection,
        extended_data: input.extendedData && extendedDataEncoder,
      }),
    };

    this.plaintextSelectionCodec = C.make(
      plaintextSelectionDecoder,
      plaintextSelectionEncoder
    );

    const plaintextContestDecoder: D.Decoder<unknown, PlaintextContest> = pipe(
      D.struct({
        object_id: D.string,
        sequence_order: D.number,
        ballot_selections: D.array(plaintextSelectionDecoder),
      }),
      D.map(
        s =>
          new PlaintextContest(
            s.object_id,
            s.sequence_order,
            s.ballot_selections
          )
      )
    );

    const plaintextContestEncoder: E.Encoder<unknown, PlaintextContest> = {
      encode: input => ({
        object_id: input.contestId,
        sequence_order: input.sequenceOrder,
        ballot_selections: input.selections.map(
          plaintextSelectionEncoder.encode
        ),
      }),
    };

    this.plaintextContestCodec = C.make(
      plaintextContestDecoder,
      plaintextContestEncoder
    );

    const plaintextBallotDecoder: D.Decoder<unknown, PlaintextBallot> = pipe(
      D.struct({
        object_id: D.string,
        style_id: D.string,
        contests: D.array(plaintextContestDecoder),
      }),
      D.map(s => new PlaintextBallot(s.object_id, s.style_id, s.contests))
    );

    const plaintextBallotEncoder: E.Encoder<unknown, PlaintextBallot> = {
      encode: input => ({
        object_id: input.ballotId,
        style_id: input.ballotStyleId,
        contests: input.contests.map(plaintextContestEncoder.encode),
      }),
    };

    this.plaintextBallotCodec = C.make(
      plaintextBallotDecoder,
      plaintextBallotEncoder
    );

    const encryptionStateDecoder: D.Decoder<unknown, EncryptionState> = pipe(
      D.struct({
        public_key: getCoreCodecsForContext(context).elGamalPublicKeyCodec,
        extended_base_hash: getCoreCodecsForContext(context).elementModQCodec,
        manifest: manifestDecoder,
        context: getCoreCodecsForContext(context).electionContextCodec,
      }),
      D.map(s => new EncryptionState(context, s.manifest, s.context, true))
    );

    const encryptionStateEncoder: E.Encoder<unknown, EncryptionState> = {
      encode: input => ({
        public_key: getCoreCodecsForContext(
          context
        ).elGamalPublicKeyCodec.encode(input.publicKey),
        extended_base_hash: getCoreCodecsForContext(
          context
        ).elementModQCodec.encode(input.extendedBaseHash),
        manifest: manifestEncoder.encode(input.manifest),
        context: getCoreCodecsForContext(context).electionContextCodec.encode(
          input.context
        ),
      }),
    };

    this.encryptionStateCodec = C.make(
      encryptionStateDecoder,
      encryptionStateEncoder
    );
  }
}

const codecs = new Map<string, Codecs>();

export function getBallotCodecsForContext(context: GroupContext): Codecs {
  let result = codecs.get(context.name);
  if (result === undefined) {
    result = new Codecs(context);
    codecs.set(context.name, new Codecs(context));
  }
  return result;
}
