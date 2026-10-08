// seed.js
// Implements the assignment's required Simulation Scenario:
//  - 2 universities, 3 students, 2 employers
//  - Issue at least 5 digital degrees
//  - Perform degree verification for 3 cases
//  - Simulate 1 fake degree attempt and show system detection
//
// Run with the server STOPPED first (it writes directly to the data files),
// or simply run it once before starting the server:
//   node seed.js
//   node server.js

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (fs.existsSync(DATA_DIR)) {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  console.log('Cleared existing data/ directory for a fresh simulation run.\n');
}

const { Blockchain } = require('./blockchain');
const { issueDegreeContract, verifyDegreeContract } = require('./contracts');
const AC = require('./accessControl');

const blockchain = new Blockchain();

function created(label, result) {
  console.log(`${result.success !== false ? '✔' : '✘'} ${label}`);
}

console.log('--- Creating participants ---\n');

// 2 Universities
const uni1 = AC.createUser({ name: 'Dr. Aamir Khan', email: 'admin@iqra.edu.pk', password: 'University@123', role: 'university', orgName: 'Iqra University' });
const uni2 = AC.createUser({ name: 'Dr. Sara Malik', email: 'admin@nust.edu.pk', password: 'University@123', role: 'university', orgName: 'NUST' });
created('University 1: Iqra University', uni1);
created('University 2: NUST', uni2);

// 3 Students
const stu1 = AC.createUser({ name: 'Ali Raza', email: 'ali.raza@student.edu', password: 'Student@123', role: 'student' });
const stu2 = AC.createUser({ name: 'Hina Tariq', email: 'hina.tariq@student.edu', password: 'Student@123', role: 'student' });
const stu3 = AC.createUser({ name: 'Bilal Ahmed', email: 'bilal.ahmed@student.edu', password: 'Student@123', role: 'student' });
created('Student 1: Ali Raza', stu1);
created('Student 2: Hina Tariq', stu2);
created('Student 3: Bilal Ahmed', stu3);

// 2 Employers
const emp1 = AC.createUser({ name: 'HR Dept', email: 'hr@systemslimited.com', password: 'Employer@123', role: 'employer', orgName: 'Systems Limited' });
const emp2 = AC.createUser({ name: 'Talent Team', email: 'talent@devsinc.com', password: 'Employer@123', role: 'employer', orgName: 'Devsinc' });
created('Employer 1: Systems Limited', emp1);
created('Employer 2: Devsinc', emp2);

console.log('\n--- Issuing degrees (5 total) ---\n');

const issued = [];

issued.push(issueDegreeContract(blockchain, {
  universityId: uni1.user.userId, universityName: 'Iqra University',
  studentId: stu1.user.userId, studentName: 'Ali Raza',
  program: 'BS Computer Science', degreeDate: '2025-06-15', issuedBy: uni1.user.email
}));

issued.push(issueDegreeContract(blockchain, {
  universityId: uni1.user.userId, universityName: 'Iqra University',
  studentId: stu2.user.userId, studentName: 'Hina Tariq',
  program: 'BS Cyber Security', degreeDate: '2025-06-15', issuedBy: uni1.user.email
}));

issued.push(issueDegreeContract(blockchain, {
  universityId: uni1.user.userId, universityName: 'Iqra University',
  studentId: stu3.user.userId, studentName: 'Bilal Ahmed',
  program: 'BS Software Engineering', degreeDate: '2025-06-15', issuedBy: uni1.user.email
}));

issued.push(issueDegreeContract(blockchain, {
  universityId: uni2.user.userId, universityName: 'NUST',
  studentId: stu1.user.userId, studentName: 'Ali Raza',
  program: 'MS Data Science', degreeDate: '2026-01-20', issuedBy: uni2.user.email
}));

issued.push(issueDegreeContract(blockchain, {
  universityId: uni2.user.userId, universityName: 'NUST',
  studentId: stu2.user.userId, studentName: 'Hina Tariq',
  program: 'MS Information Security', degreeDate: '2026-01-20', issuedBy: uni2.user.email
}));

issued.forEach((r, i) => created(`Degree ${i + 1}: ${r.success ? r.degreeHash.substring(0, 16) + '...' : r.error}`, r));

AC.logAccess({ userId: 'system', email: 'seed-script', event: 'SEED_ISSUANCE', success: true, detail: `${issued.length} degrees issued` });

console.log('\n--- Verifying degrees (3 legitimate cases) ---\n');

const v1 = verifyDegreeContract(blockchain, { degreeHash: issued[0].degreeHash, studentId: stu1.user.userId, requestedBy: emp1.user.email });
console.log(`Case 1 (Ali Raza @ Iqra, by Systems Limited): ${v1.matched ? 'VALID ✔' : 'INVALID ✘'} — ${v1.detail}`);

const v2 = verifyDegreeContract(blockchain, { degreeHash: issued[1].degreeHash, studentId: stu2.user.userId, requestedBy: emp2.user.email });
console.log(`Case 2 (Hina Tariq @ Iqra, by Devsinc): ${v2.matched ? 'VALID ✔' : 'INVALID ✘'} — ${v2.detail}`);

const v3 = verifyDegreeContract(blockchain, { degreeHash: issued[3].degreeHash, studentId: stu1.user.userId, requestedBy: emp1.user.email });
console.log(`Case 3 (Ali Raza MS @ NUST, by Systems Limited): ${v3.matched ? 'VALID ✔' : 'INVALID ✘'} — ${v3.detail}`);

console.log('\n--- Simulating 1 FAKE degree attempt ---\n');

// Fraud simulation: an attacker submits a fabricated hash that was never issued on-chain
const fakeHash = 'a1b2c3d4e5f6fake0000111122223333444455556666777788889999aaaabbb';
const fraud = verifyDegreeContract(blockchain, { degreeHash: fakeHash, studentId: stu3.user.userId, requestedBy: emp2.user.email });
console.log(`Fake degree submitted by Devsinc for "Bilal Ahmed": ${fraud.matched ? 'VALID (BAD!)' : 'REJECTED ✘ (fraud correctly detected)'}`);
console.log(`Reason: ${fraud.detail}`);

AC.logAccess({ userId: emp2.user.userId, email: emp2.user.email, event: 'UNAUTHORIZED_ATTEMPT', action: 'fake_degree_verification', success: false, detail: 'Fraud attempt — fabricated degree hash submitted' });

console.log('\n--- Chain integrity check ---\n');
const validity = blockchain.isValid();
console.log(validity.valid ? '✔ Blockchain is valid and untampered.' : `✘ Chain broken: ${validity.reason}`);

console.log(`\nTotal blocks on chain: ${blockchain.chain.length}`);
console.log('\nSimulation complete. Login credentials for testing:\n');
console.log('  University 1 : admin@iqra.edu.pk     / University@123');
console.log('  University 2 : admin@nust.edu.pk     / University@123');
console.log('  Student 1    : ali.raza@student.edu   / Student@123');
console.log('  Student 2    : hina.tariq@student.edu / Student@123');
console.log('  Student 3    : bilal.ahmed@student.edu/ Student@123');
console.log('  Employer 1   : hr@systemslimited.com  / Employer@123');
console.log('  Employer 2   : talent@devsinc.com     / Employer@123');
console.log('\nSample degree hash to verify (Ali Raza, Iqra):');
console.log(`  ${issued[0].degreeHash}`);
console.log('\nNow run: node server.js\n');
