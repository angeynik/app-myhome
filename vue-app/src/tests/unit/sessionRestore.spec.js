// src/tests/unit/sessionRestore.spec.js
// Восстановление сессии после открытия сокета (websocket/onConnected)
// и обработка accessError (auth/handleAccessError).

jest.mock('@/store/modules/logger', () => ({
  info: jest.fn(), dev: jest.fn(), warn: jest.fn(), error: jest.fn(),
  isInfoEnabled: () => false, isDevEnabled: () => false, isErrorEnabled: () => false,
}));

import websocket from '@/store/modules/websocket';
import auth from '@/store/modules/auth';

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('websocket/onConnected', () => {
  function makeContext({ token = 'jwt', resumeResult = { username: 'u' }, config = {} } = {}) {
    const rootState = { auth: { token } };
    const dispatch = jest.fn(async (action) => {
      if (action === 'auth/resume') {
        if (!resumeResult) rootState.auth.token = '';
        return resumeResult;
      }
      return undefined;
    });
    return {
      rootState,
      dispatch,
      rootGetters: { dID: 'igumen', 'config/getConfig': () => config },
    };
  }

  test('без токена ничего не делает', async () => {
    const ctx = makeContext({ token: '' });
    await expect(websocket.actions.onConnected(ctx, {})).resolves.toBeNull();
    expect(ctx.dispatch).not.toHaveBeenCalled();
  });

  test('первое подключение: resume и загрузка конфигурации, если её ещё нет', async () => {
    const ctx = makeContext();
    await websocket.actions.onConnected(ctx, { isReconnect: false });
    await flush();
    expect(ctx.dispatch).toHaveBeenCalledWith('auth/resume', null, { root: true });
    expect(ctx.dispatch).toHaveBeenCalledWith('initializeSetpointsManager', null, { root: true });
    expect(ctx.dispatch).toHaveBeenCalledWith('config/initialize', null, { root: true });
  });

  test('после восстановления сессии — подписка на камеры и список камер (для вкладки «Видеонаблюдение»)', async () => {
    const ctx = makeContext();
    await websocket.actions.onConnected(ctx, {});
    expect(ctx.dispatch).toHaveBeenCalledWith('video/resubscribe', null, { root: true });
    expect(ctx.dispatch).toHaveBeenCalledWith('video/requestCameras', null, { root: true });
  });

  test('конфигурация уже загружена: перезапрос вместо полной инициализации', async () => {
    const ctx = makeContext({ config: { room01: {} } });
    await websocket.actions.onConnected(ctx, { isReconnect: true });
    expect(ctx.dispatch).toHaveBeenCalledWith('config/refreshConfig', null, { root: true });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('config/initialize', null, { root: true });
  });

  test('сервер отверг токен: переход на вход', async () => {
    const ctx = makeContext({ resumeResult: null });
    await websocket.actions.onConnected(ctx, {});
    expect(ctx.dispatch).toHaveBeenCalledWith('auth/redirectToLogin', null, { root: true });
  });

  test('нет связи при resume (токен сохранён): без выхода и без загрузки данных', async () => {
    const ctx = makeContext();
    ctx.dispatch.mockImplementation(async () => null); // resume вернул null, токен на месте
    await websocket.actions.onConnected(ctx, {});
    expect(ctx.dispatch).not.toHaveBeenCalledWith('auth/redirectToLogin', null, { root: true });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('config/initialize', null, { root: true });
  });

  test('main.js ждёт результат через whenSessionReady', async () => {
    await expect(websocket.actions.whenSessionReady()).resolves.toBeNull();
  });
});

describe('auth/handleAccessError', () => {
  function makeContext({ token = 'jwt', resume } = {}) {
    const state = { token };
    const dispatch = jest.fn(async (action) => {
      if (action === 'resume') return resume(state);
      return undefined;
    });
    return { state, dispatch };
  }

  test.each(['NO_SESSION', 'TIMEOUT'])('%s: сначала resume, при успехе остаёмся в системе и перезапрашиваем данные', async (code) => {
    const ctx = makeContext({ resume: () => ({ username: 'u' }) });
    await auth.actions.handleAccessError(ctx, { code });
    expect(ctx.dispatch).toHaveBeenCalledWith('resume');
    expect(ctx.dispatch).toHaveBeenCalledWith('config/refreshConfig', null, { root: true });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('redirectToLogin');
  });

  test('NO_SESSION и отказ resume: выход на /login', async () => {
    const ctx = makeContext({ resume: (state) => { state.token = ''; return null; } });
    await auth.actions.handleAccessError(ctx, { code: 'NO_SESSION' });
    expect(ctx.dispatch).toHaveBeenCalledWith('redirectToLogin');
  });

  test('TIMEOUT и обрыв связи (токен сохранён): без выхода', async () => {
    const ctx = makeContext({ resume: () => null });
    await auth.actions.handleAccessError(ctx, { code: 'TIMEOUT' });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('redirectToLogin');
  });

  test('TOKEN_REVOKED: выход сразу, без resume', async () => {
    const ctx = makeContext({ resume: () => ({}) });
    await auth.actions.handleAccessError(ctx, { code: 'TOKEN_REVOKED' });
    expect(ctx.dispatch).not.toHaveBeenCalledWith('resume');
    expect(ctx.dispatch).toHaveBeenCalledWith('redirectToLogin');
  });

  test('без токена ошибка сессии игнорируется', async () => {
    const ctx = makeContext({ token: '', resume: () => ({}) });
    await auth.actions.handleAccessError(ctx, { code: 'NO_SESSION' });
    expect(ctx.dispatch).not.toHaveBeenCalled();
  });

  test.each([
    ['FORBIDDEN', 'Недостаточно прав'],
    ['DID_MISMATCH', 'Нет доступа к чужому источнику данных'],
  ])('%s: сообщение пользователю', async (code, message) => {
    const ctx = makeContext({ resume: () => ({}) });
    await auth.actions.handleAccessError(ctx, { code, message });
    expect(ctx.dispatch).toHaveBeenCalledWith('popup/show', expect.objectContaining({ message, type: 'error' }), { root: true });
  });
});
