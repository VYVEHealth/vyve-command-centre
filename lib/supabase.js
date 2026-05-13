// =====================================================================
// VYVE Command Centre — Supabase client
// Shared Supabase project with portal (ixjfklpckgxrwjlfsaaz, confirmed by Dean).
// Reads URL + anon key from window.VYVE_CONFIG.supabase (set by settings page
// or hardcoded once Dean provides the anon key).
//
// IMPORTANT: schema, RLS and Edge Functions are Dean's territory.
// This file does not assume table shapes — it just exposes the client.
// =====================================================================

(function(){
  'use strict';

  var SUPABASE_URL = 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
  var _client = null;
  var _stub = false;

  function cfg() {
    return (window.VYVE_CONFIG && window.VYVE_CONFIG.supabase) || {};
  }

  function getClient() {
    if (_client) return _client;

    var anonKey = cfg().anonKey || '';
    var url = cfg().url || SUPABASE_URL;

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.warn('[VYVE/supabase] supabase-js library not loaded.');
      _client = stubClient();
      _stub = true;
      return _client;
    }
    if (!anonKey) {
      console.warn('[VYVE/supabase] No anon key configured. Set VYVE_CONFIG.supabase.anonKey or update settings.');
      _client = stubClient();
      _stub = true;
      return _client;
    }

    _client = window.supabase.createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    _stub = false;
    return _client;
  }

  // A no-op client that returns empty results so pages don't crash before configuration.
  function stubClient() {
    var chain = {
      select: function(){ return Promise.resolve({ data: [], error: { message: 'supabase not configured' } }); },
      insert: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); },
      update: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); },
      delete: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); },
      eq: function(){ return chain; },
      neq: function(){ return chain; },
      in: function(){ return chain; },
      order: function(){ return chain; },
      limit: function(){ return chain; },
      single: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); }
    };
    return {
      from: function(){ return chain; },
      auth: {
        getSession: function(){ return Promise.resolve({ data: { session: null }, error: null }); },
        signInWithOtp: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); },
        signOut: function(){ return Promise.resolve({ error: null }); },
        onAuthStateChange: function(){ return { data: { subscription: { unsubscribe: function(){} } } }; }
      },
      functions: {
        invoke: function(){ return Promise.resolve({ data: null, error: { message: 'supabase not configured' } }); }
      }
    };
  }

  window.VYVE_SUPABASE = {
    client: getClient,
    isStub: function(){ return _stub; },
    url: function(){ return cfg().url || SUPABASE_URL; }
  };
})();
