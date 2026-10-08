// contracts.js
// "Smart contract" logic layer — encapsulates the business rules that would
// live inside a Solidity contract (degree_contract.sol) or Fabric chaincode.
// Kept as plain JS functions operating on the ledger so the same logic is
// portable to a real chaincode/Solidity port later.

const crypto = require('crypto');
const { sha256 } = require('./blockchain');

// ---- Degree Issuance Contract ----
function issueDegreeContract(blockchain, { universityId, universityName, studentId, studentName, program, degreeDate, issuedBy }) {
  // Edge case: duplicate issuance guard — same student + program + university already issued & not revoked
  const existing = blockchain.chain.find(b =>
    b.type === 'DEGREE_ISSUANCE' &&
    b.payload.studentId === studentId &&
    b.payload.program === program &&
    b.payload.universityId === universityId &&
    !isRevoked(blockchain, b.payload.degreeHash)
  );

  if (existing) {
    return { success: false, error: 'DUPLICATE_ISSUANCE', message: `An active degree already exists for this student/program (hash ${existing.payload.degreeHash.substring(0,12)}...)` };
  }

  const degreeId = crypto.randomUUID();
  const degreeHash = sha256({ degreeId, universityId, studentId, program, degreeDate, salt: crypto.randomBytes(8).toString('hex') });

  const payload = {
    degreeId,
    degreeHash,
    universityId,
    universityName,
    studentId,
    studentName,
    program,
    degreeDate,
    issuedBy,
    status: 'ACTIVE'
  };

  const block = blockchain.addBlock('DEGREE_ISSUANCE', payload);
  return { success: true, block, degreeHash, degreeId };
}

// ---- Revocation Contract ----
function revokeDegreeContract(blockchain, { degreeHash, revokedBy, reason }) {
  const original = blockchain.findBlockByDegreeHash(degreeHash);
  if (!original) {
    return { success: false, error: 'NOT_FOUND', message: 'No degree found with this hash on-chain.' };
  }
  if (isRevoked(blockchain, degreeHash)) {
    return { success: false, error: 'ALREADY_REVOKED', message: 'This degree has already been revoked.' };
  }

  const block = blockchain.addBlock('REVOCATION', {
    degreeHash,
    degreeId: original.payload.degreeId,
    revokedBy,
    reason: reason || 'Not specified'
  });
  return { success: true, block };
}

function isRevoked(blockchain, degreeHash) {
  return blockchain.chain.some(b => b.type === 'REVOCATION' && b.payload.degreeHash === degreeHash);
}

// ---- Verification Contract ----
function verifyDegreeContract(blockchain, { degreeHash, studentId, requestedBy }) {
  const issuance = blockchain.findBlockByDegreeHash(degreeHash);

  let result;
  if (!issuance) {
    result = { matched: false, reason: 'NO_MATCHING_RECORD', detail: 'No block on-chain matches this degree hash. Possible forged/fake degree.' };
  } else if (studentId && issuance.payload.studentId !== studentId) {
    result = { matched: false, reason: 'STUDENT_ID_MISMATCH', detail: 'Degree hash exists but submitted student ID does not match the on-chain record.' };
  } else if (isRevoked(blockchain, degreeHash)) {
    result = { matched: false, reason: 'REVOKED', detail: 'This degree was valid but has since been revoked by the issuing university.' };
  } else {
    // Integrity check: ensure the block hasn't been tampered with
    const chainCheck = blockchain.isValid();
    if (!chainCheck.valid) {
      result = { matched: false, reason: 'CHAIN_INTEGRITY_FAILURE', detail: 'Ledger integrity check failed — possible tampering detected in the chain.' };
    } else {
      result = {
        matched: true,
        reason: 'VALID',
        detail: 'Degree verified successfully against the immutable ledger.',
        record: {
          studentName: issuance.payload.studentName,
          studentId: issuance.payload.studentId,
          program: issuance.payload.program,
          universityName: issuance.payload.universityName,
          degreeDate: issuance.payload.degreeDate,
          issuedAt: issuance.timestamp
        }
      };
    }
  }

  const block = blockchain.addBlock('DEGREE_VERIFICATION', {
    degreeHash,
    studentIdSubmitted: studentId || null,
    requestedBy,
    result: result.matched ? 'VALID' : 'INVALID',
    reason: result.reason
  });

  return { ...result, auditBlock: block };
}

module.exports = { issueDegreeContract, revokeDegreeContract, verifyDegreeContract, isRevoked };
