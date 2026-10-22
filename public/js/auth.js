/* Office Hub: ระบบสมาชิก (Supabase Auth) — สมัคร / เข้าสู่ระบบ / Google / Microsoft
   เก็บ access token ของ Google และ Microsoft ที่ได้ตอนเชื่อมต่อไว้ในเบราว์เซอร์ (ใช้ได้ราว 1 ชั่วโมง แล้วต้องเชื่อมใหม่) */
(() => {
  'use strict';
  const C = window.HUB_CONFIG || {};
  const enabled = !!(C.supabaseUrl && C.supabaseAnonKey && window.supabase && window.supabase.createClient);
  const TOKENS = 'office-hub-tokens';
  const PENDING = 'office-hub-pending-provider';
  const listeners = [], settingsListeners = [];
  let client = null, user = null, ready = false;
  // which sign-in methods are switched on in Supabase (read from its public settings endpoint)
  let providers = { email: true, google: true, azure: true }, providersKnown = false;

  const readTokens = () => { try { return JSON.parse(localStorage.getItem(TOKENS) || '{}'); } catch (e) { return {}; } };
  const writeTokens = v => { try { localStorage.setItem(TOKENS, JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  const emit = () => listeners.forEach(fn => { try { fn(user); } catch (e) { console.error(e); } });

  // Only trust provider_token right after we sent the person to Google / Microsoft ourselves.
  function captureProviderToken(session) {
    let pending = null;
    try { pending = sessionStorage.getItem(PENDING); } catch (e) { /* ignore */ }
    if (!pending || !session || !session.provider_token) return;
    try { sessionStorage.removeItem(PENDING); } catch (e) { /* ignore */ }
    const t = readTokens();
    t[pending] = { token: session.provider_token, exp: Date.now() + 55 * 60 * 1000 };
    writeTokens(t);
  }
  function cleanUrl() {
    if (!/[?&](code|error)=/.test(location.search)) return;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
  }

  if (enabled) {
    client = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
    });
    client.auth.onAuthStateChange((event, session) => {
      captureProviderToken(session);
      user = session ? session.user : null;
      if (event === 'SIGNED_OUT') writeTokens({});
      ready = true;
      cleanUrl();
      // let the app react after Supabase finishes its own work
      setTimeout(emit, 0);
    });
    fetch(C.supabaseUrl.replace(/\/+$/, '') + '/auth/v1/settings', { headers: { apikey: C.supabaseAnonKey } })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('settings ' + r.status))))
      .then(s => {
        const ext = s.external || {};
        providers = { email: !!ext.email, google: !!ext.google, azure: !!ext.azure };
        providersKnown = true;
        settingsListeners.forEach(fn => { try { fn(providers); } catch (e) { console.error(e); } });
      })
      .catch(() => { /* unknown: keep every button and let Supabase report errors */ });
  }

  const here = () => location.origin + location.pathname;
  const providerOf = id => ({ gmail: 'google', youtube: 'google', onedrive: 'azure' }[id] || null);
  const hasIdentity = p => !!(user && (user.identities || []).some(i => i.provider === p));

  function need() { if (!client) throw new Error('ยังไม่ได้ตั้งค่าระบบสมาชิก'); }

  window.HubAuth = {
    enabled,
    isReady: () => !enabled || ready,
    user: () => user,
    onChange(fn) { listeners.push(fn); },
    onSettings(fn) { settingsListeners.push(fn); if (providersKnown) fn(providers); },
    // true when this sign-in method is switched on (or when Supabase could not tell us)
    providerReady: p => !providersKnown || !!providers[p],
    providerOf,

    async signUp(email, password, name) {
      need();
      const { data, error } = await client.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: here() } });
      if (error) throw error;
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) {
      need();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async resetPassword(email) {
      need();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: here() });
      if (error) throw error;
    },
    // Sign in with Google / Microsoft, or connect it to the account that is already signed in.
    async oauth(provider) {
      need();
      const scopes = provider === 'google' ? C.googleScopes : C.microsoftScopes;
      const options = { redirectTo: here(), scopes };
      if (provider === 'google') options.queryParams = { access_type: 'offline', prompt: 'consent' };
      try { sessionStorage.setItem(PENDING, provider); } catch (e) { /* ignore */ }
      const { error } = user && !hasIdentity(provider)
        ? await client.auth.linkIdentity({ provider, options })
        : await client.auth.signInWithOAuth({ provider, options });
      if (error) { try { sessionStorage.removeItem(PENDING); } catch (e) { /* ignore */ } throw error; }
    },
    async signOut() { if (client) await client.auth.signOut(); writeTokens({}); },

    token(provider) { const t = readTokens()[provider]; return t && t.exp > Date.now() ? t.token : null; },
    forget(provider) { const t = readTokens(); delete t[provider]; writeTokens(t); },
    displayName() {
      if (!user) return '';
      const m = user.user_metadata || {};
      return m.name || m.full_name || (user.email || '').split('@')[0];
    }
  };
})();
