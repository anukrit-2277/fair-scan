/**
 * Shared math utilities for the fairness pipeline.
 * Single source of truth — avoids duplication across services.
 */

const round4 = (n) => Math.round(n * 10000) / 10000;

const round2 = (n) => Math.round(n * 100) / 100;

module.exports = { round4, round2 };
