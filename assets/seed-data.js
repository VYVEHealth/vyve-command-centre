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
  var SEED_VERSION = '2026-05-14.3';
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


  // ----------------------------------------------------------------
  // Phase 2 content seed — Strategy, Team, Knowledge, Tasks, Partners.
  // Added in v2026-05-14.1. Skip-if-existing applies per key, so anything
  // the user has already started editing is left untouched.
  // ----------------------------------------------------------------
  var strategyNorthstar = {
  "name": "Engaged Members",
  "value": "0",
  "target": "10,000 by Q4 2027"
};
  var strategyMV        = {
  "mission": "VYVE makes proactive workplace wellbeing simple, evidence-based, and accessible to every workforce — across Physical, Mental and Social health.",
  "vision": "A UK where every working adult has practical, daily support to live a healthier and more connected life — and where the workplace is the most powerful place to deliver it."
};
  var strategyOKRs      = [
  {
    "_id": "okr_q2_growth",
    "objective": "Reach MVP launch readiness and close first paying customers",
    "owner": "Lewis",
    "quarter": "Q2 2026",
    "krs": [
      {
        "_id": "kr_q2_1",
        "text": "MVP feature scope locked and signed off by Lewis + Alan + Dean",
        "target": "Sign-off",
        "current": "",
        "status": "in-progress"
      },
      {
        "_id": "kr_q2_2",
        "text": "3 employer pilots committed (signed LOI)",
        "target": "3",
        "current": "0",
        "status": "not-started"
      },
      {
        "_id": "kr_q2_3",
        "text": "Series A-ready pitch deck v1 drafted",
        "target": "v1",
        "current": "",
        "status": "in-progress"
      },
      {
        "_id": "kr_q2_4",
        "text": "2 grant applications submitted (Innovate UK / Nesta / Sport England)",
        "target": "2",
        "current": "0",
        "status": "in-progress"
      }
    ],
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "okr_q3_launch",
    "objective": "Public MVP launch + first 3 paying employer pilots live",
    "owner": "Lewis",
    "quarter": "Q3 2026",
    "krs": [
      {
        "_id": "kr_q3_1",
        "text": "Public MVP go-live by September 2026",
        "target": "Go-live",
        "current": "",
        "status": "not-started"
      },
      {
        "_id": "kr_q3_2",
        "text": "3 employer pilots live with active users",
        "target": "3",
        "current": "0",
        "status": "not-started"
      },
      {
        "_id": "kr_q3_3",
        "text": "Connect Challenge community event run (1st June)",
        "target": "Run",
        "current": "",
        "status": "in-progress"
      },
      {
        "_id": "kr_q3_4",
        "text": "10 founding ambassadors onboarded",
        "target": "10",
        "current": "0",
        "status": "not-started"
      }
    ],
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "okr_q4_traction",
    "objective": "Prove repeatable commercial model + secure seed funding",
    "owner": "Lewis",
    "quarter": "Q4 2026",
    "krs": [
      {
        "_id": "kr_q4_1",
        "text": "10 paying employer clients live",
        "target": "10",
        "current": "0",
        "status": "not-started"
      },
      {
        "_id": "kr_q4_2",
        "text": "Win rate on qualified opportunities >= 25%",
        "target": "25%",
        "current": "",
        "status": "not-started"
      },
      {
        "_id": "kr_q4_3",
        "text": "Seed round closed or angel funding secured",
        "target": "Close",
        "current": "",
        "status": "not-started"
      },
      {
        "_id": "kr_q4_4",
        "text": "Monthly retention >= 60%",
        "target": "60%",
        "current": "",
        "status": "not-started"
      }
    ],
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];
  var strategyDecisions = [
  {
    "_id": "dec_001",
    "title": "Set up as a Community Interest Company (CIC)",
    "context": "Mission-driven structure aligned with social purpose; supports 1-in-5 pledge model and unlocks grant pathways.",
    "decision": "Incorporate as a CIC. Everyman Charity registered separately as the charitable vehicle.",
    "owner": "Lewis",
    "date": "2025-09-01",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "dec_002",
    "title": "Three-pillar architecture: Physical, Mental, Social",
    "context": "Most wellbeing platforms focus on one or two pillars. Workplace ROI evidence is strongest when all three are addressed together.",
    "decision": "Adopt Physical + Mental + Social as the canonical pillars. Reflected in app, brand, and sales proposition.",
    "owner": "Lewis",
    "date": "2025-10-15",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "dec_003",
    "title": "Build B2B2C, not pure B2C",
    "context": "B2C unit economics are punishing for new wellbeing apps. Employer-funded model unlocks free access for employees and creates a durable revenue model.",
    "decision": "Lead with B2B (employer pays). B2C available but not the primary GTM.",
    "owner": "Lewis + Alan",
    "date": "2025-11-20",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "dec_004",
    "title": "1-in-5 pledge mechanic",
    "context": "Differentiator vs other employer wellbeing platforms; supports CIC mission; gives clients a CSR story.",
    "decision": "Every 5 corporate seats funds 1 community seat for someone who couldn't otherwise access wellbeing support, via Everyman Charity.",
    "owner": "Lewis + Cole",
    "date": "2026-01-10",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];
  var strategySWOT      = {
  "s": "Three-pillar proactive approach (Physical, Mental, Social) — broader than competitors. CIC mission with 1-in-5 pledge creates clear differentiation. Founder credibility from health/wellbeing sector. Real-life community programme (Everyman Charity).",
  "w": "Pre-revenue with no signed customers yet. Small team; key dependencies on contractor model. MVP not yet launched. No SSO yet — blocker for larger enterprise deals.",
  "o": "UK workplace wellbeing market growing ~10% YoY. HR mental-health legislation tightening — duty of care driving demand. Grants available (Innovate UK, Nesta, Sport England). Partnership channel largely untapped (insurance, occ health, EAPs).",
  "t": "Funded competitors with sales firepower (Headspace, Calm Health, Unmind). Larger players moving downmarket. Economic pressure on HR budgets in 2026. AI commoditising parts of mental wellbeing content."
};
  var teamMembers       = [
  {
    "_id": "tm_lewis",
    "name": "Lewis Vines",
    "role": "CEO & Founder",
    "dept": "Leadership",
    "email": "lewis@vyvehealth.co.uk",
    "start": "2025-09-01",
    "resp": "Overall strategy, performance, fundraising, partnerships, culture",
    "okrs": "Q2 2026: lock MVP scope; 3 pilots committed; pitch deck v1; 2 grants submitted",
    "reports": "Whole team",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_dean",
    "name": "Dean Brown",
    "role": "Chief Technical Officer",
    "dept": "Technology",
    "email": "dean@vyvehealth.co.uk",
    "start": "2025-09-15",
    "resp": "VYVE Technology — apps, platform, data architecture, security",
    "okrs": "Apple/Android parity resolved; staging environment live; SSO implemented",
    "reports": "Tech contractors",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_alan",
    "name": "Alan",
    "role": "Chief Product & Commercial Officer",
    "dept": "Product / Commercial",
    "email": "alan@vyvehealth.co.uk",
    "start": "2025-10-01",
    "resp": "Product strategy + commercial model, GTM playbook, pricing, ICP",
    "okrs": "Pricing tiers locked; PRD for MVP; commercial model with CAC/LTV",
    "reports": "Vicki",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_calum",
    "name": "Calum",
    "role": "Physical Health Lead",
    "dept": "Service Delivery",
    "email": "calum@vyvehealth.co.uk",
    "start": "2025-11-01",
    "resp": "Physical health service strategy, content library, partner coaches",
    "okrs": "Workout library recorded; partner content pipeline live; metrics defined",
    "reports": "Physical partners",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_phil",
    "name": "Phil",
    "role": "Mental Health Lead",
    "dept": "Service Delivery",
    "email": "phil@vyvehealth.co.uk",
    "start": "2025-11-01",
    "resp": "Mental health service strategy, clinical governance, crisis pathway",
    "okrs": "CBT programme structure; clinical governance framework; crisis pathway published",
    "reports": "Clinical collaborators",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_vicki",
    "name": "Vicki",
    "role": "Client & Relationship Director",
    "dept": "Sales",
    "email": "vicki@vyvehealth.co.uk",
    "start": "2025-12-01",
    "resp": "Sales plan, outbound, HubSpot pipeline, account management",
    "okrs": "Sales plan + 50-name target list; 10 discovery calls; HubSpot pipeline configured",
    "reports": "Sales partners",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_cole",
    "name": "Cole",
    "role": "Community & Partnership Manager",
    "dept": "Community",
    "email": "cole@vyvehealth.co.uk",
    "start": "2026-01-15",
    "resp": "Community strategy, Connect events, ambassador programme, 1-in-5 pledge",
    "okrs": "Connect Challenge 1st June; Everyman CIC registered; 10 ambassadors",
    "reports": "Ambassadors",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_azuza",
    "name": "Azuza",
    "role": "Social Media Marketing & Content Manager",
    "dept": "Marketing",
    "email": "azuza@vyvehealth.co.uk",
    "start": "2026-02-01",
    "resp": "Brand, social, content, influencer programme, press, email marketing",
    "okrs": "Brand guidelines published; IG+LinkedIn live with 3-mo calendar; press release distributed",
    "reports": "Content contractors",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_ryan",
    "name": "Ryan Hewitt",
    "role": "Finance Director",
    "dept": "Finance",
    "email": "ryan@vyvehealth.co.uk",
    "start": "2026-02-15",
    "resp": "Financial governance, cash flow, cap table, CIC compliance, grants",
    "okrs": "12-month cash flow live; FY budget; investor pitch financial model; 2 grants submitted",
    "reports": "Bookkeeper",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_hr",
    "name": "Non-Exec HR Director",
    "role": "Non-Executive HR Director & CEO Advisor",
    "dept": "Advisory",
    "email": "",
    "start": "2026-03-01",
    "resp": "Internal governance, contracts, employee handbook, board readiness, monthly CEO advisory",
    "okrs": "Employee handbook produced; performance review framework; equity scheme advice",
    "reports": "Lewis",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tm_team_advisor",
    "name": "Advisor seat (open)",
    "role": "Advisor — commercial or clinical",
    "dept": "Advisory",
    "email": "",
    "start": "",
    "resp": "To be identified by Non-Exec HR Director — strengthen the VYVE board with commercial or clinical expertise",
    "okrs": "Identify and onboard one advisor by Q3 2026",
    "reports": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];
  var knowledgeEntries  = [
  {
    "_id": "kb_morning_brief",
    "title": "Morning Brief",
    "type": "Playbook",
    "summary": "How Lewis (and any team member) should use the Command Centre's Morning Brief to plan the day.",
    "body": "1. Open the Morning Brief first thing.\n2. Read the 4 KPIs — flag anything that has moved the wrong way overnight.\n3. Read Today's Priorities and Action Plans cards — these are non-negotiables for the day.\n4. Sessions today/tomorrow — confirm prep for each.\n5. Compliance — if any item is overdue or in red, escalate.\n6. Fresh intel — anything actionable goes to Vicki or Alan.\n7. Recent activity — quick scan to know what's moving across the company.\n8. Decide the day's top 3 — write them down before any meetings.",
    "owner": "Lewis",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_brain_sync",
    "title": "Brain Sync — keeping the operating brain current",
    "type": "SOP",
    "summary": "How and when to update the LewisBrain repo + Command Centre with new strategic context, decisions, and learnings.",
    "body": "Weekly cadence:\n- Friday afternoon: Lewis logs the week's key decisions in Strategy → Decisions Log.\n- Friday afternoon: any new playbook content goes into Knowledge Base.\n- Monthly: brain/master.md template revisited; placeholders updated with current state.\n\nWhen something changes:\n- New role / new hire → update Team page.\n- New investor or partner conversation → log it in CRM (Investor) / Partners.\n- New strategic decision → Strategy → Decisions Log (this is the audit trail).\n- New OKR or KR shift → Strategy → OKRs.",
    "owner": "Lewis",
    "link": "https://github.com/VYVEHealth/LewisBrain",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_agent_sync",
    "title": "Agent Sync — managing the AI agents and skills",
    "type": "SOP",
    "summary": "How Lewis manages the VYVE-named skills (vyve-product-tracker, vyve-sales-intelligence, etc) so they stay accurate and useful.",
    "body": "Quarterly:\n- Audit each VYVE-* skill in Claude — does it still reflect the current org and strategy?\n- Retire skills that no longer fit (move to /archive).\n- Add new skills for new functions (e.g. when a service goes live, build a service-monitor skill).\n\nOn major changes:\n- Pricing change → update vyve-sales-intelligence + vyve-investor-growth-tracker.\n- New pillar / new feature → update vyve-product-feature-scout + vyve-content-engine.\n- New compliance change → update vyve-regulatory-compliance-watch.",
    "owner": "Lewis",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_content_creation",
    "title": "Content Creation — Lewis voice & 3-pillar architecture",
    "type": "Playbook",
    "summary": "How VYVE creates content that ladders up to the Physical, Mental, Social pillars in Lewis's voice.",
    "body": "Voice: warm, direct, practical, evidence-informed. No corporate jargon. Always ground in a real human experience.\n\nPillar tagging: every piece of content tags Physical, Mental or Social — never untagged.\n\nDistribution rhythm:\n- LinkedIn: 3-4x per week (Lewis + company page).\n- Instagram: 4-5x per week (carousel + reel mix).\n- Podcast: 1 episode per week (Everyman).\n- Newsletter: monthly.\n\nFor playbook detail see Social Blueprint page.",
    "owner": "Azuza",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_grant_application",
    "title": "Grant Application — process and active grants",
    "type": "Playbook",
    "summary": "How VYVE approaches grant funding — sources, process, and the 2 active applications for 2026.",
    "body": "Target funders:\n- Innovate UK (workplace health innovation)\n- Nesta (digital wellbeing)\n- Sport England (Movement for Change)\n- NHS Health Tech Programme\n\nProcess:\n1. Ryan identifies the call and assesses fit (eligibility, deadline, ask size).\n2. Lewis approves go/no-go within 7 days.\n3. Ryan owns submission; Alan supports commercial model; Vicki supports impact case; Lewis writes vision narrative.\n4. Always submit at least 3 days before deadline.\n\n2026 active applications:\n- Innovate UK — Workplace Mental Health Innovation Fund — Q2 submission.\n- Nesta — Connected Communities — Q3 submission.",
    "owner": "Ryan",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_investor_comms",
    "title": "Investor Comms — keeping investors and angels engaged",
    "type": "Playbook",
    "summary": "How VYVE communicates with prospective investors and angels — cadence, format, and what we share.",
    "body": "Monthly investor update format:\n1. Headline number (revenue, pipeline, users) — one line.\n2. Wins of the month — 3 bullet points.\n3. Challenges and asks — 2-3 bullets, including what we need help with.\n4. Numbers — MRR, cash, runway, key product metric.\n5. What's coming next month.\n\nCadence:\n- Active deal: weekly catch-up if requested, otherwise bi-weekly until close.\n- Warm relationship: monthly update.\n- Cold relationship: quarterly update.\n\nAlways from Lewis. Always sent on the 1st of the month. Read receipts not required — focus on quality not anxiety.",
    "owner": "Lewis",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_partnerships",
    "title": "Partnerships — types, qualification and process",
    "type": "Playbook",
    "summary": "How VYVE evaluates and progresses strategic partners across Corporate, Channel, Delivery, Research, Tech, Social Impact and Media categories.",
    "body": "Partner types VYVE pursues:\n- Corporate: HR consultancies, occupational health providers, EAPs, insurance brokers — distribution channel.\n- Channel: Benefit platforms, broker networks — embedded distribution.\n- Delivery: Coaches, therapists, fitness partners — content + service supply.\n- Research: Universities, clinical bodies — credibility + outcomes evidence.\n- Tech: Integration partners (wearables, HRIS, comms tools).\n- Social impact: Mental health charities, Parkrun, sports bodies — community alignment.\n- Media: Wellbeing media, HR press — visibility.\n\nQualification: mutual value (we offer X, they offer Y), strategic fit, no IP/commercial conflict, time-to-value < 6 months.",
    "owner": "Lewis + Cole + Vicki",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "kb_sales_pipeline",
    "title": "Sales Pipeline — HubSpot stages and qualification",
    "type": "Playbook",
    "summary": "How Vicki manages the HubSpot pipeline — stages, qualification criteria and pipeline review cadence.",
    "body": "Pipeline stages:\n1. Lead — inbound or sourced; not yet contacted.\n2. Contacted — first outreach sent.\n3. Discovery — discovery call scheduled or completed.\n4. Demo — demo scheduled or completed.\n5. Proposal — proposal sent, awaiting response.\n6. Negotiation — terms being agreed.\n7. Closed-won / Closed-lost.\n\nReview cadence:\n- Weekly pipeline review with Lewis on Monday (15 min).\n- Every active deal has: logged next action, expected close date, deal probability.\n- Win/loss log: every closed deal gets a 3-bullet post-mortem.\n\nMonthly revenue targets agreed with Alan; pipeline report against targets every week.",
    "owner": "Vicki",
    "link": "",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];
  var tasksEntries      = [
  {
    "_id": "tk_mvp_scope_lock",
    "title": "Lock MVP feature scope in writing",
    "owner": "Dean",
    "due": "2026-05-23",
    "status": "doing",
    "priority": "high",
    "notes": "Sign-off required from Lewis + Alan + Dean before Phase 2 starts. Tracked in Action Plans (Dean #2, Alan #2).",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_apple_android_parity",
    "title": "Resolve Apple vs Android performance parity issues",
    "owner": "Dean",
    "due": "2026-05-22",
    "status": "doing",
    "priority": "high",
    "notes": "Identified in 08/05/26 workshop. Target: resolution within 2 weeks of identification.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_pricing_tiers_lock",
    "title": "Define and lock VYVE pricing tiers — entry / core / enterprise",
    "owner": "Alan",
    "due": "2026-05-30",
    "status": "doing",
    "priority": "high",
    "notes": "Locked document with feature gates and annual contract terms. Co-sign with Ryan for financial floor.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_target_account_list",
    "title": "Build 50-name priority target account list",
    "owner": "Vicki",
    "due": "2026-05-28",
    "status": "doing",
    "priority": "high",
    "notes": "Segmented by size, sector, wellbeing signals. Owned by Vicki; review with Alan + Lewis.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_pitch_deck_v1",
    "title": "Build VYVE investor pitch deck — Series A standard v1",
    "owner": "Lewis",
    "due": "2026-06-10",
    "status": "todo",
    "priority": "high",
    "notes": "Problem, market size, solution, traction, team, financial ask. Ryan supports unit economics; Alan supports commercial.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_grant_innovate_uk",
    "title": "Submit Innovate UK Workplace Mental Health grant application",
    "owner": "Ryan",
    "due": "2026-05-30",
    "status": "doing",
    "priority": "high",
    "notes": "Lewis writes vision narrative; Alan commercial; Vicki impact case. Submit at least 3 days before deadline.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_sso_implementation",
    "title": "Implement SSO via SAML or OAuth",
    "owner": "Dean",
    "due": "2026-06-30",
    "status": "todo",
    "priority": "high",
    "notes": "Hard blocker for enterprise deals >100 seats.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_employer_dashboard",
    "title": "Build employer dashboard MVP — active users / engagement trend / pillar breakdown",
    "owner": "Dean",
    "due": "2026-07-15",
    "status": "todo",
    "priority": "high",
    "notes": "Live before first enterprise deal — without this we can't deliver value to HR.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_connect_launch_jun",
    "title": "Launch Connect Challenge community event — 1st June 2026",
    "owner": "Cole",
    "due": "2026-06-01",
    "status": "doing",
    "priority": "high",
    "notes": "Date, format, promotion plan and participation target locked. Azuza owns social amplification.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_brand_guidelines",
    "title": "Publish VYVE brand guidelines document",
    "owner": "Azuza",
    "due": "2026-05-30",
    "status": "doing",
    "priority": "medium",
    "notes": "Tone, visual identity, messaging hierarchy, do/do-not examples.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_pr_release_cic",
    "title": "Distribute first VYVE press release — CIC launch + 1-in-5 pledge + founder story",
    "owner": "Azuza",
    "due": "2026-06-15",
    "status": "todo",
    "priority": "medium",
    "notes": "Tier-1 HR/business media: People Management, HR Magazine, one national outlet.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_everyman_cic_reg",
    "title": "Complete Everyman Charity CIC registration",
    "owner": "Cole",
    "due": "2026-06-30",
    "status": "doing",
    "priority": "high",
    "notes": "Charitable objects, founding trustees appointed. Lewis supports.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_cash_flow_forecast",
    "title": "Build 12-month rolling cash flow forecast",
    "owner": "Ryan",
    "due": "2026-05-25",
    "status": "doing",
    "priority": "high",
    "notes": "Primary financial decision-making tool. Updated monthly. Shared with Lewis.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_clinical_gov",
    "title": "Build clinical governance framework — mental health content",
    "owner": "Phil",
    "due": "2026-06-15",
    "status": "todo",
    "priority": "high",
    "notes": "Review process, approvals, update cadence. Required before any mental health content goes live.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "tk_crisis_pathway",
    "title": "Write and publish crisis pathway — what happens if a user signals distress",
    "owner": "Phil",
    "due": "2026-06-30",
    "status": "todo",
    "priority": "high",
    "notes": "Escalation steps, signposting, safeguarding protocol. Hard requirement before mental health pillar launches.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];
  var partnersEntries   = [
  {
    "_id": "ptn_parkrun",
    "name": "Parkrun UK",
    "type": "social-impact",
    "status": "exploration",
    "vt": "Brings VYVE community access to a national grassroots network and credible movement partner.",
    "vv": "Wellbeing programming and CIC alignment for parkrun's community work; potential 1-in-5 pledge tie-in.",
    "lc": "",
    "notes": "Strategic alignment with movement-as-medicine. Cole leading initial conversations.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_myfitnesspal",
    "name": "MyFitnessPal",
    "type": "tech",
    "status": "exploration",
    "vt": "Integration of nutrition/activity data into VYVE; access to a wellbeing platform user base.",
    "vv": "Distribution to engaged tracker users; co-marketing.",
    "lc": "",
    "notes": "Assess integration fit, content collab opportunity, commercial terms. Cole leading.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_innovate_uk",
    "name": "Innovate UK",
    "type": "research",
    "status": "active",
    "vt": "VYVE delivers credible workplace wellbeing innovation aligned with their priority areas.",
    "vv": "Non-dilutive funding + endorsement.",
    "lc": "",
    "notes": "Active grant application Q2 2026 — Workplace Mental Health Innovation Fund.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_nesta",
    "name": "Nesta",
    "type": "research",
    "status": "exploration",
    "vt": "Innovation case study in their Connected Communities and digital wellbeing portfolios.",
    "vv": "Non-dilutive funding + research credibility.",
    "lc": "",
    "notes": "Target Q3 2026 submission.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_sport_eng",
    "name": "Sport England",
    "type": "social-impact",
    "status": "exploration",
    "vt": "Workplace channel to deliver Movement-for-Change agenda.",
    "vv": "Non-dilutive funding; co-branded community programmes.",
    "lc": "",
    "notes": "Sport England funding rounds tracked by Ryan.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_apple_health",
    "name": "Apple Health",
    "type": "tech",
    "status": "exploration",
    "vt": "Showcase use case for Apple Health in workplace wellbeing.",
    "vv": "Deep wearable integration — Calum's physical pillar differentiator.",
    "lc": "",
    "notes": "Tracked in Dean #11 — wearable integration build.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_google_fit",
    "name": "Google Fit",
    "type": "tech",
    "status": "exploration",
    "vt": "Android parity for wellbeing data.",
    "vv": "Android user base served alongside Apple.",
    "lc": "",
    "notes": "Tracked in Dean #11.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  },
  {
    "_id": "ptn_employer_pilot1",
    "name": "Employer pilot — TBC",
    "type": "corporate",
    "status": "exploration",
    "vt": "Wellbeing programme that ties physical, mental and social pillars together with measurable employer outcomes.",
    "vv": "First paying customer; reference case study.",
    "lc": "",
    "notes": "Target Q3 2026 go-live. Owned by Vicki + Lewis. 3 pilots needed by September.",
    "created_at": "2026-05-14T04:24:36.425859Z",
    "updated_at": "2026-05-14T04:24:36.425859Z"
  }
];


  function seedKeyAny(key, value){
    try {
      if (localStorage.getItem(key) !== null) return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e){ return false; }
  }


  // ----------------------------------------------------------------
  // Phase 3 content seed — Compliance, Sessions, Deals, Clients, Investors.
  // Added in v2026-05-14.2. Skip-if-existing applies per key.
  // ----------------------------------------------------------------
  var complianceEntries = [
  {
    "_id": "cmp_cic34",
    "title": "CIC34 Community Interest Report — annual filing",
    "area": "CIC governance",
    "owner": "Ryan",
    "due": "2026-09-11",
    "status": "open",
    "desc": "Annual community-interest report filed alongside accounts at Companies House. Demonstrates VYVE's social purpose and how surpluses are applied.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_companies_house",
    "title": "Companies House annual accounts filing",
    "area": "CIC governance",
    "owner": "Ryan",
    "due": "2026-11-10",
    "status": "open",
    "desc": "Annual accounts filing — first set due 21 months after incorporation. Ryan to manage with bookkeeper.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_gdpr_dpa",
    "title": "Data Protection policy + privacy notice",
    "area": "GDPR",
    "owner": "Dean",
    "due": "2026-06-28",
    "status": "open",
    "desc": "Public privacy notice on marketing site + member portal. Internal data protection policy covering data flows, retention, DSAR process.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_gdpr_dpia",
    "title": "DPIA for proactive wellbeing data processing",
    "area": "GDPR",
    "owner": "Dean",
    "due": "2026-07-13",
    "status": "open",
    "desc": "Data Protection Impact Assessment — high-priority because health data is processed. Confirm lawful basis, minimisation, retention, employer access boundaries.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_gdpr_ropa",
    "title": "Record of Processing Activities (ROPA)",
    "area": "GDPR",
    "owner": "Dean",
    "due": "2026-07-28",
    "status": "open",
    "desc": "Article 30 ROPA documenting every data flow, purpose, lawful basis and retention. Required if controller of personal data.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_gdpr_dpo",
    "title": "Assess DPO requirement and appoint if needed",
    "area": "GDPR",
    "owner": "HR Director (Non-Exec)",
    "due": "2026-07-03",
    "status": "open",
    "desc": "Non-Exec HR Director to advise on DPA obligations. Special-category health data + monitoring likely triggers DPO requirement.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_clinical_gov",
    "title": "Clinical governance framework — mental health pillar",
    "area": "Clinical safety",
    "owner": "Phil",
    "due": "2026-06-13",
    "status": "open",
    "desc": "Required before any mental health content goes live. Review process, approvals, update cadence, clinical reviewer sign-off.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_crisis_pathway",
    "title": "Crisis pathway — distress signals & escalation",
    "area": "Clinical safety",
    "owner": "Phil",
    "due": "2026-06-28",
    "status": "open",
    "desc": "Hard requirement before mental health pillar launches. Escalation steps, signposting, safeguarding protocol.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_safeguarding",
    "title": "Safeguarding policy — adults at risk",
    "area": "Clinical safety",
    "owner": "Phil",
    "due": "2026-07-13",
    "status": "open",
    "desc": "Adult safeguarding policy aligned with Care Act. Covers identification, reporting, supporting users at risk.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_pen_test",
    "title": "Penetration test by certified third party",
    "area": "Security",
    "owner": "Dean",
    "due": "2026-08-12",
    "status": "open",
    "desc": "Minimum annually, ideally twice/year from launch. Required for enterprise sales.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_iso27001",
    "title": "ISO 27001 readiness assessment",
    "area": "Security",
    "owner": "Dean",
    "due": "2026-11-10",
    "status": "open",
    "desc": "Pre-certification readiness review. Larger enterprise buyers will ask. Move to full certification once revenue justifies.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_cyber_essentials",
    "title": "Cyber Essentials certification",
    "area": "Security",
    "owner": "Dean",
    "due": "2026-07-13",
    "status": "open",
    "desc": "UK gov-backed entry-level cyber security certification. Quick win that signals security maturity to corporate buyers.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_terms_of_service",
    "title": "Terms of Service + acceptable use policy",
    "area": "Legal",
    "owner": "Lewis",
    "due": "2026-06-23",
    "status": "open",
    "desc": "User-facing terms covering scope of wellbeing support (not medical advice), permitted uses, account, liability limits.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_employer_dpa",
    "title": "Standard employer Data Processing Agreement",
    "area": "Legal",
    "owner": "Lewis",
    "due": "2026-06-28",
    "status": "open",
    "desc": "DPA template VYVE provides to every employer client. Covers processor obligations, sub-processors, international transfers, audit rights.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_emp_handbook",
    "title": "Employee handbook + contractor agreements review",
    "area": "Employment",
    "owner": "HR Director (Non-Exec)",
    "due": "2026-07-13",
    "status": "open",
    "desc": "Lightweight employee handbook covering conduct, holidays, expenses, disciplinary process, remote working. Review existing contractor agreements for IP, confidentiality, termination clauses.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "cmp_hse_riskassess",
    "title": "Mental health risk assessment template (HSE compliance)",
    "area": "HSE / Workplace",
    "owner": "Phil",
    "due": "2026-07-28",
    "status": "open",
    "desc": "HSE guidance increasingly requires employers to assess psychosocial work risks. VYVE provides the template employers use — both compliance support and a sales hook.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  }
];
  var sessionsEntries   = [
  {
    "_id": "sess_connect_kickoff",
    "title": "Connect Challenge kickoff event",
    "date": "2026-05-29T18:00:00Z",
    "client": "VYVE community",
    "format": "in-person",
    "pillar": "social",
    "facilitator": "Cole",
    "attendees": "Founding ambassadors + early community",
    "notes": "1st June launch of Connect Challenge. Owned by Cole, Azuza supports social amplification.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_pilot_intro_1",
    "title": "Pilot intro — employer pilot #1",
    "date": "2026-05-21T14:00:00Z",
    "client": "Pilot client #1",
    "format": "online",
    "pillar": "physical",
    "facilitator": "Vicki + Lewis",
    "attendees": "Pilot HR + leadership",
    "notes": "First 30 minutes of the 1-hour pilot intro — Vicki opens, Lewis vision + roadmap, Q&A.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_team_offsite",
    "title": "VYVE team Q3 planning offsite",
    "date": "2026-06-18T09:00:00Z",
    "client": "VYVE internal",
    "format": "in-person",
    "pillar": "social",
    "facilitator": "Lewis",
    "attendees": "Full team (11)",
    "notes": "Q3 OKR planning + culture session. HR Director (Non-Exec) facilitates values + culture block.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_clinical_review_1",
    "title": "Mental health content clinical review",
    "date": "2026-05-18T10:00:00Z",
    "client": "VYVE internal",
    "format": "online",
    "pillar": "mental",
    "facilitator": "Phil",
    "attendees": "External clinical reviewers",
    "notes": "First peer-review session for mental health content before launch.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_physical_pilot",
    "title": "Physical pillar pilot — 10-person group",
    "date": "2026-05-24T19:00:00Z",
    "client": "VYVE community",
    "format": "hybrid",
    "pillar": "physical",
    "facilitator": "Calum",
    "attendees": "10 pilot participants",
    "notes": "First structured pilot of physical programme. Calum measures engagement + feedback.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_investor_panel",
    "title": "Investor coffee — angel #1",
    "date": "2026-05-19T11:00:00Z",
    "client": "Angel investor",
    "format": "in-person",
    "pillar": "",
    "facilitator": "Lewis",
    "attendees": "Angel + Lewis",
    "notes": "Initial conversation following pitch deck v1 send.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "sess_partner_parkrun",
    "title": "Parkrun partnership exploration call",
    "date": "2026-05-26T13:00:00Z",
    "client": "Parkrun UK",
    "format": "online",
    "pillar": "social",
    "facilitator": "Cole + Lewis",
    "attendees": "Cole + Lewis + Parkrun contact",
    "notes": "First exploration of strategic alignment with Parkrun community.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  }
];
  var dealsEntries      = [
  {
    "_id": "deal_pilot1",
    "company": "Pilot prospect #1 (placeholder)",
    "title": "Q3 pilot — 50 seats",
    "stage": "discovery",
    "value": 4500,
    "expected_close": "2026-07-13",
    "owner": "Vicki",
    "contact": "TBC",
    "source": "Outbound",
    "notes": "Discovery call scheduled. Tracking on Vicki's target account list.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "deal_pilot2",
    "company": "Pilot prospect #2 (placeholder)",
    "title": "Q3 pilot — 80 seats",
    "stage": "contacted",
    "value": 7200,
    "expected_close": "2026-07-28",
    "owner": "Vicki",
    "contact": "TBC",
    "source": "Inbound (LinkedIn)",
    "notes": "First contact sent; awaiting response.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "deal_pilot3",
    "company": "Pilot prospect #3 (placeholder)",
    "title": "Q4 pilot — 30 seats",
    "stage": "lead",
    "value": 2700,
    "expected_close": "2026-09-11",
    "owner": "Vicki",
    "contact": "TBC",
    "source": "Referral",
    "notes": "Warm intro via HR consultancy partner. Pending outreach.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "deal_pilot4",
    "company": "Pilot prospect #4 (placeholder)",
    "title": "Q3 pilot — 150 seats",
    "stage": "demo",
    "value": 13500,
    "expected_close": "2026-06-28",
    "owner": "Vicki",
    "contact": "TBC",
    "source": "Outbound",
    "notes": "Demo completed. Considering proposal — pricing sensitivity check needed.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "deal_pilot5",
    "company": "Pilot prospect #5 (placeholder)",
    "title": "Q2 pilot — 25 seats",
    "stage": "proposal",
    "value": 2250,
    "expected_close": "2026-06-03",
    "owner": "Vicki",
    "contact": "TBC",
    "source": "Network",
    "notes": "Proposal sent — awaiting feedback. Closing-this-month candidate.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "deal_pilot6",
    "company": "Pilot prospect #6 (placeholder)",
    "title": "Enterprise — 500 seats",
    "stage": "discovery",
    "value": 45000,
    "expected_close": "2026-08-17",
    "owner": "Vicki + Lewis",
    "contact": "TBC",
    "source": "Outbound",
    "notes": "Larger enterprise. Will need SSO complete before progressing.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  }
];
  var clientsEntries    = [
  {
    "_id": "client_demo_1",
    "name": "Demo client (template)",
    "stage": "lead",
    "members": 0,
    "value": 0,
    "contact": "",
    "email": "",
    "start": "",
    "renewal": "",
    "notes": "Template placeholder — replace with first signed client. Sample shape: lead → signed → onboarding → live → renewing.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  }
];
  var investorsEntries  = [
  {
    "_id": "inv_angel_1",
    "name": "Angel investor #1 (placeholder)",
    "stage": "approach",
    "type": "Angel",
    "round": "Pre-seed",
    "amount": 25000,
    "contact": "TBC",
    "notes": "Target angel from health/wellbeing sector. Pitch deck send planned post-v1.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "inv_angel_2",
    "name": "Angel investor #2 (placeholder)",
    "stage": "meeting",
    "type": "Angel",
    "round": "Pre-seed",
    "amount": 50000,
    "contact": "TBC",
    "notes": "Warm intro from network. First meeting booked.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "inv_innovate_uk",
    "name": "Innovate UK (grant)",
    "stage": "dd",
    "type": "Grant",
    "round": "Workplace Mental Health Innovation Fund",
    "amount": 100000,
    "contact": "Grant programme",
    "notes": "Active grant application Q2 2026. Lewis writes vision narrative; Alan commercial; Vicki impact case.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "inv_nesta",
    "name": "Nesta — Connected Communities",
    "stage": "approach",
    "type": "Grant",
    "round": "Connected Communities",
    "amount": 75000,
    "contact": "Programme team",
    "notes": "Q3 2026 submission target.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "inv_sportengland",
    "name": "Sport England",
    "stage": "approach",
    "type": "Grant",
    "round": "Movement for Change",
    "amount": 50000,
    "contact": "TBC",
    "notes": "Ryan tracking grant rounds.",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  },
  {
    "_id": "inv_seed_lead",
    "name": "Seed round lead (placeholder)",
    "stage": "approach",
    "type": "VC",
    "round": "Seed",
    "amount": 500000,
    "contact": "TBC",
    "notes": "Target Q4 2026 close. Pitch deck v1 in progress (Lewis owned, Ryan supports unit economics).",
    "created_at": "2026-05-14T17:25:03.893217Z",
    "updated_at": "2026-05-14T17:25:03.893217Z"
  }
];


  // Action Plans flat cache — so Brief and Dashboard surface the 150 actions
  // even before Lewis visits the Action Plans page.
  var actionPlansFull = [
  {
    "id": "lewis_1",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 1,
    "text": "Define & communicate the business strategy & vision for the next 3 years",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_2",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 2,
    "text": "Set individual roles & responsibilities with clear accountabilities. Create performance management structure",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_3",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 3,
    "text": "Create operational plan for all core business functions — technology, service, product, sales, marketing, governance etc",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_4",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 4,
    "text": "Build company culture — how decisions are made, what behaviours are rewarded, speed of execution, ownership expectations, internal communication, response to failure",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_5",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 5,
    "text": "Close 3 signed strategic partnership agreements (insurance, occupational health or employee benefits) before year-end",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_6",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 6,
    "text": "Set VYVE's 2026 OKRs with the full team — one set of quarterly targets per person, reviewed in a monthly all-hands",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_7",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 7,
    "text": "Build the VYVE investor/funding pitch deck to Series A standard: problem, market size, solution, traction, team and financial ask",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_8",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 8,
    "text": "Ensure the business is financially sustainable — define and achieve the revenue targets, pricing model and cost base required for bottom-line sustainability, managing cash runway and budget discipline alongside Ryan (FD)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_9",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 9,
    "text": "Drive execution — prioritised focus, remove blockers — support all areas",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_10",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 10,
    "text": "Establish weekly & monthly team performance reviews against individual and business priorities",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_11",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 11,
    "text": "Run a 14-day planning sprint with Alan and Dean to lock MVP launch scope, go-live date and launch marketing plan",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_12",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 12,
    "text": "Recruit leading talent for the VYVE mission — setting hiring standards, build leadership capability, remove poor-fit hires quickly",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_13",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 13,
    "text": "Secure 3 employer pilots live by September 2026",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_14",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 14,
    "text": "Choose 2 funding routes (grant, angel or accelerator) and formally kick off the application process by end of May 2026",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "lewis_15",
    "member_id": "lewis",
    "member_name": "Lewis Vines",
    "position": 15,
    "text": "Create shared workspace for the full team — hosting key actions, documents and the operational intel hub",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_1",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 1,
    "text": "Diagnose and fix Apple vs Android performance parity issues identified in the 08/05/26 workshop — report resolution within 2 weeks",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_2",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 2,
    "text": "Define and lock the MVP feature scope in writing with Lewis and Alan before any Phase 2 development begins",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_3",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 3,
    "text": "Resolve the app loading speed issue — set a target load time SLA and track it in the weekly tech health report",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_4",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 4,
    "text": "Simplify the app UI: reduce on-screen text and numbers, increase visual clarity and redesign main tabs to Physical, Mind and Connect",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_5",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 5,
    "text": "Implement SSO via SAML or OAuth — a hard requirement for enterprise clients and a blocker to closing larger deals",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_6",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 6,
    "text": "Build the employer dashboard MVP: active user %, engagement trend and pillar breakdown by month — live before first enterprise deal",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_7",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 7,
    "text": "Integrate CRM fully so client onboarding, engagement data and reporting flow without manual intervention",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_8",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 8,
    "text": "Implement a GDPR-compliant data architecture: individual user data is never visible to employers, only aggregated insights",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_9",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 9,
    "text": "Build the internal tech platform — track performance, actions, progress, insight, projects, planning etc",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_10",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 10,
    "text": "Set up a staging environment so every feature is tested against production data before going live — no more direct-to-prod releases",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_11",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 11,
    "text": "Build wearable integration (Apple Health / Google Fit) into the physical pillar — a key differentiator in enterprise sales",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_12",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 12,
    "text": "Schedule penetration testing with a certified third party — minimum annually, ideally twice a year from launch",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_13",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 13,
    "text": "Produce a monthly tech health report (uptime %, load speed, bugs raised vs resolved, sprint velocity — shared with Lewis) and maintain a running log of all technical decisions and technical debt so knowledge is not locked in one person",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_14",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 14,
    "text": "Identify resource gaps and maintain a technology risk register: flag skill gaps, delivery blockers and third-party dependencies to Lewis and Alan monthly — ensuring VYVE can plan and resource critical build phases ahead of time",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "dean_15",
    "member_id": "dean",
    "member_name": "Dean",
    "position": 15,
    "text": "Produce a 6-month technical roadmap that maps directly against the commercial GTM calendar — reviewed monthly with Alan",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_1",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 1,
    "text": "Define VYVE's pricing tiers in a locked document — entry, core and enterprise — with clear feature gates and annual contract terms",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_2",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 2,
    "text": "Write the Product Requirements Document for MVP: every feature defined with acceptance criteria, priority and owner",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_3",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 3,
    "text": "Define the Ideal Customer Profile in writing: company size, sector, HR team maturity, budget bracket and buying trigger",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_4",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 4,
    "text": "Build the commercial model: CAC, LTV, churn assumptions and break-even by month — updated monthly with Ryan (FD)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_5",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 5,
    "text": "Map the full customer journey from first awareness to annual renewal — every touchpoint, owner and success metric",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_6",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 6,
    "text": "Build a feature prioritisation framework (impact vs effort) and run it with the team at the start of every sprint",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_7",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 7,
    "text": "Run pricing sensitivity conversations with 5 potential clients: understand the ceiling before the product launches — Vicki to support",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_8",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 8,
    "text": "Set up product feedback loops: in-app survey, monthly client calls and usage analytics — all feeding a single product backlog",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_9",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 9,
    "text": "Build the weekly KPI dashboard: active user %, pillar usage, monthly retention rate and NPS — reviewed every Monday",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_10",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 10,
    "text": "Write the VYVE onboarding process: exactly what a new client experiences in their first 48 hours and first 30 days — agreed and co-owned with Vicki",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_11",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 11,
    "text": "Define what a successful MVP launch looks like numerically — user targets, retention floor, NPS minimum — agreed with Lewis",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_12",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 12,
    "text": "Build a competitor monitoring process: check each key competitor monthly for new features, pricing changes and funding news (Hub is created)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_13",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 13,
    "text": "Write the full GTM playbook: ICP, outbound sequence, demo structure, proposal template and objection-handling guide",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_14",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 14,
    "text": "Document the partner product requirements: what VYVE must offer technically and contractually for integration into benefits platforms",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "alan_15",
    "member_id": "alan",
    "member_name": "Alan",
    "position": 15,
    "text": "Define the mental health service levels and partner handoff model — inform/assess/refer — in writing before Q3 launch",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_1",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 1,
    "text": "Define the overall VYVE physical health strategy and channel approach: positioning, what makes VYVE's physical offer distinct and valuable, channel mix (app, live, partnerships) and target user journeys — then define the Phase 1, 2 & 3 of the service: exact workout count, session types, who delivers them and recorded vs live split",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_2",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 2,
    "text": "Record the full workout programme library — weight loss, strength, muscle gain, running and all-rounder — min 4-week progression per goal (male & female)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_3",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 3,
    "text": "Design progressive pathways for each programme: beginner to intermediate to advanced, with clear progression triggers",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_4",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 4,
    "text": "Write the nutrition guidance brief that pairs with each workout goal — practical, evidence-based and written for everyday people",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_5",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 5,
    "text": "Develop a monthly physical challenge format any client company can run with their workforce with no facilitation required",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_6",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 6,
    "text": "Build a partner content pipeline: 3 external fitness or physiotherapy experts contributing content every quarter",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_7",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 7,
    "text": "Manage the quality of all physical health content in VYVE's channel — defining content standards, sourcing expert-created content, creating original content where relevant, and applying a clinical safety checklist to every piece before publication",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_8",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 8,
    "text": "Recruit & manage physical health partners — coaches, speakers, venues and organise timetable of services",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_9",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 9,
    "text": "Develop the step and activity challenge framework that integrates with wearables and VYVE in-app tracking",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_10",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 10,
    "text": "Build the live and group class schedule — minimum 2 sessions per week confirmed with dates and format (phased approach, as we grow the plan grows)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_11",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 11,
    "text": "Write an employer-facing guide: how the physical pillar reduces musculoskeletal absence and how to communicate it internally",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_12",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 12,
    "text": "Run a structured pilot of the physical programme with a test group of 10+ people — capture feedback, measure engagement, iterate",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_13",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 13,
    "text": "Build a seasonal content calendar so physical content aligns with January goals, summer activity and autumn reset moments",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_14",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 14,
    "text": "Define the metrics for physical pillar success: target active engagement %, average sessions per user and retention benchmark",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "calum_15",
    "member_id": "calum",
    "member_name": "Calum",
    "position": 15,
    "text": "Set up a master content library with version control so every asset is findable and no content is ever lost or duplicated",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_1",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 1,
    "text": "Define the overall mental health channel strategy for VYVE — how the mental health pillar stands out and delivers a valued service, the channel mix (digital, live, partner), target audience and partner selection rationale — then define service levels: inform / assess / refer — with clear partner handoff criteria agreed with Alan, from introductory wellness to full mental health service",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_2",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 2,
    "text": "Design the full CBT programme structure: session count, weekly themes, homework exercises and outcomes tracking method",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_3",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 3,
    "text": "Create the sleep support content suite: sleep hygiene guide, wind-down routine, 7-night sleep challenge and progress tracker",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_4",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 4,
    "text": "Build the clinical governance framework: how mental health content is reviewed, approved and kept up to date",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_5",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 5,
    "text": "Write and publish the crisis pathway: what happens if a user signals distress — escalation steps, signposting and safeguarding protocol",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_6",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 6,
    "text": "Write the mental health welcome module: sets expectations, normalises help-seeking and reduces stigma from day one",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_7",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 7,
    "text": "Build the Mental Health First Aid content package that employer organisations can deploy internally",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_8",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 8,
    "text": "Create a 12-month mental health content calendar aligned to key dates: MHAD, Stress Awareness Month, World Suicide Prevention Day",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_9",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 9,
    "text": "Define the outcomes measurement framework: how VYVE demonstrates the mental health pillar is working for clients",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_10",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 10,
    "text": "Develop a manager guide module: spotting signs of struggle, how to have the conversation and where to signpost",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_11",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 11,
    "text": "Create the stress and resilience workshop — deliverable as both a digital self-paced course and an in-person session",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_12",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 12,
    "text": "Identify and brief 2 external clinical collaborators to peer-review all mental health content before it goes live",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_13",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 13,
    "text": "Develop the EAP integration guidance document: how VYVE complements an existing EAP and how to communicate that to clients",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_14",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 14,
    "text": "Define and scope the self-assessment tool & wellbeing Hub: what it measures, who it's for and how results feed into personalised content",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "phil_15",
    "member_id": "phil",
    "member_name": "Phil",
    "position": 15,
    "text": "Run a full content quality audit on all mental health material before launch — checking clinical accuracy, tone, inclusivity and safeguarding",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_1",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 1,
    "text": "Build a comprehensive sales plan and approach for VYVE — covering target market segmentation, sales strategy, process design and commercial priorities — which serves as the framework for all sales activity, including a 50-name priority target account list segmented by size, sector and wellbeing signals",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_2",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 2,
    "text": "Write and implement a structured outbound sales sequence: first contact, follow-up, demo booking and proposal with approved email templates",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_3",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 3,
    "text": "Review and approve all email marketing templates end-to-end — confirm logic of engagement structure with Dean and Azuza",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_4",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 4,
    "text": "Build a 20-minute demo script and a 45-minute full presentation — both reviewed and approved by Lewis before first use",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_5",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 5,
    "text": "Create the VYVE proposal template: a single document personalisable per prospect in under 30 minutes",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_6",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 6,
    "text": "Set up HubSpot pipeline stages and ensure every active prospect has a logged next action, close date and deal probability",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_7",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 7,
    "text": "Run 10 discovery calls in the first 30 days — log every objection and buying signal in HubSpot immediately after each call",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_8",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 8,
    "text": "Write the account management playbook: what the client relationship looks like month by month from signing to renewal",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_9",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 9,
    "text": "Define the renewal and upsell process: when the conversation starts, who triggers it and what the upsell pathway looks like",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_10",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 10,
    "text": "Identify and attend 3 HR, People or wellbeing events in 2026 where VYVE target clients are most likely to be present",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_11",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 11,
    "text": "Write the client onboarding checklist: what a new corporate client experiences in their first 30 days — every step, every owner",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_12",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 12,
    "text": "Build the partner sales channel: identify the first 3 referral partners, agree commission terms and brief them on the proposition",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_13",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 13,
    "text": "Set monthly revenue targets with Alan for 2026 and present a pipeline report against those targets every week",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_14",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 14,
    "text": "Run a win and loss analysis after every closed deal — document what won or lost it and feed findings into the sales playbook",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "vicki_15",
    "member_id": "vicki",
    "member_name": "Vicki",
    "position": 15,
    "text": "Lead business tender responses: build the tender library, own the submission process and brief in contributors with clear deadlines",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_1",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 1,
    "text": "Define the community strategy and phased launch plan for VYVE — covering community vision, target audience, content approach, engagement mechanics, partnership model, community KPIs and milestone-based phases from pre-launch through growth",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_2",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 2,
    "text": "Confirm and launch the Connect challenge event for 1st June 2026 — date, format, promotion plan and participation target locked in writing",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_3",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 3,
    "text": "Complete the Everyman Charity CIC registration — file all required documents, confirm charitable objects and appoint founding trustees (Lewis to support)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_4",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 4,
    "text": "Design the 1-in-5 pledge mechanics end-to-end: how a corporate payment triggers a community seat and how it is tracked and reported",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_5",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 5,
    "text": "Build the ambassador programme: recruitment criteria, training curriculum, recognition system and comms toolkit",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_6",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 6,
    "text": "Identify and onboard 10 founding ambassadors from the existing personal and VYVE network — run first training session",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_7",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 7,
    "text": "Confirm 4 community events for 2026 — dates, venues, themes and speakers locked in writing",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_8",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 8,
    "text": "Write the community events playbook so any VYVE client can run a local event under the VYVE brand without central support",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_9",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 9,
    "text": "Define and activate the partner charity strategy: which organisations VYVE formally aligns with (e.g. Parkrun, mental health charities)",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_10",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 10,
    "text": "Explore a MyFitnessPal partnership — assess integration fit, content collaboration opportunity and commercial terms",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_11",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 11,
    "text": "Build a community events sponsor and partner model: how local businesses can co-fund or co-brand VYVE events",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_12",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 12,
    "text": "Write the quarterly community impact report template — a document clients can share internally to evidence their CSR value",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_13",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 13,
    "text": "Set up an online community space (app-based or forum) where VYVE members can connect and support each other between events",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_14",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 14,
    "text": "Build the Everyman Charity fundraising strategy: how VYVE raises funds beyond the 1-in-5 pledge through events, grants and corporate giving",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "cole_15",
    "member_id": "cole",
    "member_name": "Cole",
    "position": 15,
    "text": "Define the VYVE tagline and community vision statement — a big, powerful line capturing 'force for good / movement' positioning",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_1",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 1,
    "text": "Write and publish the VYVE brand guidelines document: tone of voice, visual identity rules, messaging hierarchy and do/do-not examples",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_2",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 2,
    "text": "Launch VYVE's Instagram and LinkedIn channels with a 3-month content calendar locked, approved and ready to publish before going live",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_3",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 3,
    "text": "Build the social media content plan: post schedule, content mix and platform-specific formats — 3 months planned in advance at all times",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_4",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 4,
    "text": "Build the influencer programme: identify 10 health, wellness and workplace micro-influencers, brief the first 3 and agree content terms",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_5",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 5,
    "text": "Write and distribute VYVE's first press release — announce the CIC launch, the 1-in-5 pledge and the founding team story",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_6",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 6,
    "text": "Build the B2C acquisition funnel: map content to each stage from awareness to active membership, with conversion targets per stage",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_7",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 7,
    "text": "Launch email marketing: build the subscriber list, write the welcome sequence and define the monthly newsletter format and frequency",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_8",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 8,
    "text": "Create the SEO content strategy: identify 10 target keywords, brief 6 months of blog content and agree publication schedule",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_9",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 9,
    "text": "Set up brand monitoring: Google Alerts, social listening tools and a weekly review of VYVE and key competitor mentions",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_10",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 10,
    "text": "Run 3 proactive PR pitches in 2026 to tier-1 HR and business media — People Management, HR Magazine and one national outlet",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_11",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 11,
    "text": "Build the employer marketing collateral pack: company brochure, one-page sales leave-behind, case study template and sales presentation",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_12",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 12,
    "text": "Set up monthly marketing reporting: reach, engagement, leads generated and cost per lead — all flowing into HubSpot for Lewis and Alan",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_13",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 13,
    "text": "Build the VYVE website to conversion standard: clear value proposition above the fold, social proof section and a demo booking CTA",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_14",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 14,
    "text": "Run a brand awareness baseline survey with 20 target buyers before any paid marketing activity — to measure lift over time",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "azuza_15",
    "member_id": "azuza",
    "member_name": "Azuza",
    "position": 15,
    "text": "Support Cole with community challenge promotion — own the social media amplification plan for the 1st June Connect launch",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_1",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 1,
    "text": "Set up a cloud accounting system (Sage) with chart of accounts, bank feeds connected and opening balances entered",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_2",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 2,
    "text": "Open a dedicated VYVE CIC business bank account and set up Stripe with proper reconciliation and expense controls",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_3",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 3,
    "text": "Build the 12-month rolling cash flow forecast — updated monthly and shared with Lewis as the primary financial decision-making tool",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_4",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 4,
    "text": "Produce the annual budget for FY2026/27: revenue targets by channel, headcount cost, tech spend and marketing investment",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_5",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 5,
    "text": "Build the financial model underpinning the investor pitch: unit economics, LTV:CAC ratio, break-even month and 3-year P&L projection",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_6",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 6,
    "text": "Prepare the financial due diligence pack: management accounts, bank statements, contracts summary and cap table — investor-ready",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_7",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 7,
    "text": "Define and own financial KPIs for the monthly dashboard: MRR, gross margin, burn rate, runway and CAC — reviewed with Alan weekly",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_8",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 8,
    "text": "Manage CIC financial compliance: annual accounts filing, CIC34 community interest report and Companies House obligations",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_9",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 9,
    "text": "Set up payroll for any salaried team members and ensure PAYE, NI and pension auto-enrolment are correctly administered",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_10",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 10,
    "text": "Build a VAT compliance process: determine registration threshold, configure accounting system and set up quarterly return schedule",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_11",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 11,
    "text": "Identify and apply for 2 relevant grants in 2026 — Innovate UK, Nesta, Sport England or NHS health tech funding rounds — Lewis, Alan & Vicki to support",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_12",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 12,
    "text": "Define the pricing model financial floor: minimum viable price per seat that covers costs and delivers target margin, shared with Alan",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_13",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 13,
    "text": "Set up an expense management process: policy document, approval workflow and monthly reconciliation — no untracked spend",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_14",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 14,
    "text": "Produce monthly management accounts by the 10th of each month: P&L, balance sheet, cash position and variance vs budget",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "ryan_15",
    "member_id": "ryan",
    "member_name": "Ryan Hewitt",
    "position": 15,
    "text": "Review all contractor and supplier contracts for financial risk — flag payment terms, auto-renewals and liability clauses to Lewis",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_1",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 1,
    "text": "Review and advise on all current contractor agreements — flag gaps in IP assignment, confidentiality and termination clauses",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_2",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 2,
    "text": "Produce a lightweight employee handbook covering conduct, holidays, expenses, disciplinary process and remote working policy",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_3",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 3,
    "text": "Lead product-market fit advisory input: challenge assumptions on target customer, value proposition and pricing based on HR buyer perspective",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_4",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 4,
    "text": "Define the performance review framework: how VYVE assesses, documents and acts on team performance quarterly",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_5",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 5,
    "text": "Facilitate a team values and culture session — outputs become the VYVE internal culture code and inform hiring criteria",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_6",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 6,
    "text": "Advise on equity and option schemes: EMI scheme eligibility, vesting schedule design and how to use equity to retain key people",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_7",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 7,
    "text": "Review GDPR compliance for all employee and contractor data handling — confirm DPA obligations and any DPO requirements",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_8",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 8,
    "text": "Provide monthly CEO advisory session with Lewis: 60 minutes, strategic sounding board, leadership challenges and board readiness",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_9",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 9,
    "text": "Advise on compensation benchmarking: review current contractor rates and any salaried roles against UK market data",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_10",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 10,
    "text": "Advise on org structure and hiring plan for the next 12 months — define which roles are needed and in what order",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_11",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 11,
    "text": "Define the VYVE employer brand: what VYVE promises its own people and how that story is told in talent attraction",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_12",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 12,
    "text": "Build a structured onboarding process for new team members: week 1 schedule, key introductions, tools access and 30-60-90 plan template",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_13",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 13,
    "text": "Advise on client HR due diligence requirements: what larger corporates will ask about VYVE's own people practices before signing",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_14",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 14,
    "text": "Review team meeting and governance cadence — advise on board meeting structure, decision rights and escalation protocols",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
  },
  {
    "id": "hr-director_15",
    "member_id": "hr-director",
    "member_name": "Non-Exec HR Director",
    "position": 15,
    "text": "Identify and recommend 1 additional non-exec or advisor with commercial or clinical expertise to strengthen the VYVE board",
    "status": "not-started",
    "due": "",
    "progress": 0,
    "notes": "",
    "updated_at": ""
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


  // ----------- Phase 2 seeding calls -----------
  // Strategy (each sub-key independent)
  if (seedKeyAny('vyve_strategy_northstar', strategyNorthstar)) didSeed = true;
  if (seedKeyAny('vyve_strategy_mv',        strategyMV))        didSeed = true;
  if (seedKey   ('vyve_strategy_okrs',      strategyOKRs))      didSeed = true;
  if (seedKey   ('vyve_strategy_decisions', strategyDecisions)) didSeed = true;
  if (seedKeyAny('vyve_strategy_swot',      strategySWOT))      didSeed = true;

  // Team / Knowledge / Tasks / Partners
  if (seedKey('vyve_team',      teamMembers))      didSeed = true;
  if (seedKey('vyve_knowledge', knowledgeEntries)) didSeed = true;
  if (seedKey('vyve_tasks',     tasksEntries))     didSeed = true;
  if (seedKey('vyve_partners',  partnersEntries))  didSeed = true;

  // Phase 3 seeds
  if (seedKey('vyve_compliance', complianceEntries)) didSeed = true;
  if (seedKey('vyve_sessions',   sessionsEntries))   didSeed = true;
  if (seedKey('vyve_deals',      dealsEntries))      didSeed = true;
  if (seedKey('vyve_clients',    clientsEntries))    didSeed = true;
  if (seedKey('vyve_investors',  investorsEntries))  didSeed = true;

  // Action Plans flat cache — for Brief/Dashboard to surface action plans before
  // user visits the Action Plans page. seedKey only writes if key is missing/empty,
  // so user edits via Action Plans page (which rewrites this key) are preserved.
  if (seedKey('vyve_action_plans_full', actionPlansFull)) didSeed = true;

  try { localStorage.setItem(SEED_FLAG, SEED_VERSION); } catch(e) {}

  if (didSeed && window.console) {
    console.log('[VYVE/seed] Loaded real data: ' + performance.length + ' analytics, ' + podcastEps.length + ' episodes, ' + contentItems.length + ' content items, ' + teamMembers.length + ' team, ' + knowledgeEntries.length + ' KB, ' + tasksEntries.length + ' tasks, ' + partnersEntries.length + ' partners, ' + strategyOKRs.length + ' OKRs, ' + strategyDecisions.length + ' decisions, ' + complianceEntries.length + ' compliance, ' + sessionsEntries.length + ' sessions, ' + dealsEntries.length + ' deals, ' + clientsEntries.length + ' clients, ' + investorsEntries.length + ' investors, ' + actionPlansFull.length + ' action plans');
  }
})();
