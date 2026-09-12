/* PM-1208: VYVE Physio Portal — the second face of the portal engine. Built from src/portal/ (see README):
   shared slices (REST layer, auth, exercise library + preview sheet) plus physio/app.js. No coaching code is
   included; tools/build-portals.js refuses the page if any included slice references a name that is not here. */
(function(){
  'use strict';
