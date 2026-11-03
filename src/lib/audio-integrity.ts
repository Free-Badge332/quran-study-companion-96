import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function recordingChecksum(bytes: Uint8Array) {
  if (bytes.length < 3 || !((bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) || (bytes[0] === 255 && ((bytes[1] ?? 0) & 224) === 224))) {
    throw new Error('Invalid MP3 recording. Download again.');
  }
  return bytesToHex(sha256(bytes));
}

export function verifyRecording(bytes: Uint8Array, expectedBytes?: number, checksum?: string) {
  if (expectedBytes && bytes.length !== expectedBytes) throw new Error('Incomplete audio file. Download again.');
  const actual = recordingChecksum(bytes);
  if (checksum && actual !== checksum) throw new Error('Corrupted audio file. Download again.');
  return actual;
}