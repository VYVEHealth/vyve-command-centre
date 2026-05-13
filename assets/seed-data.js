// =====================================================================
// VYVE Command Centre — Seed Data
// One-time snapshot from Make.com data stores (Analytics, Podcast Episodes, Post Log).
// Populates localStorage on first run so users see real content immediately.
//
// Pulled via Make MCP on 2026-05-13:
//   - VYVE Analytics (107716):       93 performance entries
//   - VYVE Podcast Episodes (113609): 53 podcast entries
//   - VYVE Post Log (106900):         6 content entries
//
// Skip-if-existing logic: re-running this never overwrites user edits.
// Versioned via SEED_VERSION so future seeds can add new data without clobbering current.
// =====================================================================

(function(){
  'use strict';
  var SEED_VERSION = '2026-05-13.1';
  var SEED_FLAG = 'vyve_seeded_version';
  try {
    if (localStorage.getItem(SEED_FLAG) === SEED_VERSION) return;
  } catch(e) { return; }

  var performance = [
  {
    "_id": "perf_li_2026-04-13",
    "channel": "linkedin",
    "date": "2026-04-13",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1707,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-13T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-14",
    "channel": "linkedin",
    "date": "2026-04-14",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1749,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-14T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-15",
    "channel": "linkedin",
    "date": "2026-04-15",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1813,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-15T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-16",
    "channel": "linkedin",
    "date": "2026-04-16",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1807,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-16T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-17",
    "channel": "linkedin",
    "date": "2026-04-17",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1785,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-17T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-18",
    "channel": "linkedin",
    "date": "2026-04-18",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1784,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-18T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-19",
    "channel": "linkedin",
    "date": "2026-04-19",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1779,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-19T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-20",
    "channel": "linkedin",
    "date": "2026-04-20",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1779,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-20T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-21",
    "channel": "linkedin",
    "date": "2026-04-21",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1756,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-21T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-22",
    "channel": "linkedin",
    "date": "2026-04-22",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1758,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-04-22T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-23",
    "channel": "linkedin",
    "date": "2026-04-23",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1758,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-23T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-24",
    "channel": "linkedin",
    "date": "2026-04-24",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1757,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-24T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-25",
    "channel": "linkedin",
    "date": "2026-04-25",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1838,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-25T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-26",
    "channel": "linkedin",
    "date": "2026-04-26",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1884,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-26T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-27",
    "channel": "linkedin",
    "date": "2026-04-27",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1888,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-27T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-28",
    "channel": "linkedin",
    "date": "2026-04-28",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1921,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-28T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-29",
    "channel": "linkedin",
    "date": "2026-04-29",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1943,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-29T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-04-30",
    "channel": "linkedin",
    "date": "2026-04-30",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1956,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-04-30T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-01",
    "channel": "linkedin",
    "date": "2026-05-01",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1955,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-05-01T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-02",
    "channel": "linkedin",
    "date": "2026-05-02",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1974,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-05-02T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-03",
    "channel": "linkedin",
    "date": "2026-05-03",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1982,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-05-03T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-04",
    "channel": "linkedin",
    "date": "2026-05-04",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1982,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-05-04T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-05",
    "channel": "linkedin",
    "date": "2026-05-05",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1983,
    "engagements": 19,
    "conversions": 0,
    "created_at": "2026-05-05T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-06",
    "channel": "linkedin",
    "date": "2026-05-06",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1977,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-06T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-07",
    "channel": "linkedin",
    "date": "2026-05-07",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1976,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-07T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-08",
    "channel": "linkedin",
    "date": "2026-05-08",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1970,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-08T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-09",
    "channel": "linkedin",
    "date": "2026-05-09",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1952,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-09T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-10",
    "channel": "linkedin",
    "date": "2026-05-10",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1950,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-10T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-11",
    "channel": "linkedin",
    "date": "2026-05-11",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1955,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-11T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-12",
    "channel": "linkedin",
    "date": "2026-05-12",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1970,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-12T23:41:00.000Z"
  },
  {
    "_id": "perf_li_2026-05-13",
    "channel": "linkedin",
    "date": "2026-05-13",
    "title": "LinkedIn Company Page — Daily Aggregate",
    "reach": 1993,
    "engagements": 18,
    "conversions": 0,
    "created_at": "2026-05-13T23:41:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-13",
    "channel": "instagram",
    "date": "2026-04-13",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-13T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-14",
    "channel": "instagram",
    "date": "2026-04-14",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-14T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-15",
    "channel": "instagram",
    "date": "2026-04-15",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-15T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-16",
    "channel": "instagram",
    "date": "2026-04-16",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-16T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-17",
    "channel": "instagram",
    "date": "2026-04-17",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-17T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-18",
    "channel": "instagram",
    "date": "2026-04-18",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-18T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-19",
    "channel": "instagram",
    "date": "2026-04-19",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-19T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-20",
    "channel": "instagram",
    "date": "2026-04-20",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-20T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-21",
    "channel": "instagram",
    "date": "2026-04-21",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-21T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-22",
    "channel": "instagram",
    "date": "2026-04-22",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-22T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-23",
    "channel": "instagram",
    "date": "2026-04-23",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-23T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-24",
    "channel": "instagram",
    "date": "2026-04-24",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-24T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-25",
    "channel": "instagram",
    "date": "2026-04-25",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-25T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-26",
    "channel": "instagram",
    "date": "2026-04-26",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-26T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-27",
    "channel": "instagram",
    "date": "2026-04-27",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-27T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-28",
    "channel": "instagram",
    "date": "2026-04-28",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-28T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-29",
    "channel": "instagram",
    "date": "2026-04-29",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-29T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-04-30",
    "channel": "instagram",
    "date": "2026-04-30",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-04-30T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-01",
    "channel": "instagram",
    "date": "2026-05-01",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-01T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-02",
    "channel": "instagram",
    "date": "2026-05-02",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-02T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-03",
    "channel": "instagram",
    "date": "2026-05-03",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-03T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-04",
    "channel": "instagram",
    "date": "2026-05-04",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-04T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-05",
    "channel": "instagram",
    "date": "2026-05-05",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-05T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-06",
    "channel": "instagram",
    "date": "2026-05-06",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-06T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-07",
    "channel": "instagram",
    "date": "2026-05-07",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-07T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-08",
    "channel": "instagram",
    "date": "2026-05-08",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-08T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-09",
    "channel": "instagram",
    "date": "2026-05-09",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-09T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-10",
    "channel": "instagram",
    "date": "2026-05-10",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-10T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-11",
    "channel": "instagram",
    "date": "2026-05-11",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-11T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-12",
    "channel": "instagram",
    "date": "2026-05-12",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-12T23:44:00.000Z"
  },
  {
    "_id": "perf_ig_2026-05-13",
    "channel": "instagram",
    "date": "2026-05-13",
    "title": "Instagram — Lewis suicide awareness carousel",
    "reach": 0,
    "engagements": 8,
    "conversions": 0,
    "created_at": "2026-05-13T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-13",
    "channel": "facebook",
    "date": "2026-04-13",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-13T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-14",
    "channel": "facebook",
    "date": "2026-04-14",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-14T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-15",
    "channel": "facebook",
    "date": "2026-04-15",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-15T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-16",
    "channel": "facebook",
    "date": "2026-04-16",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-16T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-17",
    "channel": "facebook",
    "date": "2026-04-17",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-17T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-18",
    "channel": "facebook",
    "date": "2026-04-18",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-18T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-19",
    "channel": "facebook",
    "date": "2026-04-19",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-19T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-20",
    "channel": "facebook",
    "date": "2026-04-20",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-20T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-21",
    "channel": "facebook",
    "date": "2026-04-21",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-21T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-22",
    "channel": "facebook",
    "date": "2026-04-22",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-22T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-23",
    "channel": "facebook",
    "date": "2026-04-23",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-23T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-24",
    "channel": "facebook",
    "date": "2026-04-24",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-24T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-25",
    "channel": "facebook",
    "date": "2026-04-25",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-25T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-26",
    "channel": "facebook",
    "date": "2026-04-26",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-26T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-27",
    "channel": "facebook",
    "date": "2026-04-27",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-27T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-28",
    "channel": "facebook",
    "date": "2026-04-28",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-28T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-29",
    "channel": "facebook",
    "date": "2026-04-29",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-29T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-04-30",
    "channel": "facebook",
    "date": "2026-04-30",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-04-30T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-01",
    "channel": "facebook",
    "date": "2026-05-01",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-01T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-02",
    "channel": "facebook",
    "date": "2026-05-02",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-02T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-03",
    "channel": "facebook",
    "date": "2026-05-03",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-03T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-04",
    "channel": "facebook",
    "date": "2026-05-04",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-04T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-05",
    "channel": "facebook",
    "date": "2026-05-05",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-05T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-06",
    "channel": "facebook",
    "date": "2026-05-06",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-06T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-07",
    "channel": "facebook",
    "date": "2026-05-07",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-07T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-08",
    "channel": "facebook",
    "date": "2026-05-08",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-08T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-09",
    "channel": "facebook",
    "date": "2026-05-09",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-09T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-10",
    "channel": "facebook",
    "date": "2026-05-10",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-10T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-11",
    "channel": "facebook",
    "date": "2026-05-11",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-11T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-12",
    "channel": "facebook",
    "date": "2026-05-12",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-12T23:44:00.000Z"
  },
  {
    "_id": "perf_fb_2026-05-13",
    "channel": "facebook",
    "date": "2026-05-13",
    "title": "Facebook — Workplace wellbeing strategy post",
    "reach": 0,
    "engagements": 0,
    "conversions": 0,
    "created_at": "2026-05-13T23:44:00.000Z"
  }
];
  var podcastEps = [
  {
    "_id": "ep_69329332aef2c71c1db32241",
    "title": "Becoming the Ultra You with David Gleghorn",
    "guest": "David Gleghorn",
    "status": "published",
    "published_at": "2025-12-14T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 59 min — Acast: https://shows.acast.com/the-everyman/episodes/becoming-the-ultra-you-with-david-gleghorn",
    "downloads": 0,
    "created_at": "2025-12-14T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_6932925738a11f5f3eeaebae",
    "title": "Your Vibe Attracts your Tribe with Paul Callendar",
    "guest": "Paul Callendar",
    "status": "published",
    "published_at": "2025-12-11T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 53 min — Acast: https://shows.acast.com/the-everyman/episodes/your-vibe-attracts-your-tribe-with-paul-callendar",
    "downloads": 0,
    "created_at": "2025-12-11T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_693290cb38a11f5f3eea9cc5",
    "title": "Why you Overeat and how to stop for good with Sam Gibson",
    "guest": "Sam Gibson",
    "status": "published",
    "published_at": "2025-12-08T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 87 min — Acast: https://shows.acast.com/the-everyman/episodes/why-you-overeat-and-how-to-stop-for-good-with-sam-gibson",
    "downloads": 0,
    "created_at": "2025-12-08T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_69328f9b646719321c97e1af",
    "title": "How to stay ahead in an ever-changing world with Kim Lindsay",
    "guest": "Kim Lindsay",
    "status": "published",
    "published_at": "2025-12-05T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 116 min — Acast: https://shows.acast.com/the-everyman/episodes/how-to-stay-ahead-in-an-ever-changing-world-with-kim-lindsay",
    "downloads": 0,
    "created_at": "2025-12-05T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_690c92108cebe28c0ce0a55c",
    "title": "Transforming Lives Through Sport: David Nesl Journey",
    "guest": "David Nesl",
    "status": "published",
    "published_at": "2025-11-06T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 57 min — Acast: https://shows.acast.com/the-everyman/episodes/transforming-lives-through-sport-david-nesl-journey",
    "downloads": 0,
    "created_at": "2025-11-06T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_690c8e428cebe28c0cdfcdb0",
    "title": "Understanding Neurodiversity: A New Perspective on Mental Health",
    "guest": "",
    "status": "published",
    "published_at": "2025-11-06T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 99 min — Acast: https://shows.acast.com/the-everyman/episodes/understanding-neurodiversity-a-new-perspective-on-mental-hea",
    "downloads": 0,
    "created_at": "2025-11-06T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_690c8c91b27ff20ceb618dd7",
    "title": "Taking the time for you with Clear for Men",
    "guest": "Clear for Men",
    "status": "published",
    "published_at": "2025-11-06T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 57 min — Acast: https://shows.acast.com/the-everyman/episodes/taking-the-time-for-you-with-clear-for-men",
    "downloads": 0,
    "created_at": "2025-11-06T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05f4d639ec230338cbb5f",
    "title": "Episode 52 — Beyond the Blues with Dr Adam Ta",
    "guest": "Dr Adam Ta",
    "status": "published",
    "published_at": "2025-03-30T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 98 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-52-beyond-the-blues-with-dr-ad",
    "downloads": 0,
    "created_at": "2025-03-30T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05d88067e9e9914b98c05",
    "title": "Episode 51 — Male friendships today",
    "guest": "",
    "status": "published",
    "published_at": "2025-03-30T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 62 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-51-male-friendships-today-intro",
    "downloads": 0,
    "created_at": "2025-03-30T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05d2954d1f90c99103dd0",
    "title": "Episode 50 — New hosts for 2025",
    "guest": "",
    "status": "published",
    "published_at": "2025-03-29T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 73 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-50-we-are-back-with-new-hosts-f",
    "downloads": 0,
    "created_at": "2025-03-29T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05ccf639ec2394a408d19",
    "title": "Quick Update from the Everyman Pod",
    "guest": "",
    "status": "published",
    "published_at": "2025-03-28T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 10 min — Acast: https://shows.acast.com/the-everyman/episodes/quick-update-from-the-everyman-pod",
    "downloads": 0,
    "created_at": "2025-03-28T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05c7d54d1f90c99100f78",
    "title": "Episode 49 — Your physical best with Calum Denham",
    "guest": "Calum Denham",
    "status": "published",
    "published_at": "2025-03-28T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 103 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-49-your-physical-best-wit",
    "downloads": 0,
    "created_at": "2025-03-28T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05ba25f1e5f001699b9b4",
    "title": "Episode 48 — Manhood in the modern age with Dr R",
    "guest": "Dr R",
    "status": "published",
    "published_at": "2025-03-27T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 77 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-48-manhood-in-the-modern-",
    "downloads": 0,
    "created_at": "2025-03-27T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67e05b0754d1f90c990ff69a",
    "title": "Episode 47 — Money, Power & Spirituality with Na",
    "guest": "Na",
    "status": "published",
    "published_at": "2025-03-26T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 90 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-47-money-power-spiritualit",
    "downloads": 0,
    "created_at": "2025-03-26T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67dfd2e554d1f90c990f0bde",
    "title": "Episode 46 — Unlocking Resilience with Coach Dap",
    "guest": "Coach Dap",
    "status": "published",
    "published_at": "2025-03-24T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 89 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-46-unlocking-resilience-wit",
    "downloads": 0,
    "created_at": "2025-03-24T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67df8db567e9e9914b5a4db6",
    "title": "Episode 45 — The Power of Cold Therapy with Jamil",
    "guest": "Jamil",
    "status": "published",
    "published_at": "2025-03-22T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 109 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-45-the-power-of-cold-ther",
    "downloads": 0,
    "created_at": "2025-03-22T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67df2d3654d1f90c990d89c6",
    "title": "Episode 44 — Fatherhood in the Modern Age with Jon",
    "guest": "Jon",
    "status": "published",
    "published_at": "2025-03-21T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 97 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-44-fatherhood-in-the-mode",
    "downloads": 0,
    "created_at": "2025-03-21T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_67debf5567e9e9914b50ffd9",
    "title": "Episode 43 — Living Authentically with Justin Sch",
    "guest": "Justin Sch",
    "status": "published",
    "published_at": "2025-03-20T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 87 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-43-living-authentically-wi",
    "downloads": 0,
    "created_at": "2025-03-20T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d83f67fa3021bc85bd86ec",
    "title": "Episode 42 — Mental Wealth & Mindfulness",
    "guest": "",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 70 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-42-mental-wealth-mindfulness-wi",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d83ee29c7d98a7f874f0b5",
    "title": "Episode 41 — The Happiness Episode with Ang Todd",
    "guest": "Ang Todd",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 71 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-41-the-happiness-episode-with-a",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d83c1cfa3021bc85bc8cc4",
    "title": "Episode 40 — Addiction with Nathan Jones part 2",
    "guest": "Nathan Jones",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 102 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-40-addiction-with-nathan-jones-",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d829289159fe16c4c97325",
    "title": "Episode 39 — Lewis Vines overcoming addiction",
    "guest": "Lewis Vines",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 95 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-39-lewis-vines-overcoming-a",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d81f1fa0e22c00153c12cb",
    "title": "Episode 38 — Creating a healthy workplace",
    "guest": "",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 76 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-38-creating-a-healthy-work",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d81ce49159fe16c4c85a34",
    "title": "Episode 37 — How to be a better boyfriend with Dan",
    "guest": "Dan",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 89 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-37-how-to-be-a-better-boyfr",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d80f7e9159fe16c4c81f5f",
    "title": "Episode 36 — Sustainable Health and Fitness",
    "guest": "",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 81 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-36-sustainable-health-and-f",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d80a62fa3021bc85ba3f37",
    "title": "Episode 35 — Building Confidence with Chris Cava",
    "guest": "Chris Cava",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 103 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-35-building-confidence-with-",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d7fc02a0e22c00153b92d4",
    "title": "Episode 34 — Overcoming Perfectionism with Marta",
    "guest": "Marta",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 85 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-34-overcoming-perfectionism-",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_66d7f3d2fa3021bc85b965a5",
    "title": "Episode 33 — Embracing imperfection with Davey W",
    "guest": "Davey W",
    "status": "published",
    "published_at": "2024-09-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 81 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-33-embracing-imperfection-w",
    "downloads": 0,
    "created_at": "2024-09-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca7943f694020016bb9957",
    "title": "Episode 32 — Last one of 2023",
    "guest": "",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 71 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-32-last-one-of-2023",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca79104daaad0016aa5adc",
    "title": "Episode 31 — Everyman Catch Up",
    "guest": "",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 90 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-31-everyman-catch-up-how-to-be-fully-co",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca78c1f8a7f800163a014a",
    "title": "Episode 30 — Nick Hancock Elite runner & coach",
    "guest": "Nick Hancock",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 97 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-30-with-nick-hancock-elite-runn",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca788e8c4bd100153fd6fe",
    "title": "Episode 29 — Neil Clark — Elite sport & Mental Health",
    "guest": "Neil Clark",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 105 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-29-n",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca7848f694020016bb8b27",
    "title": "Episode 28 — Anxiety with Feranmi Okunloye & Dan",
    "guest": "Feranmi Okunloye",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 87 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-28-anxiety-with-feranmi-ok",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca77f4f8a7f800163988a6",
    "title": "Episode 27 — Fatherhood with Jamie Carragher",
    "guest": "Jamie Carragher",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 76 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-27-fatherhood-with-jamie-ca",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca775a4daaad0016aa3ef1",
    "title": "Episode 26 — The power of saying NO with Rosie",
    "guest": "Rosie",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 64 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-26-the-power-of-saying-no-w",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_65ca76c8f694020016bb863e",
    "title": "Episode 25 — Your questions answered",
    "guest": "",
    "status": "published",
    "published_at": "2024-02-12T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 68 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-podcast-episode-25-the-everyman-catch-up-yo",
    "downloads": 0,
    "created_at": "2024-02-12T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b5981ee0a1600011210386",
    "title": "Episode 21 — Performance & Nutrition with Rhyse",
    "guest": "Rhyse Gonsalves",
    "status": "published",
    "published_at": "2023-08-16T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 89 min — Acast: https://shows.acast.com/the-everyman/episodes/rhyse-gonsalves",
    "downloads": 0,
    "created_at": "2023-08-16T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b5a5df74bba700117aa0cf",
    "title": "Episode 20 — The 3 most inspirational Dads",
    "guest": "3 Dads Walking",
    "status": "published",
    "published_at": "2023-08-11T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 96 min — Acast: https://shows.acast.com/the-everyman/episodes/3-dads-walking",
    "downloads": 0,
    "created_at": "2023-08-11T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b599f0c81f3b0011ab3ae8",
    "title": "Episode 19 — Life & Career with Christian Thrane",
    "guest": "Christian Thrane",
    "status": "published",
    "published_at": "2023-08-07T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 49 min — Acast: https://shows.acast.com/the-everyman/episodes/christian-thrane",
    "downloads": 0,
    "created_at": "2023-08-07T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b59b9a71b62900110ebc32",
    "title": "Episode 18 — The Science of Mental Health — Ryan",
    "guest": "Ryan Parke",
    "status": "published",
    "published_at": "2023-08-04T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 87 min — Acast: https://shows.acast.com/the-everyman/episodes/ryan-parke",
    "downloads": 0,
    "created_at": "2023-08-04T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b598bd6d7ea83900e31df0",
    "title": "Episode 17 — Mindful Parenting with Cara Connelly",
    "guest": "Cara Connelly",
    "status": "published",
    "published_at": "2023-07-28T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 81 min — Acast: https://shows.acast.com/the-everyman/episodes/cara-connelly",
    "downloads": 0,
    "created_at": "2023-07-28T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b59735c5c9db0010e6f4a2",
    "title": "Episode 16 — Toxic Masculinity with Daniel Kaluuya",
    "guest": "Daniel Kaluuya",
    "status": "published",
    "published_at": "2023-07-21T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 85 min — Acast: https://shows.acast.com/the-everyman/episodes/daniel-kaluuya",
    "downloads": 0,
    "created_at": "2023-07-21T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b594df74bba700117873c8",
    "title": "Episode 15 — Self Care with Calum Best",
    "guest": "Calum Best",
    "status": "published",
    "published_at": "2023-07-14T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 76 min — Acast: https://shows.acast.com/the-everyman/episodes/calum-best",
    "downloads": 0,
    "created_at": "2023-07-14T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64b58d1dc5c9db0010e36bb3",
    "title": "Episode 14 — Body Image with Bradley Wright-Smith",
    "guest": "Bradley Wright-Smith",
    "status": "published",
    "published_at": "2023-07-07T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 103 min — Acast: https://shows.acast.com/the-everyman/episodes/bradley-wright-smith",
    "downloads": 0,
    "created_at": "2023-07-07T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_6469fe9e5f8b220011e63360",
    "title": "Episode 10 — Remote working with Sarah Townsend",
    "guest": "Sarah Townsend",
    "status": "published",
    "published_at": "2023-05-21T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 74 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-10-remote-working-with-sarah-townsend",
    "downloads": 0,
    "created_at": "2023-05-21T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64660f8a5f8b220011661cd4",
    "title": "Episode 9 — Sexual Consent with Emily Setty",
    "guest": "Emily Setty",
    "status": "published",
    "published_at": "2023-05-21T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 119 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-9-emily-setty",
    "downloads": 0,
    "created_at": "2023-05-21T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64350c55de066f0011073b93",
    "title": "Episode 8 — Addiction with Nathan Jones",
    "guest": "Nathan Jones",
    "status": "published",
    "published_at": "2023-04-11T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 118 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-8-addiction-with-nathan-jones",
    "downloads": 0,
    "created_at": "2023-04-11T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_64229601d0bdb90011283920",
    "title": "Episode 7 — The Grief Preacher",
    "guest": "",
    "status": "published",
    "published_at": "2023-03-28T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 96 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-7-the-grief-preacher",
    "downloads": 0,
    "created_at": "2023-03-28T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_641b3dcad0bdb90010e2a24c",
    "title": "Episode 6 — Entrepreneurship & Mental Health with Johnny",
    "guest": "Johnny",
    "status": "published",
    "published_at": "2023-03-14T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 103 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-6-entrepreneurship-mental-health-jon",
    "downloads": 0,
    "created_at": "2023-03-14T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_640f4ebdde066f00107b86ab",
    "title": "Episode 5 — Breaking Down Masculinity with David Kerrigan",
    "guest": "David Kerrigan",
    "status": "published",
    "published_at": "2023-02-28T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 90 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-5-breaking-down-masculinity-with-d",
    "downloads": 0,
    "created_at": "2023-02-28T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_63f6a2bcde066f00107622fa",
    "title": "Episode 4 — Dating & Self Esteem with Rebecca Ryan",
    "guest": "Rebecca Ryan",
    "status": "published",
    "published_at": "2023-02-14T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 81 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-4-dating-self-esteem-with-rebecca-r",
    "downloads": 0,
    "created_at": "2023-02-14T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_63eb5f47c2b8000010a99c0d",
    "title": "Episode 3 — Overcoming Anxiety with Mike Acker",
    "guest": "Mike Acker",
    "status": "published",
    "published_at": "2023-02-07T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 85 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-3-overcoming-anxiety-with-mike-acke",
    "downloads": 0,
    "created_at": "2023-02-07T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "ep_63d56432c2b8000010a3b9fa",
    "title": "Episode 2 — Overcoming Obstacles with Tunde",
    "guest": "Tunde",
    "status": "published",
    "published_at": "2023-01-24T00:00:00.000Z",
    "recording_date": "",
    "pillar": "mental",
    "notes": "Duration 105 min — Acast: https://shows.acast.com/the-everyman/episodes/the-everyman-episode-2-overcoming-obstacles-adversity-wit",
    "downloads": 0,
    "created_at": "2023-01-24T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z"
  }
];
  var contentItems = [
  {
    "_id": "content_LI-W16-MON",
    "title": "Week 16 — Linkedin post",
    "channel": "linkedin",
    "status": "published",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: LI-W16-MON — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "content_IG-W16-MON",
    "title": "Week 16 — Instagram post",
    "channel": "instagram",
    "status": "published",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: IG-W16-MON — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "content_FB-W16-MON",
    "title": "Week 16 — Facebook post",
    "channel": "facebook",
    "status": "published",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: FB-W16-MON — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "content_LI-W17-THU",
    "title": "Week 17 — Linkedin post",
    "channel": "linkedin",
    "status": "published",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: LI-W17-THU — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "content_FB-W17-THU",
    "title": "Week 17 — Facebook post",
    "channel": "facebook",
    "status": "published",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: FB-W17-THU — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": "2026-05-13T00:00:00.000Z"
  },
  {
    "_id": "content_IG-W17-THU",
    "title": "Week 17 — Instagram post",
    "channel": "instagram",
    "status": "ready",
    "owner": "",
    "pillar": "",
    "due": "",
    "notes": "Post ID: IG-W17-THU — auto-imported from Make Post Log",
    "hook": "",
    "created_at": "2026-05-13T00:00:00.000Z",
    "updated_at": "2026-05-13T00:00:00.000Z",
    "published_at": ""
  }
];

  function seedKey(key, value){
    try {
      var existing = localStorage.getItem(key);
      if (existing && existing !== '[]' && existing !== 'null') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e){ return false; }
  }

  var didSeed = false;
  if (seedKey('vyve_performance_log', performance)) didSeed = true;
  if (seedKey('vyve_podcast_eps', podcastEps)) didSeed = true;
  if (seedKey('vyve_content_items', contentItems)) didSeed = true;

  try { localStorage.setItem(SEED_FLAG, SEED_VERSION); } catch(e) {}

  if (didSeed && window.console) {
    console.log('[VYVE/seed] Loaded real data: ' + performance.length + ' analytics, ' + podcastEps.length + ' episodes, ' + contentItems.length + ' content items');
  }
})();
